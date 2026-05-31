import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Reminder } from "@/lib/reminders";
import { metersToLabel } from "@/lib/reminders";
import ClientMap from "@/components/client-map";
import { MapPin, PlusCircle, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRoles } from "@/lib/use-role";

export const Route = createFileRoute("/_authenticated/map")({
  component: MapPage,
  head: () => ({ meta: [{ title: "Map — RememberFi" }] }),
});

function MapPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [selected, setSelected] = useState<string | null>(null);
  const { tier, isStaff } = useRoles();
  const showSubscribeCta = !isStaff && tier === "free";

  useEffect(() => {
    if (!user) return;
    supabase.from("reminders").select("*").eq("user_id", user.id).eq("type", "location").eq("active", true)
      .then(({ data }) => {
        const list = (data ?? []) as Reminder[];
        setItems(list);
        if (list.length && list[0].latitude && list[0].longitude) setCenter({ lat: list[0].latitude, lng: list[0].longitude });
      });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }));
    }
  }, [user]);

  const remove = async (id: string) => {
    await supabase.from("reminders").update({ active: false }).eq("id", id);
    setItems((p) => p.filter((r) => r.id !== id));
    toast.success("Reminder deactivated");
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Map reminders</h1>
          <p className="mt-1 text-muted-foreground">All your active geofences in one view.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          {showSubscribeCta && (
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted">
              <Sparkles className="h-4 w-4" /> Subscribe now
            </Link>
          )}
          <Link to="/create" search={{ type: "location" }} className="inline-flex items-center gap-2 self-start rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            <PlusCircle className="h-4 w-4" /> New location reminder
          </Link>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[60vh] min-h-[400px]">
          <ClientMap
            center={center}
            markers={items.filter((r) => r.latitude && r.longitude).map((r) => ({
              id: r.id, lat: r.latitude!, lng: r.longitude!, radius: r.radius_m ?? undefined, label: r.title,
            }))}
          />
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No location reminders yet.
            </div>
          )}
          {items.map((r) => (
            <button key={r.id} onClick={() => { setSelected(r.id); if (r.latitude && r.longitude) setCenter({ lat: r.latitude, lng: r.longitude }); }} className={`w-full text-left rounded-2xl border p-4 transition ${selected === r.id ? "border-primary bg-primary/5 shadow-glow" : "border-border bg-card hover:bg-muted/50"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.location_name || "Unnamed place"}</div>
                  </div>
                </div>
                <span onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer">
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5">{metersToLabel(r.radius_m ?? 0)}</span>
                <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 capitalize">on {r.trigger_type}</span>
                {r.one_time ? <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5">one-time</span> : <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5">repeat</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
