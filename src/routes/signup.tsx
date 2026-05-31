import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User } from "lucide-react";
import { AuthShell, Field, Divider, GoogleIcon } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Sign up — RememberFi" }] }),
});

function SignupPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome to RememberFi!");
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (res.error) { setBusy(false); toast.error(res.error.message); return; }
    if (res.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return <AuthShell title="Create your account" subtitle="Start remembering five things at a time.">
    <button onClick={handleGoogle} disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition">
      <GoogleIcon /> Continue with Google
    </button>
    <Divider />
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field icon={<User className="h-4 w-4" />} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field icon={<Mail className="h-4 w-4" />} type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field icon={<Lock className="h-4 w-4" />} type="password" required minLength={8} placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button disabled={busy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
        Create account <ArrowRight className="h-4 w-4" />
      </button>
    </form>
    <p className="mt-5 text-center text-sm text-muted-foreground">
      Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link>
    </p>
  </AuthShell>;
}
