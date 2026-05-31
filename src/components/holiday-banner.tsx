import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { getActiveHoliday, type ActiveHoliday } from "@/lib/holidays";

export function HolidayBanner({ context = "marketing" }: { context?: "marketing" | "app" }) {
  const [holiday, setHoliday] = useState<ActiveHoliday | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const h = getActiveHoliday();
    setHoliday(h);
    if (h && typeof window !== "undefined") {
      const stored = localStorage.getItem(`rmfi:banner:dismissed:${h.key}`);
      if (stored) setDismissed(true);
    }
  }, []);

  if (!holiday || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`rmfi:banner:dismissed:${holiday.key}`, "1");
    }
  };

  const ctaTarget = context === "app" ? "/settings" : "/pricing";
  const ctaLabel = context === "app" ? "Upgrade to Pro" : "Claim offer";

  return (
    <div className={`relative isolate overflow-hidden bg-gradient-to-r ${holiday.gradient} text-white`}>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-lg leading-none" aria-hidden>{holiday.emoji}</span>
          <p className="truncate font-medium">
            <span className="font-display font-semibold">{holiday.name} sale:</span> {holiday.headline}{" "}
            <span className="ml-1 hidden sm:inline opacity-90">
              Use code <span className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs font-semibold">{holiday.code}</span>
            </span>
            <span className="ml-2 hidden md:inline opacity-80">
              · {holiday.daysAway <= 0 ? "Today!" : `${holiday.daysAway} day${holiday.daysAway === 1 ? "" : "s"} away`}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={ctaTarget} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur hover:bg-white/30 transition">
            <Sparkles className="h-3 w-3" /> {ctaLabel} <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={dismiss} aria-label="Dismiss banner" className="rounded-full p-1 hover:bg-white/20 transition">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
