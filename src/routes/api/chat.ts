import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type ChatBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // 1) Authenticate via Bearer token (set by the client)
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(token);
        if (userErr || !userRes.user) return new Response("Unauthorized", { status: 401 });
        const userId = userRes.user.id;

        // 2) Check role + usage limits
        const [{ data: rolesData }, { data: subData }, { count: usedCount }] = await Promise.all([
          supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
          supabaseAdmin.from("subscriptions").select("tier").eq("user_id", userId).maybeSingle(),
          supabaseAdmin.from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId),
        ]);
        const roles = (rolesData ?? []).map((r) => r.role as string);
        const tier = (subData?.tier as string) ?? "free";
        const isOwner = roles.includes("owner");
        const hasUnlimitedAi = isOwner || tier === "pro" || tier === "lifetime";
        const FREE_LIMIT = 10;
        if (!hasUnlimitedAi && (usedCount ?? 0) >= FREE_LIMIT) {
          return new Response(
            JSON.stringify({ error: "AI request limit reached. Upgrade to Pro for unlimited access." }),
            { status: 402, headers: { "content-type": "application/json" } },
          );
        }

        // 3) Parse messages with size limits to prevent cost amplification
        const { messages } = (await request.json()) as ChatBody;
        if (!Array.isArray(messages)) return new Response("Bad request", { status: 400 });
        const MAX_MESSAGES = 50;
        const MAX_TOTAL_CHARS = 32000;
        if (messages.length > MAX_MESSAGES) {
          return new Response(JSON.stringify({ error: "Conversation too long. Start a new chat." }), { status: 400, headers: { "content-type": "application/json" } });
        }
        const totalChars = (messages as any[])
          .flatMap((m) => Array.isArray(m?.parts) ? m.parts : [])
          .reduce((s: number, p: any) => s + (typeof p?.text === "string" ? p.text.length : 0), 0);
        if (totalChars > MAX_TOTAL_CHARS) {
          return new Response(JSON.stringify({ error: "Message too large." }), { status: 400, headers: { "content-type": "application/json" } });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI not configured", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");

        const systemBase =
          "You are the RememberFi assistant — a calm, encouraging memory and life-organization helper. " +
          "You help the user set, refine, and recall reminders (time- or location-based). " +
          "When the user shares a thought or task, proactively ask: 'Want me to save this as a note or reminder?' " +
          "Keep replies concise, warm, and actionable. Use bullet points when listing.";
        const ownerExtras = isOwner
          ? " You also have OWNER-MODE: you can discuss platform analytics, flagged accounts, security posture, and admin operations. Be direct and detailed when the owner asks."
          : "";

        // Reserve the usage slot BEFORE streaming to prevent concurrent-request bypass of the free-tier limit.
        const lastUser = (messages as UIMessage[]).slice().reverse().find((m) => m.role === "user");
        const promptText = lastUser
          ? lastUser.parts.map((p) => (p.type === "text" ? p.text : "")).join("").slice(0, 4000)
          : "";
        const { data: reserved, error: reserveErr } = await supabaseAdmin
          .from("ai_usage")
          .insert({ user_id: userId, prompt: promptText, response: null })
          .select("id")
          .single();
        if (reserveErr || !reserved) {
          return new Response(JSON.stringify({ error: "Could not start chat session." }), { status: 500, headers: { "content-type": "application/json" } });
        }
        // Re-check after reservation to atomically enforce the limit.
        if (!hasUnlimitedAi) {
          const { count: postCount } = await supabaseAdmin
            .from("ai_usage").select("id", { count: "exact", head: true }).eq("user_id", userId);
          if ((postCount ?? 0) > FREE_LIMIT) {
            await supabaseAdmin.from("ai_usage").delete().eq("id", reserved.id);
            return new Response(
              JSON.stringify({ error: "AI request limit reached. Upgrade to Pro for unlimited access." }),
              { status: 402, headers: { "content-type": "application/json" } },
            );
          }
        }

        const result = streamText({
          model,
          system: systemBase + ownerExtras,
          messages: await convertToModelMessages(messages as UIMessage[]),
          onFinish: async ({ text }) => {
            await supabaseAdmin.from("ai_usage").update({ response: text.slice(0, 8000) }).eq("id", reserved.id);
          },
        });

        return result.toUIMessageStreamResponse();
      },
    },
  },
});
