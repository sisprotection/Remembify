import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { Reminder } from "@/lib/reminders";
import { priorityColor } from "@/lib/reminders";
import { ArrowLeft, Clock, MapPin, Bell, CheckCircle2, Trash2, Edit3 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/reminders/$id")({
  component: ReminderDetail,
  head: () => ({ meta: [{ title: "Reminder — RememberFi" }] }),
});

function ReminderDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [r, setR] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("reminders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
      setR((data ?? null) as Reminder | null);
      setLoading(false);
    })();
  }, [user, id]);

  async function markComplete() {
    if (!r) return;
    setBusy(true);
    await supabase.from("reminders").update({ completed_at: new Date().toISOString(), active: false }).eq("id", r.id);
    setBusy(false);
    navigate({ to: "/dashboard" });
  }

  async function remove() {
    if (!r || !confirm("Delete this reminder? This cannot be undone.")) return;
    setBusy(true);
    await supabase.from("reminders").delete().eq("id", r.id);
    setBusy(false);
    navigate({ to: "/dashboard" });
  }

  if (loading) {
    return <div className="p-10 max-w-3xl mx-auto"><div className="h-40 rounded-2xl bg-muted/60 animate-pulse" /></div>;
  }
  if (!r) {
    return (
      <div className="p-10 max-w-3xl mx-auto text-center">
        <p className="text-muted-foreground">Reminder not found.</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-1 text-primary hover:underline"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </div>
    );
  }

  const Icon = r.type === "location" ? MapPin : Clock;

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mt-4 rounded-3xl border border-border bg-gradient-card p-6 md:p-8 shadow-card">
        <div className="flex items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">{r.type}</span>
              {r.priority && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${priorityColor(r.priority)}`}>{r.priority}</span>}
              {r.category && <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">{r.category}</span>}
              {r.completed_at && <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success"><CheckCircle2 className="h-3 w-3" /> Completed</span>}
              {!r.active && !r.completed_at && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Inactive</span>}
            </div>
            <h1 className="mt-2 font-display text-2xl md:text-3xl font-bold tracking-tight break-words">{r.title}</h1>
          </div>
        </div>

        {r.notes && (
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</div>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed">{r.notes}</p>
          </div>
        )}

        <div className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
          {r.due_at && (
            <Field label="Due">
              <div>{format(new Date(r.due_at), "PPP p")}</div>
              <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.due_at), { addSuffix: true })}</div>
            </Field>
          )}
          {r.recurrence && <Field label="Recurrence"><span className="capitalize">{r.recurrence}</span></Field>}
          {r.type === "location" && (
            <>
              <Field label="Location">{r.location_name || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`}</Field>
              <Field label="Geofence">{r.radius_m}m · trigger on {r.trigger_type}</Field>
            </>
          )}
          {(r as any).sound_id && <Field label="Alert sound"><span className="capitalize">{(r as any).sound_id}</span></Field>}
          <Field label="Created">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</Field>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {!r.completed_at && (
            <button onClick={markComplete} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-success px-4 py-2 text-sm font-semibold text-success-foreground hover:opacity-90 disabled:opacity-50">
              <CheckCircle2 className="h-4 w-4" /> Mark complete
            </button>
          )}
          <Link to="/create" search={{ edit: r.id } as any} className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold hover:bg-muted">
            <Edit3 className="h-4 w-4" /> Edit
          </Link>
          <button onClick={remove} disabled={busy} className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
