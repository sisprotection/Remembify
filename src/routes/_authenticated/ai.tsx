import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useRef, useState, useEffect } from "react";
import { Brain, Send, Sparkles, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRoles } from "@/lib/use-role";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai")({
  component: AiAssistant,
  head: () => ({ meta: [{ title: "AI Assistant — RememberFi" }] }),
});

function AiAssistant() {
  const { isOwner, tier, aiUsedThisMonth, hasAiAccess, loading: rolesLoading } = useRoles();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (input, init) => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          const headers = new Headers(init?.headers);
          if (token) headers.set("Authorization", `Bearer ${token}`);
          return fetch(input, { ...init, headers });
        },
      }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, status]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    if (!hasAiAccess && !isOwner && aiUsedThisMonth >= 10) {
      toast.error("You've used your 10 free AI requests. Upgrade to Pro for unlimited.");
      return;
    }
    sendMessage({ text });
    setInput("");
  };

  useEffect(() => {
    if (error) toast.error(error.message || "Something went wrong with the AI.");
  }, [error]);

  const free = !isOwner && !hasAiAccess;
  const remaining = Math.max(0, 10 - aiUsedThisMonth);

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen flex-col p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">AI Memory Assistant</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" /> Ask me anything
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Turn thoughts into reminders. "Remind me to call mom Sunday" or "what's due today?"
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-border bg-card/70 px-3 py-2 text-xs backdrop-blur">
          {isOwner ? (
            <span className="flex items-center gap-1.5 text-primary font-semibold"><Crown className="h-3.5 w-3.5" /> Owner · unlimited</span>
          ) : hasAiAccess ? (
            <span className="flex items-center gap-1.5 text-primary font-semibold"><Sparkles className="h-3.5 w-3.5" /> {tier.toUpperCase()} · unlimited</span>
          ) : (
            <span>
              <span className="font-semibold">{remaining}</span> / 10 free requests left
              <Link to="/pricing" className="ml-2 text-primary hover:underline">Upgrade →</Link>
            </span>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="mt-6 flex-1 overflow-y-auto rounded-2xl border border-border bg-card/40 backdrop-blur p-4 space-y-4">
        {messages.length === 0 && !rolesLoading && (
          <div className="grid place-items-center h-full text-center text-muted-foreground">
            <div>
              <Brain className="h-10 w-10 mx-auto text-primary/40" />
              <p className="mt-3 font-display font-semibold text-foreground">Start a conversation</p>
              <p className="text-sm mt-1">Try: "Remind me to take medication every morning at 8am"</p>
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-card border border-border"}`}>
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
        {status === "submitted" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={free && remaining === 0 ? "Upgrade to keep chatting…" : "Ask the assistant…"}
          disabled={status === "streaming" || status === "submitted" || (free && remaining === 0)}
          className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-sm shadow-soft focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!input.trim() || status === "streaming" || status === "submitted"}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> Send
        </button>
      </form>
    </div>
  );
}
