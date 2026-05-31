import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Permanently delete the signed-in user's account and all their data.
 * Apple App Store guideline 5.1.1(v) requires in-app account deletion.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    // Best-effort wipe of all app data tied to the user. Most of these have
    // RLS, but using the admin client guarantees cleanup even if a policy
    // shifts later.
    await Promise.all([
      supabaseAdmin.from("reminders").delete().eq("user_id", userId),
      supabaseAdmin.from("notifications").delete().eq("user_id", userId),
      supabaseAdmin.from("user_settings").delete().eq("user_id", userId),
      supabaseAdmin.from("user_sounds").delete().eq("user_id", userId),
      supabaseAdmin.from("ticket_messages").delete().eq("author_id", userId),
      supabaseAdmin.from("support_tickets").delete().eq("user_id", userId),
      supabaseAdmin.from("ai_usage").delete().eq("user_id", userId),
      supabaseAdmin.from("account_flags").delete().eq("user_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("subscriptions").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ]);

    // Finally, remove the auth user itself.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
