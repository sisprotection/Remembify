import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables for family functions");
}

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
});

type CreateFamilyGroupInput = { name: string };
export const createFamilyGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateFamilyGroupInput) => {
    if (!data.name || !data.name.trim()) throw new Error("Family group name is required.");
    if (data.name.length > 80) throw new Error("Family group name is too long.");
    return { name: data.name.trim() };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const insert = await context.supabase
      .from("family_groups")
      .insert({ name: data.name, owner_id: userId })
      .select("id")
      .single();

    if (insert.error) throw insert.error;

    const groupId = insert.data?.id;
    if (!groupId) throw new Error("Could not create family group.");

    const memberInsert = await context.supabase.from("family_group_members").insert({
      group_id: groupId,
      user_id: userId,
      role: "owner",
    });

    if (memberInsert.error) throw memberInsert.error;

    return { id: groupId, name: data.name };
  });

type InviteFamilyMemberInput = { groupId: string; email: string };
export const inviteFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: InviteFamilyMemberInput) => {
    if (!data.groupId || !data.groupId.trim()) throw new Error("Family group is required.");
    if (!data.email || !data.email.trim()) throw new Error("Email is required.");
    return { groupId: data.groupId.trim(), email: data.email.trim().toLowerCase() };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const group = await context.supabase
      .from("family_groups")
      .select("owner_id")
      .eq("id", data.groupId)
      .maybeSingle();

    if (group.error) throw group.error;
    if (!group.data) throw new Error("Family group not found.");
    if (group.data.owner_id !== userId) throw new Error("Only the group owner can invite members.");

    const userLookup = await adminSupabase
      .from("auth.users")
      .select("id,email")
      .eq("email", data.email)
      .maybeSingle();

    if (userLookup.error) throw userLookup.error;
    if (!userLookup.data) throw new Error("No account found for that email.");
    if (userLookup.data.id === userId) throw new Error("You are already part of this group.");

    const memberInsert = await context.supabase.from("family_group_members").upsert({
      group_id: data.groupId,
      user_id: userLookup.data.id,
      role: "member",
    });

    if (memberInsert.error) throw memberInsert.error;

    return { userId: userLookup.data.id, email: userLookup.data.email };
  });
