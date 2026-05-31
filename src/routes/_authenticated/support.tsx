import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { LifeBuoy, Send, MessageSquare, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { playPreset } from "@/lib/alert-sounds";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
  head: () => ({ meta: [{ title: "Support — RememberFi" }] }),
});

type Ticket = { id: string; subject: string; category: string; priority: string; status: string; body: string; created_at: string; updated_at: string };
type Msg = { id: string; ticket_id: string; author_id: string; from_staff: boolean; body: string; created_at: string };

const CATEGORIES = ["general", "billing", "bug", "feature_request", "complaint"];
const PRIORITIES = ["low", "normal", "high", "urgent"];

function SupportPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");

  // new ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [body, setBody] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setTickets((data ?? []) as Ticket[]);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  const activeIdRef = useRef<string | null>(null);
  activeIdRef.current = active?.id ?? null;

  // Realtime: when staff replies to our tickets, play a chime + show toast
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("user-ticket-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_messages" }, (payload) => {
        const m = payload.new as Msg;
        if (!m.from_staff) return;
        playPreset("chime", 0.7);
        if (activeIdRef.current === m.ticket_id) {
          setMessages((cur) => [...cur, m]);
        } else {
          toast.success("RememberFi support replied", { description: m.body.slice(0, 120) });
        }
        load();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line
  }, [user?.id]);

  useEffect(() => {
    if (!active) { setMessages([]); return; }
    supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as Msg[]));
  }, [active]);

  const submit = async () => {
    if (!user) return;
    if (!subject.trim() || !body.trim()) return toast.error("Subject and message are required");
    const { data, error } = await supabase.from("support_tickets").insert({
      user_id: user.id, subject, category, priority, body,
    }).select("*").single();
    if (error) return toast.error(error.message);
    await supabase.from("ticket_messages").insert({ ticket_id: data!.id, author_id: user.id, from_staff: false, body });
    toast.success("Ticket submitted — we'll get back to you");
    setSubject(""); setBody(""); setCategory("general"); setPriority("normal");
    load();
  };

  const sendReply = async () => {
    if (!user || !active || !reply.trim()) return;
    const { error } = await supabase.from("ticket_messages").insert({ ticket_id: active.id, author_id: user.id, from_staff: false, body: reply });
    if (error) return toast.error(error.message);
    await supabase.from("support_tickets").update({ status: "open", updated_at: new Date().toISOString() }).eq("id", active.id);
    setReply("");
    const { data } = await supabase.from("ticket_messages").select("*").eq("ticket_id", active.id).order("created_at", { ascending: true });
    setMessages((data ?? []) as Msg[]);
    load();
  };

  return (
    <div className="p-5 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow text-primary-foreground"><LifeBuoy className="h-5 w-5" /></span>
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Support</h1>
          <p className="text-muted-foreground">File a ticket, share a complaint, or request a feature. The RememberFi team replies fast.</p>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_1.4fr] gap-5">
        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-card">
          <h2 className="font-display font-semibold mb-3">New ticket</h2>
          <div className="space-y-3">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
              </select>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Describe what's going on…" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm resize-y" />
            <button onClick={submit} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
              <Send className="h-4 w-4" /> Submit ticket
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-card">
          <h2 className="font-display font-semibold mb-3 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Your tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border p-6 text-center">No tickets yet.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id}>
                  <button onClick={() => setActive(t)} className={`w-full text-left rounded-xl border p-3 transition ${active?.id === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/40"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{t.subject}</span>
                      <StatusBadge status={t.status} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span className="capitalize">{t.category.replace("_", " ")}</span>
                      <span>·</span>
                      <span className="capitalize">{t.priority}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {active && (
            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{active.subject}</h3>
                <button onClick={() => setActive(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div key={m.id} className={`rounded-xl p-3 text-sm ${m.from_staff ? "bg-primary/10 border border-primary/20" : "bg-muted/60"}`}>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-1 flex items-center gap-2">
                      {m.from_staff ? <span className="text-primary">RememberFi staff</span> : <span className="text-muted-foreground">You</span>}
                      <span className="text-muted-foreground">· {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                  </div>
                ))}
              </div>
              {active.status !== "resolved" && (
                <div className="mt-3 flex gap-2">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm" />
                  <button onClick={sendReply} className="rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow"><Send className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: any; label: string }> = {
    open:        { cls: "bg-warning/20 text-warning-foreground border-warning/40", icon: Clock,        label: "Open" },
    in_progress: { cls: "bg-primary/15 text-primary border-primary/30",            icon: MessageSquare, label: "In progress" },
    resolved:    { cls: "bg-success/15 text-success border-success/30",            icon: CheckCircle2, label: "Resolved" },
  };
  const m = map[status] ?? map.open;
  const Icon = m.icon;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${m.cls}`}><Icon className="h-3 w-3" /> {m.label}</span>;
}
