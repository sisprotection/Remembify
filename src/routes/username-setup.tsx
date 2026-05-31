import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SovereignSeal } from "@/components/sovereign-seal";
import { toast } from "sonner";
import { ArrowRight, AtSign } from "lucide-react";

export const Route = createFileRoute("/username-setup")({
  component: UsernameSetup,
  head: () => ({ meta: [{ title: "Choose your username — Sovereign Holdings LLC" }] }),
});

function UsernameSetup() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const u = username.trim();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(u)) {
      setError("3–24 characters. Letters, numbers, and underscores only.");
      return;
    }
    if (!user) return;
    setBusy(true);
    const { error: e1 } = await supabase
      .from("profiles")
      .update({ username: u, username_set_at: new Date().toISOString() })
      .eq("id", user.id);
    setBusy(false);
    if (e1) {
      if (e1.code === "23505") setError("That username is already taken.");
      else setError(e1.message);
      return;
    }
    toast.success("Username set");
    navigate({ to: "/terms-gate" });
  };

  return (
    <div className="min-h-screen bg-hero flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <SovereignSeal size={80} />
          <h1 className="mt-3 font-serif-display text-2xl font-semibold text-gold small-caps">Choose your username</h1>
          <p className="mt-1 text-sm text-muted-foreground">This is the only name shown publicly across every Sovereign Holdings platform. Your email is never displayed.</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-border bg-card/80 p-6 shadow-card backdrop-blur space-y-4">
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jane_doe"
              className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              maxLength={24}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">Username changes require approval after this is set.</p>
          <button
            disabled={busy || username.length < 3}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
