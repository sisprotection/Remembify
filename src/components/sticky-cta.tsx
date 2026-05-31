import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, X, Sparkles } from "lucide-react";

const STORAGE_KEY = "rmly:stickycta:v1";

export function StickyCTA() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) {
      setDismissed(true);
      return;
    }
    const onScroll = () => {
      setShow(window.scrollY > 700);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !show) return null;

  const dismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 px-3 w-full max-w-xl animate-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3 rounded-full border border-border bg-background/90 px-3 py-2 shadow-glow backdrop-blur-xl">
        <div className="hidden sm:grid h-8 w-8 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="flex-1 truncate text-sm">
          <span className="font-semibold">Start free.</span>{" "}
          <span className="text-muted-foreground">7-day Pro trial · no card needed.</span>
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-95 transition"
        >
          Try RememberFi <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button onClick={dismiss} aria-label="Dismiss" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
