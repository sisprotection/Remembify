import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, type Reminder, priorityColor } from "@/lib/reminders";
import { format } from "date-fns";
import { CheckCircle2, Filter, History as HistoryIcon, MapPin, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
  head: () => ({ meta: [{ title: "History — RememberFi" }] }),
});

function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Reminder[]>([]);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [category, setCategory] = useState<string>("");
  const [tab, setTab] = useState<"reminders" | "alerts">("reminders");

  useEffect(() => {
    if (!user) return;
    supabase.from("reminders").select("*").eq("user_id", user.id).or("completed_at.not.is.null,active.eq.false").order("updated_at", { ascending: false })
      .then(({ data }) => setItems((data ?? []) as Reminder[]));
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setNotifs(data ?? []));
  }, [user]);

  const filtered = items.filter((r) => !category || r.category === category);

  return (
    <div className="p-5 md:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Activity log</h1>
          <p className="mt-1 text-muted-foreground">Everything you've remembered (or chose to dismiss).</p>
        </div>
        <HistoryIcon className="h-6 w-6 text-primary" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
        <div className="inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
          <button onClick={() => setTab("reminders")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "reminders" ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>Completed</button>
          <button onClick={() => setTab("alerts")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === "alerts" ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"}`}>Triggered alerts</button>
        </div>
        {tab === "reminders" && (
          <label className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-1.5 text-sm">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {tab === "reminders" ? (
          filtered.length === 0 ? <Empty msg="No history yet." /> :
          filtered.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-success/15 text-success"><CheckCircle2 className="h-4 w-4" /></span>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground">
                  {r.type === "location" ? <MapPin className="inline h-3 w-3 mr-1" /> : <Clock className="inline h-3 w-3 mr-1" />}
                  {r.category && `${r.category} · `}
                  {r.completed_at ? `Completed ${format(new Date(r.completed_at), "MMM d, p")}` : "Inactive"}
                </div>
              </div>
              {r.priority && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs capitalize ${priorityColor(r.priority)}`}>{r.priority}</span>}
            </div>
          ))
        ) : (
          notifs.length === 0 ? <Empty msg="No alerts triggered yet." /> :
          notifs.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">{n.title}</span>
                <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs capitalize">{n.status}</span>
                {n.trigger_kind && <span className="rounded-full bg-accent text-accent-foreground px-2 py-0.5 text-xs capitalize">{n.trigger_kind}</span>}
                <span className="text-xs text-muted-foreground">· {format(new Date(n.created_at), "MMM d, p")}</span>
              </div>
              {n.message && <p className="mt-1 text-sm text-muted-foreground">{n.message}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{msg}</div>;
}
