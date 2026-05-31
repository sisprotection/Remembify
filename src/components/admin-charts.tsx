import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, Users, Brain } from "lucide-react";

const DAYS = 30;
const TIER_PRICE: Record<string, number> = { plus: 4.99, pro: 12.99, lifetime: 99.99 };
const COST_PER_TOKEN_USD = 0.000003; // ~Gemini Flash blended estimate

type DayPoint = { date: string; label: string };

function buildDays(): DayPoint[] {
  const arr: DayPoint[] = [];
  const today = new Date();
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    arr.push({ date: iso, label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
  }
  return arr;
}

export function AdminCharts() {
  const [data, setData] = useState<{
    revenue: Array<DayPoint & { mrrAdded: number; cumulative: number }>;
    users: Array<DayPoint & { newUsers: number; total: number }>;
    ai: Array<DayPoint & { tokens: number; cost: number; calls: number }>;
    totals: { tokens: number; cost: number; calls: number };
  } | null>(null);

  useEffect(() => {
    (async () => {
      const days = buildDays();
      const since = new Date(); since.setDate(since.getDate() - DAYS);
      const sinceIso = since.toISOString();

      const [{ data: profs }, { data: subs }, { data: ai }] = await Promise.all([
        supabase.from("profiles").select("created_at"),
        supabase.from("subscriptions").select("tier, created_at"),
        supabase.from("ai_usage").select("tokens, created_at").gte("created_at", sinceIso),
      ]);

      const dayKey = (s: string) => s.slice(0, 10);

      // User growth — cumulative across all-time, but plot last 30 days
      const sortedProfs = (profs ?? []).map(p => new Date(p.created_at!)).sort((a, b) => a.getTime() - b.getTime());
      const users = days.map((d) => {
        const cutoff = new Date(d.date + "T23:59:59Z").getTime();
        const total = sortedProfs.filter(t => t.getTime() <= cutoff).length;
        const dayStart = new Date(d.date + "T00:00:00Z").getTime();
        const newUsers = sortedProfs.filter(t => t.getTime() >= dayStart && t.getTime() <= cutoff).length;
        return { ...d, newUsers, total };
      });

      // Revenue: MRR added per day (based on subscription created_at and tier),
      // and running cumulative MRR. Lifetime added as one-time bump (treated as MRR equiv).
      const revenueByDay = new Map<string, number>();
      (subs ?? []).forEach((s) => {
        const k = dayKey(s.created_at!);
        const price = TIER_PRICE[s.tier as string] ?? 0;
        revenueByDay.set(k, (revenueByDay.get(k) ?? 0) + price);
      });
      let running = 0;
      // seed running with anything before the window
      const windowStart = days[0].date;
      (subs ?? []).forEach((s) => {
        if (dayKey(s.created_at!) < windowStart) running += TIER_PRICE[s.tier as string] ?? 0;
      });
      const revenue = days.map((d) => {
        const added = revenueByDay.get(d.date) ?? 0;
        running += added;
        return { ...d, mrrAdded: Number(added.toFixed(2)), cumulative: Number(running.toFixed(2)) };
      });

      // AI usage per day + cost
      const aiByDay = new Map<string, { tokens: number; calls: number }>();
      (ai ?? []).forEach((r) => {
        const k = dayKey(r.created_at!);
        const cur = aiByDay.get(k) ?? { tokens: 0, calls: 0 };
        cur.tokens += r.tokens ?? 0;
        cur.calls += 1;
        aiByDay.set(k, cur);
      });
      const aiSeries = days.map((d) => {
        const v = aiByDay.get(d.date) ?? { tokens: 0, calls: 0 };
        return { ...d, tokens: v.tokens, calls: v.calls, cost: Number((v.tokens * COST_PER_TOKEN_USD).toFixed(4)) };
      });
      const totals = aiSeries.reduce((a, b) => ({ tokens: a.tokens + b.tokens, cost: a.cost + b.cost, calls: a.calls + b.calls }), { tokens: 0, cost: 0, calls: 0 });

      setData({ revenue, users, ai: aiSeries, totals: { ...totals, cost: Number(totals.cost.toFixed(2)) } });
    })();
  }, []);

  if (!data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-64 rounded-2xl border border-border bg-muted/40 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Revenue (last 30 days)" subtitle={`$${data.revenue[data.revenue.length - 1].cumulative.toFixed(2)} cumulative MRR`} icon={TrendingUp} accent="text-success">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.revenue}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success, 142 70% 45%))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--success, 142 70% 45%))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, k: any) => [`$${Number(v).toFixed(2)}`, k === "cumulative" ? "Cumulative" : "Added"]} />
            <Area type="monotone" dataKey="cumulative" stroke="oklch(0.65 0.16 155)" fill="url(#rev)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="User growth" subtitle={`${data.users[data.users.length - 1].total} total · +${data.users.reduce((a, b) => a + b.newUsers, 0)} this month`} icon={Users} accent="text-primary">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data.users}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="total" stroke="oklch(0.58 0.16 250)" strokeWidth={2} dot={false} name="Total users" />
            <Line type="monotone" dataKey="newUsers" stroke="oklch(0.68 0.18 290)" strokeWidth={1.5} dot={false} name="New / day" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="AI cost tracking" subtitle={`$${data.totals.cost.toFixed(2)} · ${data.totals.tokens.toLocaleString()} tokens · ${data.totals.calls} calls`} icon={Brain} accent="text-accent-foreground">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.ai}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any, k: any) => [k === "cost" ? `$${Number(v).toFixed(4)}` : Number(v).toLocaleString(), k]} />
            <Bar dataKey="cost" fill="oklch(0.65 0.2 30)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

function ChartCard({ title, subtitle, icon: Icon, accent, children }: { title: string; subtitle: string; icon: any; accent: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5 shadow-card backdrop-blur">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-display font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <span className={`grid h-8 w-8 place-items-center rounded-lg bg-muted ${accent}`}><Icon className="h-4 w-4" /></span>
      </div>
      {children}
    </section>
  );
}
