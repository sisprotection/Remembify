import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, TrendingUp } from "lucide-react";

type Point = { t: number; v: number; bump?: boolean; label?: string };

interface Props {
  reminderCount: number;
  recentAlerts: { at: number; title: string }[];
}

// Live ticker-style chart: baseline drifts based on active reminder count,
// and every recent alert pushes a visible spike (bump) into the stream.
export function ReminderActivityChart({ reminderCount, recentAlerts }: Props) {
  const WINDOW = 60; // points kept on screen
  const [points, setPoints] = useState<Point[]>(() =>
    Array.from({ length: WINDOW }, (_, i) => ({ t: Date.now() - (WINDOW - i) * 1000, v: 0.4 }))
  );
  const seenAlerts = useRef<Set<number>>(new Set());

  // Tick every 800ms — gentle noise around a baseline tied to active count.
  useEffect(() => {
    const baseline = Math.min(0.35 + reminderCount * 0.08, 0.85);
    const id = setInterval(() => {
      setPoints((prev) => {
        const last = prev[prev.length - 1]?.v ?? baseline;
        // Mean-reverting wiggle
        const next = Math.max(0.05, Math.min(0.98, last + (baseline - last) * 0.25 + (Math.random() - 0.5) * 0.12));
        // Inject bumps for alerts we haven't drawn yet
        const fresh = recentAlerts.find((a) => !seenAlerts.current.has(a.at));
        let v = next;
        let bump = false;
        let label: string | undefined;
        if (fresh) {
          seenAlerts.current.add(fresh.at);
          v = Math.min(0.99, next + 0.45);
          bump = true;
          label = fresh.title;
        }
        return [...prev.slice(-(WINDOW - 1)), { t: Date.now(), v, bump, label }];
      });
    }, 800);
    return () => clearInterval(id);
  }, [reminderCount, recentAlerts]);

  const { path, area, bumps, latest, trend } = useMemo(() => {
    const W = 600, H = 140, PAD = 6;
    const innerW = W - PAD * 2;
    const innerH = H - PAD * 2;
    const step = innerW / (points.length - 1);
    const toY = (v: number) => PAD + innerH - v * innerH;
    let d = "";
    let a = "";
    points.forEach((p, i) => {
      const x = PAD + i * step;
      const y = toY(p.v);
      d += `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
      a += `${i === 0 ? `M ${x.toFixed(1)} ${(PAD + innerH).toFixed(1)} L` : "L"} ${x.toFixed(1)} ${y.toFixed(1)} `;
    });
    a += `L ${(PAD + innerW).toFixed(1)} ${(PAD + innerH).toFixed(1)} Z`;
    const bumpsArr = points
      .map((p, i) => ({ ...p, x: PAD + i * step, y: toY(p.v) }))
      .filter((p) => p.bump);
    const last = points[points.length - 1]?.v ?? 0;
    const first = points[0]?.v ?? 0;
    return { path: d, area: a, bumps: bumpsArr, latest: last, trend: last - first };
  }, [points]);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-gradient-card p-4 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live activity</span>
          <span className="text-xs text-muted-foreground">— {reminderCount} active</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? "text-success" : "text-muted-foreground"}`}>
          <TrendingUp className={`h-3.5 w-3.5 ${trend >= 0 ? "" : "rotate-180"}`} />
          {(latest * 100).toFixed(0)}
        </div>
      </div>
      <svg viewBox="0 0 600 140" className="w-full h-32" preserveAspectRatio="none">
        <defs>
          <linearGradient id="rfi-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1="0" x2="600" y1={6 + (1 - g) * 128} y2={6 + (1 - g) * 128} stroke="hsl(var(--border))" strokeDasharray="2 4" strokeWidth="0.5" />
        ))}
        <path d={area} fill="url(#rfi-chart-fill)" />
        <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {bumps.map((b, i) => (
          <g key={i}>
            <circle cx={b.x} cy={b.y} r="5" fill="hsl(var(--primary))" opacity="0.25">
              <animate attributeName="r" from="5" to="14" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle cx={b.x} cy={b.y} r="3" fill="hsl(var(--primary))" />
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>Spikes mark fired alerts</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> streaming
        </span>
      </div>
    </div>
  );
}
