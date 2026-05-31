import { SovereignSeal } from "./sovereign-seal";
import { SOVEREIGN } from "@/lib/sovereign";
import { Link } from "@tanstack/react-router";

export function SovereignWatermark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "text-[10px]" : "text-xs"} text-muted-foreground`}>
      <SovereignSeal size={compact ? 24 : 32} className="opacity-80" />
      <div className="leading-tight">
        <div className="font-serif-display small-caps text-gold">{SOVEREIGN.name}</div>
        <div>EST. {SOVEREIGN.est} · <Link to="/terms" className="hover:text-gold underline-offset-2 hover:underline">Terms</Link> · <Link to="/privacy" className="hover:text-gold underline-offset-2 hover:underline">Privacy</Link></div>
      </div>
    </div>
  );
}
