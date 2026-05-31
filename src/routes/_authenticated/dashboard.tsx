import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/use-role";
import type { Reminder } from "@/lib/reminders";
import { priorityColor } from "@/lib/reminders";
import { MapPin, Clock, PlusCircle, Bell, CheckCircle2, Activity, Sparkles, ArrowRight, BellRing } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { InstallInstructions } from "@/components/install-instructions";
import { triggerTestReminder } from "@/lib/reminder-tester";
import { ReminderActivityChart } from "@/components/reminder-activity-chart";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — RememberFi" }] }),
});

function Dashboard() {
  const { user } = useAuth();
  const { tier, isStaff } = useRoles();
  const showUpgrade = !isStaff && tier !== "lifetime" && tier !== "pro";
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ at: number; title: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [rem, notif, recent] = await Promise.all([
        supabase.from("reminders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "unread"),
        supabase.from("notifications").select("title,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      ]);
      setReminders((rem.data ?? []) as Reminder[]);
      setUnread(notif.count ?? 0);
      setAlerts((recent.data ?? []).map((n: any) => ({ at: new Date(n.created_at).getTime(), title: n.title })));
      setLoading(false);
    })();

    // Stream new notifications in real-time so the chart spikes when alarms fire
    const channel = supabase
      .channel("dashboard-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        setAlerts((prev) => [{ at: Date.now(), title: payload.new?.title ?? "Alert" }, ...prev].slice(0, 12));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const upcoming = reminders.filter((r) => r.type === "standard" && r.active && !r.completed_at).slice(0, 5);
  const locations = reminders.filter((r) => r.type === "location" && r.active).slice(0, 5);
  const completed = reminders.filter((r) => r.completed_at).slice(0, 5);

  return (
    <div className="p-5 md:p-10 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            {user?.user_metadata?.full_name || user?.email?.split("@")[0]} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">Here's what your memory is holding today.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => user && triggerTestReminder(user.id)}
            className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2.5 text-sm font-semibold hover:bg-muted transition"
          >
            <BellRing className="h-4 w-4 text-primary" /> Test alert
          </button>
          <Link to="/create" className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            <PlusCircle className="h-4 w-4" /> Quick create
          </Link>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Clock} label="Upcoming" value={upcoming.length} color="bg-primary/10 text-primary" />
        <Stat icon={MapPin} label="Active places" value={locations.length} color="bg-accent text-accent-foreground" />
        <Stat icon={Bell} label="Unread alerts" value={unread} color="bg-warning/20 text-warning-foreground" />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} color="bg-success/15 text-success" />
      </div>

      {/* Active monitoring indicator */}
      <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        <Activity className="h-4 w-4 text-primary" />
        <span className="font-medium">Active reminder monitoring</span>
        <span className="text-muted-foreground">— we'll alert you when you cross a geofence.</span>
      </div>

      <ReminderActivityChart
        reminderCount={reminders.filter((r) => r.active && !r.completed_at).length}
        recentAlerts={alerts}
      />

      <div className="mt-5">
        <InstallInstructions />
      </div>

      {showUpgrade && (
        <Link to="/pricing" className="mt-5 group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-gradient-primary p-5 text-primary-foreground shadow-glow hover:opacity-95 transition">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 mt-0.5" />
            <div>
              <div className="font-display font-semibold">Unlock the full RememberFi experience</div>
              <div className="text-sm opacity-90">Unlimited location reminders, AI assistant, recurring alerts, and priority support — from $4.99/mo or one-time Lifetime.</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-background/15 px-4 py-2 text-sm font-semibold backdrop-blur group-hover:bg-background/25 transition">
            See plans <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}
      <div className="mt-8 grid lg:grid-cols-2 gap-4">
        <Section title="Upcoming reminders" link="/create" linkLabel="New">
          {loading ? <Skeleton /> : upcoming.length === 0 ? (
            <Empty msg="No upcoming reminders." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((r) => (
                <li key={r.id}>
                  <Link to="/reminders/$id" params={{ id: r.id }} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:shadow-glow transition">
                    <Clock className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.due_at ? `Due ${formatDistanceToNow(new Date(r.due_at), { addSuffix: true })}` : "No due date"}
                        {r.category && ` · ${r.category}`}
                      </div>
                    </div>
                    {r.priority && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${priorityColor(r.priority)}`}>{r.priority}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Active location reminders" link="/map" linkLabel="Map">
          {loading ? <Skeleton /> : locations.length === 0 ? (
            <Empty msg="No location reminders yet." />
          ) : (
            <ul className="space-y-2">
              {locations.map((r) => (
                <li key={r.id}>
                  <Link to="/reminders/$id" params={{ id: r.id }} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:shadow-glow transition">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {r.location_name || `${r.latitude?.toFixed(3)}, ${r.longitude?.toFixed(3)}`} · {r.radius_m}m · on {r.trigger_type}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Recently completed" link="/history" linkLabel="History">
          {loading ? <Skeleton /> : completed.length === 0 ? (
            <Empty msg="Nothing completed yet." />
          ) : (
            <ul className="space-y-2">
              {completed.map((r) => (
                <li key={r.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate line-through text-muted-foreground">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.completed_at && formatDistanceToNow(new Date(r.completed_at), { addSuffix: true })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Quick create" link="/create" linkLabel="Open form">
          <div className="grid grid-cols-2 gap-2">
            <Link to="/create" search={{ type: "standard" }} className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 hover:shadow-glow transition">
              <Clock className="h-5 w-5 text-primary" />
              <div className="font-medium">Standard reminder</div>
              <div className="text-xs text-muted-foreground">Time, priority, recurring.</div>
            </Link>
            <Link to="/create" search={{ type: "location" }} className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 hover:shadow-glow transition">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="font-medium">Location reminder</div>
              <div className="text-xs text-muted-foreground">Pin a spot, set a radius.</div>
            </Link>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function Section({ title, link, linkLabel, children }: { title: string; link: string; linkLabel: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 shadow-card backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold">{title}</h2>
        <Link to={link as any} className="text-xs font-medium text-primary hover:underline">{linkLabel} →</Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{msg}</div>;
}
function Skeleton() {
  return <div className="space-y-2">
    {[0,1,2].map(i => <div key={i} className="h-12 rounded-xl bg-muted/60 animate-pulse" />)}
  </div>;
}
