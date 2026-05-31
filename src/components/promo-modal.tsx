import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Sparkles, Gift, ArrowRight } from "lucide-react";

const STORAGE_KEY = "rmly:promo:v1";

export function PromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setOpen(true);
    };

    // Scroll trigger: 45% down
    const onScroll = () => {
      const pct = window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight);
      if (pct > 0.45) trigger();
    };
    // Exit-intent: mouse leaves toward the top
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };
    // Time fallback: 25s
    const t = window.setTimeout(trigger, 25000);

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseout", onMouseOut);
      window.clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setOpen(false);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, String(Date.now()));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-gradient-card shadow-glow animate-in slide-in-from-bottom-4">
        <button onClick={dismiss} aria-label="Close" className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted transition">
          <X className="h-4 w-4" />
        </button>
        <div className="bg-gradient-primary p-6 text-primary-foreground">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold backdrop-blur">
            <Gift className="h-3 w-3" /> Limited launch offer
          </div>
          <h3 className="mt-3 font-display text-2xl font-bold leading-tight">Get 30% off RememberFi Pro</h3>
          <p className="mt-1.5 text-sm text-primary-foreground/85">For your first 3 months. Cancel anytime.</p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">Promo code</span>
            <code className="font-mono text-sm font-semibold text-foreground">REMEMBER30</code>
          </div>
          <Link
            to="/pricing"
            onClick={dismiss}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 transition"
          >
            <Sparkles className="h-4 w-4" /> Claim my 30% off <ArrowRight className="h-4 w-4" />
          </Link>
          <button onClick={dismiss} className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition">
            No thanks, I'll forget things on my own
          </button>
        </div>
      </div>
    </div>
  );
}
