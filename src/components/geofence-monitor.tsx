import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { distanceMeters, type Reminder } from "@/lib/reminders";
import { toast } from "sonner";
import { playAlert } from "@/lib/alert-sounds";

const CONSENT_STORAGE_KEY = "rmly:geo-consent:v1";

const canUseBrowserNotifications = () => typeof window !== "undefined" && "Notification" in window;
const canUseGeolocation = () => typeof window !== "undefined" && "geolocation" in navigator;

const getPreExitMargin = (radius: number) => Math.min(Math.max(40, radius * 0.15), 100);

export function GeofenceMonitor() {
  const { user } = useAuth();
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const insideRef = useRef<Map<string, boolean>>(new Map());
  const firedRef = useRef<Set<string>>(new Set());
  const preExitRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    setConsentLoaded(true);
    setHasConsent(localStorage.getItem(CONSENT_STORAGE_KEY) === "true");
    if (canUseBrowserNotifications()) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!hasConsent) return;
    if (!user) return;
    if (!canUseGeolocation()) return;

    let cancelled = false;
    let processing = false;
    let watchId: number | null = null;

    const requestNotificationPermission = async () => {
      if (!canUseBrowserNotifications()) return;
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
      } else {
        setNotificationPermission(Notification.permission);
      }
    };

    const sendBrowserNotification = (title: string, body: string) => {
      if (!canUseBrowserNotifications() || Notification.permission !== "granted") return;
      try {
        new Notification(title, { body, badge: "/favicon.ico" });
      } catch {
        // Notification failed; continue silently.
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      if (cancelled) return;
      if (err.code === err.PERMISSION_DENIED) {
        toast("Location permission denied", {
          description: "Grant location permission so your geofence reminders can trigger.",
        });
      }
    };

    const handlePosition = async (pos: GeolocationPosition) => {
      if (cancelled) return;
      if (processing) return;
      processing = true;
      try {
        const { latitude, longitude } = pos.coords;
        const [{ data }, settingsRes, soundsRes] = await Promise.all([
          supabase.from("reminders").select("*").eq("user_id", user.id).eq("type", "location").eq("active", true),
          supabase.from("user_settings").select("default_sound_id, sound_volume").eq("user_id", user.id).maybeSingle(),
          supabase.from("user_sounds").select("id, storage_path").eq("user_id", user.id),
        ]);

        if (!data) return;

        const defaultSoundId = (settingsRes.data as any)?.default_sound_id ?? "chime";
        const volume = Number((settingsRes.data as any)?.sound_volume ?? 0.8);
        const customMap = new Map<string, string>(
          ((soundsRes.data as any[]) ?? []).map((s) => [s.id as string, s.storage_path as string])
        );

        for (const r of data as Reminder[]) {
          if (r.latitude == null || r.longitude == null || !r.radius_m) continue;
          const dist = distanceMeters(latitude, longitude, r.latitude, r.longitude);
          const inside = dist <= r.radius_m;
          const prevInside = insideRef.current.get(r.id);
          insideRef.current.set(r.id, inside);

          if (prevInside === undefined) {
            if (inside) preExitRef.current.set(r.id, false);
            continue;
          }

          const entered = !prevInside && inside;
          const left = prevInside && !inside;
          const triggerType = r.trigger_type ?? "leave";
          const shouldSendEvent =
            (triggerType === "enter" && entered) ||
            (triggerType === "leave" && left) ||
            (triggerType === "both" && (entered || left));

          const radius = r.radius_m;
          const preExitMargin = getPreExitMargin(radius);
          const isNearEdge = inside && dist >= radius - preExitMargin;
          const hasPreExitWarning = preExitRef.current.get(r.id) === true;

          if (left) {
            preExitRef.current.set(r.id, false);
          }

          if (inside && dist < radius - preExitMargin) {
            preExitRef.current.set(r.id, false);
          }

          if (isNearEdge && !hasPreExitWarning && !left) {
            preExitRef.current.set(r.id, true);

            const preExitMessage = r.notes ?? `You are about to leave ${r.location_name ?? "your location"}.`;
            await supabase.from("notifications").insert({
              user_id: user.id,
              reminder_id: r.id,
              group_id: r.group_id ?? null,
              title: `${r.title} — Leaving soon`,
              message: preExitMessage,
              trigger_kind: "pre-exit",
            });
            sendBrowserNotification(`${r.title} — Leaving soon`, preExitMessage);
            toast(r.title, {
              description: preExitMessage,
            });
          }

          if (!shouldSendEvent) continue;
          if (r.one_time && firedRef.current.has(r.id)) continue;

          firedRef.current.add(r.id);
          const kind = entered ? "enter" : "leave";
          const eventMessage = r.notes ?? (entered ? `You arrived at ${r.location_name ?? "your location"}.` : `You left ${r.location_name ?? "your location"}.`);

          await supabase.from("notifications").insert({
            user_id: user.id,
            reminder_id: r.id,
            group_id: r.group_id ?? null,
            title: r.title,
            message: eventMessage,
            trigger_kind: kind,
          });

          if (r.one_time) {
            await supabase.from("reminders").update({ active: false }).eq("id", r.id);
          }

          toast(r.title, {
            description: eventMessage,
          });
          sendBrowserNotification(r.title, eventMessage);

          const reminderSound = (r as any).sound_id as string | null | undefined;
          const chosen = reminderSound ?? defaultSoundId;
          if (typeof chosen === "string" && chosen.startsWith("custom:")) {
            const cid = chosen.slice("custom:".length);
            playAlert({ customPath: customMap.get(cid), volume });
          } else {
            playAlert({ presetId: chosen, volume });
          }
        }
      } catch {
        // keep watcher alive for transient failures
      } finally {
        processing = false;
      }
    };

    requestNotificationPermission().finally(() => {
      watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      });
    });

    return () => {
      cancelled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [user, hasConsent]);

  const acceptConsent = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CONSENT_STORAGE_KEY, "true");
    setHasConsent(true);
  };

  if (!consentLoaded || hasConsent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-popover shadow-2xl">
        <div className="border-b border-border p-6">
          <h2 className="text-2xl font-semibold">Location permission required</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            RememberFi uses your device location only in your browser to detect when you enter and leave geofenced reminders. Your coordinates are never stored on a server.
          </p>
        </div>
        <div className="space-y-4 p-6 text-sm text-foreground">
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-medium">What we do</p>
            <p className="mt-1 text-muted-foreground">Monitor your position locally and compare it against saved geo nodes so reminders trigger on arrival and before exit.</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-medium">What we do not do</p>
            <p className="mt-1 text-muted-foreground">We do not transmit your coordinates, log live location to a server, or share your position with third parties.</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="font-medium">Why it’s required</p>
            <p className="mt-1 text-muted-foreground">Location permission is required for geofence reminders to work. Notifications permission is requested next so you can receive alerts.</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={acceptConsent}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            Accept and enable location
          </button>
        </div>
      </div>
    </div>
  );
}
