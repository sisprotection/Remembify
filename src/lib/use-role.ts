import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type AppRole = "owner" | "admin" | "pro" | "plus" | "free" | "president" | "vice_president" | "secretary" | "financial_adviser";
export type CabinetRole = "president" | "vice_president" | "secretary" | "financial_adviser";
export const CABINET_ROLES: CabinetRole[] = ["president", "vice_president", "secretary", "financial_adviser"];
export type Tier = "free" | "plus" | "pro" | "lifetime";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [tier, setTier] = useState<Tier>("free");
  const [aiUsedThisMonth, setAiUsedThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setRoles([]); setTier("free"); setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const [r, s, a] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("subscriptions").select("tier").eq("user_id", user.id).maybeSingle(),
        supabase.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setRoles((r.data ?? []).map((x: { role: AppRole }) => x.role));
      setTier((s.data?.tier as Tier) ?? "free");
      setAiUsedThisMonth(a.count ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const isOwner = roles.includes("owner");
  const isAdmin = roles.includes("admin");
  const isStaff = isOwner || isAdmin;
  const hasAiAccess = isStaff || tier === "pro" || tier === "lifetime";
  const aiLimit = isStaff ? Infinity : hasAiAccess ? Infinity : 10;
  const aiRemaining = aiLimit === Infinity ? Infinity : Math.max(0, aiLimit - aiUsedThisMonth);

  return { roles, tier, isOwner, isAdmin, isStaff, hasAiAccess, aiRemaining, aiUsedThisMonth, loading };
}
