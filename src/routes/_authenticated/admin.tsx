import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/lib/use-role";
import { Users, DollarSign, Brain, AlertTriangle, Crown, Sparkles, MapPin, Clock, ShieldOff, Inbox, LifeBuoy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { AdminCharts } from "@/components/admin-charts";
import { MrInfinityIcon } from "@/components/mr-infinity-icon";
import { SovereignSeal } from "@/components/sovereign-seal";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — RememberFi" }] }),
});

type Profile = { id: string; display_name: string | null; created_at: string };
type Sub = { user_id: string; tier: string; status: string };
type Flag = { id: string; user_id: string; reason: string; severity: string; resolved: boolean; created_at: string };

const TIER_PRICE: Record<string, number> = { free: 0, plus: 4.99, pro: 12.99, lifetime: 0 };

function AdminPage() {
  const { isStaff, isOwner, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [counts, setCounts] = useState({ reminders: 0, locationReminders: 0, aiUsage: 0, lifetime: 0, openTickets: 0, urgentTickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rolesLoading) return;
    if (!isStaff) { navigate({ to: "/dashboard" }); return; }
    (async () => {
      const [p, s, f, r, lr, ai, ot, ut] = await Promise.all([
        supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("subscriptions").select("user_id, tier, status"),
        supabase.from("account_flags").select("*").eq("resolved", false).order("created_at", { ascending: false }).limit(50),
        supabase.from("reminders").select("id", { count: "exact", head: true }),
        supabase.from("reminders").select("id", { count: "exact", head: true }).eq("type", "location"),
        supabase.from("ai_usage").select("id", { count: "exact", head: true }),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "resolved"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("priority", "urgent").neq("status", "resolved"),
      ]);
      setProfiles((p.data ?? []) as Profile[]);
      setSubs((s.data ?? []) as Sub[]);
      setFlags((f.data ?? []) as Flag[]);
      const lifetimeCount = (s.data ?? []).filter((x) => x.tier === "lifetime").length;
      setCounts({
        reminders: r.count ?? 0,
        locationReminders: lr.count ?? 0,
        aiUsage: ai.count ?? 0,
        lifetime: lifetimeCount,
        openTickets: ot.count ?? 0,
        urgentTickets: ut.count ?? 0,
      });
      setLoading(false);
    })();
  }, [isStaff, rolesLoading, navigate]);

  if (rolesLoading || !isStaff) {
    return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }

  const tierCounts = subs.reduce<Record<string, number>>((acc, s) => { acc[s.tier] = (acc[s.tier] ?? 0) + 1; return acc; }, {});
  const mrr = (tierCounts.plus ?? 0) * 4.99 + (tierCounts.pro ?? 0) * 12.99;
  const lifetimeRevenue = (tierCounts.lifetime ?? 0) * 99.99;
  const subsByUser = new Map(subs.map((s) => [s.user_id, s]));

  const resolveFlag = async (id: string) => {
    const { error } = await supabase.from("account_flags").update({ resolved: true }).eq("id", id);
    if (error) return toast.error(error.message);
    setFlags((x) => x.filter((f) => f.id !== id));
    toast.success("Flag resolved");
  };

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <SovereignSeal size={64} className="hidden sm:block" />
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">{isOwner ? <><Crown className="h-3.5 w-3.5 text-primary" /> Owner control center</> : <><ShieldOff className="h-3.5 w-3.5 text-primary" /> Executive control center</>}</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              Admin dashboard
              {isOwner && <MrInfinityIcon size={40} />}
            </h1>
            <p className="mt-1 text-muted-foreground">Watch over everything. Revenue, users, AI usage, flags.</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/tickets" className="rounded-full border border-input bg-background px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2 hover:bg-muted">
            <Inbox className="h-4 w-4" /> Ticket inbox
            {counts.openTickets > 0 && <span className="ml-1 rounded-full bg-destructive text-destructive-foreground px-2 py-0.5 text-[10px]">{counts.openTickets}</span>}
          </Link>
          <Link to="/ai" className="rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
            Open AI assistant →
          </Link>
        </div>
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat icon={Users} label="Total users" value={profiles.length.toString()} sub={`${tierCounts.free ?? 0} free`} color="bg-primary/10 text-primary" />
        <Stat icon={DollarSign} label="Monthly recurring" value={`$${mrr.toFixed(2)}`} sub={`+$${lifetimeRevenue.toFixed(2)} lifetime`} color="bg-success/15 text-success" />
        <Stat icon={Brain} label="AI requests" value={counts.aiUsage.toString()} sub="across all users" color="bg-accent text-accent-foreground" />
        <Stat icon={LifeBuoy} label="Open tickets" value={counts.openTickets.toString()} sub={`${counts.urgentTickets} urgent`} color="bg-warning/20 text-warning-foreground" />
        <Stat icon={AlertTriangle} label="Open flags" value={flags.length.toString()} sub={`${counts.reminders} reminders total`} color="bg-destructive/15 text-destructive" />
      </div>

      <div className="mt-8">
        <AdminCharts />
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <Card title="Revenue breakdown">
          <ul className="space-y-2 text-sm">
            {(["pro", "plus", "lifetime", "free"] as const).map((t) => (
              <li key={t} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div>
                  <div className="font-medium capitalize">{t}</div>
                  <div className="text-xs text-muted-foreground">{tierCounts[t] ?? 0} subscribers</div>
                </div>
                <div className="font-display font-bold">
                  ${(((tierCounts[t] ?? 0) * (t === "lifetime" ? 99.99 : TIER_PRICE[t] ?? 0))).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Reminder activity">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Total reminders</div>
              <div className="font-display font-bold">{counts.reminders}</div>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Location reminders</div>
              <div className="font-display font-bold">{counts.locationReminders}</div>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI assist calls</div>
              <div className="font-display font-bold">{counts.aiUsage}</div>
            </li>
          </ul>
        </Card>

        <Card title="Flagged accounts">
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">No open flags. All clear.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {flags.map((f) => (
                <li key={f.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <AlertTriangle className={`h-4 w-4 ${f.severity === "high" ? "text-destructive" : "text-warning-foreground"}`} /> {f.reason}
                      </div>
                      <div className="text-xs text-muted-foreground">user {f.user_id.slice(0, 8)} · {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}</div>
                    </div>
                    <button onClick={() => resolveFlag(f.id)} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold hover:bg-card transition">
                      <ShieldOff className="inline h-3 w-3 mr-1" /> Resolve
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Users (latest 200)" className="mt-5">
        {loading ? (
          <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted/60 animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => {
                  const s = subsByUser.get(p.id);
                  return (
                    <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{p.display_name ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3"><TierBadge tier={s?.tier ?? "free"} /></td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{s?.status ?? "active"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-border bg-card/70 p-5 shadow-card backdrop-blur ${className}`}>
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, string> = {
    free: "bg-muted text-muted-foreground",
    plus: "bg-accent text-accent-foreground",
    pro: "bg-gradient-primary text-primary-foreground",
    lifetime: "bg-success/15 text-success border border-success/30",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[tier] ?? map.free}`}>{tier}</span>;
}
