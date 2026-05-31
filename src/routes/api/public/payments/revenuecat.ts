/**
 * RevenueCat webhook — receives entitlement events from Apple App Store
 * and Google Play (via RevenueCat), then syncs them into `subscriptions`
 * and `user_roles`.
 *
 * Set REVENUECAT_WEBHOOK_SECRET (Authorization Bearer scheme).
 * Configure in: RevenueCat → Project Settings → Integrations → Webhooks.
 *
 * RevenueCat docs: https://www.revenuecat.com/docs/integrations/webhooks
 */
import { createFileRoute } from "@tanstack/react-router";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

let _supabase: SupabaseClient<Database> | null = null;
function getSupabase(): SupabaseClient<Database> {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

// Map RevenueCat entitlement identifiers → internal tier
function entitlementToTier(entitlementId: string): "plus" | "pro" | "lifetime" | "free" {
  const id = entitlementId.toLowerCase();
  if (id.includes("lifetime")) return "lifetime";
  if (id.includes("pro")) return "pro";
  if (id.includes("plus")) return "plus";
  return "free";
}

function tierToRole(tier: string): "plus" | "pro" | "free" {
  if (tier === "lifetime" || tier === "pro") return "pro";
  if (tier === "plus") return "plus";
  return "free";
}

type RCEvent = {
  type: string;
  app_user_id: string;
  product_id?: string;
  entitlement_ids?: string[];
  entitlement_id?: string;
  expiration_at_ms?: number;
  purchased_at_ms?: number;
  store?: string;
  environment?: "PRODUCTION" | "SANDBOX";
};

export const Route = createFileRoute("/api/public/payments/revenuecat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const expected = `Bearer ${process.env.REVENUECAT_WEBHOOK_SECRET}`;
        if (!process.env.REVENUECAT_WEBHOOK_SECRET || auth !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }

        let body: { event?: RCEvent };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = body.event;
        if (!event?.app_user_id) {
          return new Response("Missing event.app_user_id", { status: 400 });
        }

        const userId = event.app_user_id;
        const entitlements = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
        const primary = entitlements[0] ?? "free";
        const tier = entitlementToTier(primary);
        const env = event.environment === "SANDBOX" ? "sandbox" : "live";

        const activeTypes = new Set([
          "INITIAL_PURCHASE",
          "RENEWAL",
          "PRODUCT_CHANGE",
          "UNCANCELLATION",
          "NON_RENEWING_PURCHASE",
          "TRANSFER",
        ]);
        const inactiveTypes = new Set([
          "EXPIRATION",
          "CANCELLATION",
          "BILLING_ISSUE",
          "SUBSCRIPTION_PAUSED",
        ]);

        const supabase = getSupabase();

        if (activeTypes.has(event.type)) {
          await supabase.from("subscriptions").upsert(
            {
              user_id: userId,
              tier,
              status: "active",
              environment: env,
              current_period_end: event.expiration_at_ms
                ? new Date(event.expiration_at_ms).toISOString()
                : null,
              product_id: event.product_id ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          );
          await supabase
            .from("user_roles")
            .upsert(
              { user_id: userId, role: tierToRole(tier) },
              { onConflict: "user_id,role" },
            );
        } else if (inactiveTypes.has(event.type)) {
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              cancel_at_period_end: true,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
