import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/use-role";
import { Users, Inbox, DollarSign, Brain, Code2, Headphones, Wrench, BarChart3, Crown, Shield, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/employee")({
  component: EmployeePortal,
  head: () => ({ meta: [{ title: "Employee portal — RememberFi" }] }),
});

const DEPARTMENTS = [
  { id: "executive",   name: "Executive",        icon: Crown,      color: "bg-gradient-primary text-primary-foreground", desc: "Strategy, board, company-wide decisions." },
  { id: "engineering", name: "Engineering",      icon: Code2,      color: "bg-accent text-accent-foreground",            desc: "Product engineering, platform reliability." },
  { id: "it",          name: "IT / Support Eng", icon: Wrench,     color: "bg-warning/20 text-warning-foreground",       desc: "Resolves technical tickets, fixes bugs, restores access." },
  { id: "support",     name: "Customer Support", icon: Headphones, color: "bg-primary/10 text-primary",                  desc: "Front-line ticket handling, complaints, escalations." },
  { id: "billing",     name: "Billing & Finance",icon: DollarSign, color: "bg-success/15 text-success",                  desc: "Subscriptions, refunds, revenue ops." },
  { id: "growth",      name: "Growth & Marketing", icon: Sparkles, color: "bg-destructive/15 text-destructive",          desc: "Acquisition, retention, lifecycle campaigns." },
  { id: "analytics",   name: "Analytics",        icon: BarChart3,  color: "bg-muted text-foreground",                    desc: "Product analytics, AI cost tracking, KPIs." },
] as const;

type Staff = { user_id: string; role: string; display_name: string | null };

function EmployeePortal() {
  const { user } = useAuth();
  const { isStaff, isOwner, isAdmin, loading } = useRoles();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [counts, setCounts] = useState({ openTickets: 0, urgentTickets: 0, totalUsers: 0, mrr: 0 });

  useEffect(() => {
    if (loading) return;
    if (!isStaff) { navigate({ to: "/dashboard" }); return; }
    (async () => {
      const [{ data: roles }, { count: openT }, { count: urgT }, { count: users }, { data: subs }] = await Promise.all([
        supabase.from("user_roles").select("user_id, role").in("role", ["owner", "admin"]),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).neq("status", "resolved"),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("priority", "urgent").neq("status", "resolved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("tier"),
      ]);
      const ids = (roles ?? []).map((r) => r.user_id);
      const profilesMap = new Map<string, string | null>();
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        (profs ?? []).forEach((p) => profilesMap.set(p.id as string, p.display_name as string | null));
      }
      setStaff((roles ?? []).map((r) => ({ user_id: r.user_id as string, role: r.role as string, display_name: profilesMap.get(r.user_id as string) ?? null })));
      const mrr = (subs ?? []).reduce((s: number, x: any) => s + (x.tier === "plus" ? 4.99 : x.tier === "pro" ? 12.99 : 0), 0);
      setCounts({ openTickets: openT ?? 0, urgentTickets: urgT ?? 0, totalUsers: users ?? 0, mrr });
    })();
  }, [isStaff, loading, navigate]);

  if (loading || !isStaff) {
    return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;
  }

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      <div>
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          {isOwner ? <><Crown className="h-3.5 w-3.5 text-primary" /> Owner — full access</> : <><Shield className="h-3.5 w-3.5 text-primary" /> Executive — configure everything</>}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Employee portal</h1>
        <p className="mt-1 text-muted-foreground">RememberFi internal — choose a department or jump to a workspace below.</p>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Inbox} label="Open tickets" value={counts.openTickets.toString()} sub={`${counts.urgentTickets} urgent`} link="/admin/tickets" />
        <Kpi icon={Users} label="Total users" value={counts.totalUsers.toString()} sub="across all tiers" link="/admin" />
        <Kpi icon={DollarSign} label="Monthly recurring" value={`$${counts.mrr.toFixed(2)}`} sub="active subscriptions" link="/admin" />
        <Kpi icon={Brain} label="AI assistant" value="Open" sub="company copilot" link="/ai" />
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Departments</h2>
      <p className="text-sm text-muted-foreground">Each department has its own workspace and queue. As we grow we'll add more deeply per dept.</p>
      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DEPARTMENTS.map((d) => (
          <div key={d.id} className="rounded-2xl border border-border bg-card/70 p-5 shadow-card backdrop-blur">
            <div className="flex items-center gap-3">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${d.color}`}><d.icon className="h-5 w-5" /></span>
              <div>
                <h3 className="font-display font-semibold">{d.name}</h3>
                <p className="text-xs text-muted-foreground capitalize">{d.id}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{d.desc}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/admin/tickets" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-card transition">Open tickets →</Link>
              {(d.id === "executive" || d.id === "analytics") && (
                <Link to="/admin" className="rounded-full bg-muted px-3 py-1.5 text-xs font-semibold hover:bg-card transition">Analytics →</Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold">Staff directory</h2>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-card/70">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">User ID</th></tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">No staff yet.</td></tr>
            ) : staff.map((s) => (
              <tr key={`${s.user_id}-${s.role}`} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{s.display_name ?? "—"}{s.user_id === user?.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                <td className="px-4 py-3"><RoleBadge role={s.role} /></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.user_id.slice(0, 12)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && !isOwner && (
        <p className="mt-4 text-xs text-muted-foreground">As Executive (admin), you can read and configure everything except owner-only secrets. The President (owner) retains final authority on roles & billing.</p>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, link }: { icon: any; label: string; value: string; sub: string; link: string }) {
  return (
    <Link to={link as any} className="rounded-2xl border border-border bg-gradient-card p-4 shadow-card hover:shadow-glow transition">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </Link>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <span className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground"><Crown className="h-3 w-3" /> Owner</span>;
  if (role === "admin") return <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-foreground border border-primary/20 px-2.5 py-0.5 text-xs font-semibold"><Shield className="h-3 w-3" /> Executive</span>;
  return <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold capitalize">{role}</span>;
}
