import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Bell, CheckCircle2, Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — RememberFi" }] }),
});

type Notif = {
  id: string; title: string; message: string | null; status: string;
  trigger_kind: string | null; created_at: string; reminder_id: string | null;
  snoozed_until: string | null;
};

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setItems((data ?? []) as Notif[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const update = async (id: string, status: string, extra: Record<string, any> = {}) => {
    await supabase.from("notifications").update({ status, ...extra }).eq("id", id);
    load();
  };

  const markDone = async (n: Notif) => {
    if (n.reminder_id) await supabase.from("reminders").update({ completed_at: new Date().toISOString(), active: false }).eq("id", n.reminder_id);
    await update(n.id, "done");
    toast.success("Marked done");
  };

  const snooze = (n: Notif) => {
    const until = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    update(n.id, "snoozed", { snoozed_until: until });
    toast.success("Snoozed 10 minutes");
  };

  return (
    <div className="p-5 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted-foreground">Alerts triggered by your reminders.</p>
        </div>
        <Bell className="h-6 w-6 text-primary" />
      </div>

      <div className="mt-6 space-y-2">
        {loading && <div className="rounded-2xl bg-muted h-20 animate-pulse" />}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            You're all caught up. ✨
          </div>
        )}
        {items.map((n) => (
          <div key={n.id} className={`rounded-2xl border p-4 shadow-card ${n.status === "unread" ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{n.title}</span>
                  {n.trigger_kind && <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs capitalize">{n.trigger_kind}</span>}
                  <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</span>
                </div>
                {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => markDone(n)} className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 text-success border border-success/30 px-2.5 py-1 text-xs font-medium hover:bg-success/25">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark done
                  </button>
                  <button onClick={() => snooze(n)} className="inline-flex items-center gap-1.5 rounded-lg bg-warning/20 text-warning-foreground border border-warning/40 px-2.5 py-1 text-xs font-medium hover:bg-warning/30">
                    <Clock className="h-3.5 w-3.5" /> Snooze 10 min
                  </button>
                  <button onClick={() => update(n.id, "dismissed")} className="inline-flex items-center gap-1.5 rounded-lg bg-muted text-muted-foreground border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted/70">
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
