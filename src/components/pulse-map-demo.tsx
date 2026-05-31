import { MapPin, Wifi } from "lucide-react";

// Animated pulsing-radius demo (no real map dependency — pure CSS)
// Used on the marketing landing and feature pages to show "live" geofence activity.
export function PulseMapDemo({ label = "Walmart Supercenter", sub = "Grocery list · 300 m" }: { label?: string; sub?: string }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-card p-4 shadow-card">
      <div className="relative h-full w-full overflow-hidden rounded-2xl bg-secondary">
        {/* Stylized map "tiles" */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,oklch(0.92_0.07_220)_0%,oklch(0.97_0.02_240)_60%)]" />
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,oklch(0.85_0.04_240)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.85_0.04_240)_1px,transparent_1px)] [background-size:32px_32px]" />
        {/* Streets */}
        <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M0 250 Q 200 200 400 280" stroke="oklch(0.78 0.04 240)" strokeWidth="3" fill="none" />
          <path d="M180 0 Q 220 250 200 500" stroke="oklch(0.78 0.04 240)" strokeWidth="3" fill="none" />
          <path d="M0 380 L 400 360" stroke="oklch(0.82 0.03 240)" strokeWidth="2" fill="none" />
        </svg>

        {/* Pulsing radius */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="pulse-ring pulse-ring-1" />
          <span className="pulse-ring pulse-ring-2" />
          <span className="pulse-ring pulse-ring-3" />
          <div className="absolute inset-0 -m-16 rounded-full bg-primary/10" />
          <div className="absolute inset-0 -m-16 rounded-full border-2 border-dashed border-primary/50" />
          <div className="relative grid h-12 w-12 place-items-center rounded-full bg-gradient-primary shadow-glow ring-4 ring-background">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>

        {/* Tiny "other" pins */}
        <div className="absolute left-[18%] top-[28%]">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-card border border-border shadow-soft">
            <MapPin className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        <div className="absolute right-[15%] top-[65%]">
          <div className="grid h-6 w-6 place-items-center rounded-full bg-card border border-border shadow-soft">
            <MapPin className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>

        {/* Live indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-soft backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>

        {/* Bottom card */}
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 text-primary" /> Tracking geofence
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{label}</div>
          <div className="font-display font-semibold truncate">{sub}</div>
        </div>
      </div>
    </div>
  );
}
