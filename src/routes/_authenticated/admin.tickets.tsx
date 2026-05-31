import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/use-role";
import { toast } from "sonner";
import { Inbox, Send, CheckCircle2, AlertOctagon, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { playPreset } from "@/lib/alert-sounds";

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: AdminTickets,
  head: () => ({ meta: [{ title: "Tickets — RememberFi Admin" }] }),
});

type Ticket = { id: string; user_id: string; subject: string; category: string; priority: string; status: string; body: string; created_at: string; updated_at: string };
type Msg = { id: string; ticket_id: string; author_id: string; from_staff: boolean; body: string; created_at: string };

function AdminTickets() {
  const { user } = useAuth();
  const { isStaff, loading } = useRoles();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = active?.id ?? null;

  useEffect(() => {
    if (loading) return;
    if (!isStaff) { navigate({ to: "/dashboard" }); return; }
    load();
  // eslint-disable-next-line
  }, [isStaff, loading, filter]);

  const load = async () => {
    let q = supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setTickets((data ?? []) as Ticket[]);
  };

  // Realtime: any new ticket message — if from a customer, ping us with a sound + toast
  useEffect(() => {
    if (!isStaff) return;
    const ch = supabase.channel("staff-ticket-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (m.from_staff) return; // ignore our own echoes
        playPreset("ping", 0.6);
        if (activeIdRef.current === m.ticket_id) {
          setMessages((cur) => [...cur, m]);
        } else {
          toast.info("New customer message in a ticket", { description: m.body.slice(0, 120) });
        }
        load();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line
  }, [isStaff]);

  useEffect(() => {
    if (!active) { setMessages([]); return; }
    supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as Msg[]));
  }, [active]);

  const setStatus = async (status: string) => {
    if (!active) return;
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", active.id);
    if (error) return toast.error(error.message);
    setActive({ ...active, status });
    load();
  };

  const sendReply = async () => {
    if (!active || !user || !reply.trim()) return;
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: active.id, author_id: user.id, from_staff: true, body: reply });
    if (error) return toast.error(error.message);
    await supabase.from("support_tickets").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", active.id);
    setReply("");
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
    load();
  };

  if (loading || !isStaff) return <div className="grid min-h-screen place-items-center"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  const open = tickets.filter((t) => t.status === "open").length;
  const urgent = tickets.filter((t) => t.priority === "urgent" && t.status !== "resolved").length;

  return (
    <div className="p-5 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Inbox className="h-3.5 w-3.5 text-primary" /> Customer support inbox</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Tickets</h1>
          <p className="mt-1 text-muted-foreground">{open} open · {urgent} urgent unresolved</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card border border-border p-1">
          <Filter className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
          {(["all","open","in_progress","resolved"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${filter === f ? "bg-gradient-primary text-primary-foreground" : "hover:bg-muted"}`}>{f.replace("_", " ")}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <section className="rounded-2xl border border-border bg-card/80 p-4 shadow-card max-h-[75vh] overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">No tickets in this view.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setActive(t)} className={`w-full text-left rounded-xl border p-3 transition ${active?.id === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{t.subject}</span>
                      <PriorityChip p={t.priority} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="capitalize">{t.category.replace("_", " ")}</span>
                      <span>·</span>
                      <span>user {t.user_id.slice(0, 8)}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-card">
          {!active ? (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-10 text-center">Pick a ticket to reply.</p>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-display text-lg font-semibold">{active.subject}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{active.category} · {active.priority} · user {active.user_id.slice(0, 12)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setStatus("in_progress")} className="rounded-full border border-input bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted">Mark in-progress</button>
                  <button onClick={() => setStatus("resolved")} className="rounded-full bg-success/15 text-success border border-success/30 px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Resolve</button>
                </div>
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-xl p-3 text-sm ${m.from_staff ? "bg-primary/10 border border-primary/20" : "bg-muted/60"}`}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                      {m.from_staff ? <span className="text-primary">Staff</span> : <span className="text-muted-foreground">User</span>}
                      <span className="text-muted-foreground">· {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write a reply…" className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y" />
                <button onClick={sendReply} className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow inline-flex items-center gap-2"><Send className="h-4 w-4" /> Send</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function PriorityChip({ p }: { p: string }) {
  const map: Record<string, string> = {
    low: "bg-muted text-muted-foreground border-border",
    normal: "bg-primary/10 text-primary border-primary/20",
    high: "bg-warning/20 text-warning-foreground border-warning/40",
    urgent: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[p] ?? map.normal}`}>{p === "urgent" && <AlertOctagon className="h-3 w-3" />}{p}</span>;
}
