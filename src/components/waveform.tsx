import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Procedural mini-visualiser for preset tones (no decoding needed). */
export function PresetWaveform({ id, className = "" }: { id: string; className?: string }) {
  // Deterministic bar heights per preset so each tone has a distinct silhouette.
  const bars = SHAPES[id] ?? SHAPES.default;
  return (
    <svg viewBox="0 0 80 24" className={`w-20 h-6 ${className}`} aria-hidden>
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={12 - h / 2}
          width={2.5}
          height={Math.max(2, h)}
          rx={1}
          className="fill-primary/70"
        />
      ))}
    </svg>
  );
}

const SHAPES: Record<string, number[]> = {
  chime:      [4, 8, 14, 10, 6, 4, 3, 6, 12, 8, 5, 3, 2, 2, 2, 1, 1, 1, 1, 1],
  ping:       [2, 6, 18, 22, 16, 8, 4, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  marimba:    [6, 12, 8, 4, 8, 14, 10, 5, 10, 16, 12, 6, 4, 3, 2, 2, 1, 1, 1, 1],
  siren:      [4, 8, 14, 20, 18, 12, 6, 10, 16, 22, 20, 14, 8, 12, 18, 22, 18, 12, 8, 4],
  klaxon:     [22, 18, 6, 22, 18, 6, 22, 18, 6, 22, 18, 6, 22, 18, 6, 22, 18, 6, 22, 18],
  fanfare:    [8, 12, 16, 20, 18, 14, 12, 16, 20, 22, 20, 16, 12, 8, 6, 4, 3, 2, 2, 1],
  "rock-riff":[20, 4, 18, 4, 16, 4, 20, 6, 18, 4, 20, 4, 16, 6, 18, 4, 20, 4, 16, 4],
  "voice-hey":[6, 10, 14, 12, 8, 4, 10, 16, 20, 16, 10, 6, 12, 18, 20, 16, 10, 6, 3, 2],
  default:    [6, 10, 14, 18, 14, 10, 6, 10, 14, 18, 14, 10, 6, 10, 14, 18, 14, 10, 6, 4],
};

/** Real waveform from a stored custom sound (decodes audio data, samples peaks). */
export function CustomWaveform({ storagePath, className = "" }: { storagePath: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.storage.from("alert-sounds").createSignedUrl(storagePath, 120);
      if (!data?.signedUrl || cancelled) return;
      try {
        const buf = await (await fetch(data.signedUrl)).arrayBuffer();
        const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
        const ctx: AudioContext = new AC();
        const audio = await ctx.decodeAudioData(buf);
        const ch = audio.getChannelData(0);
        const samples = 60;
        const block = Math.floor(ch.length / samples);
        const out: number[] = [];
        for (let i = 0; i < samples; i++) {
          let max = 0;
          for (let j = 0; j < block; j++) {
            const v = Math.abs(ch[i * block + j] ?? 0);
            if (v > max) max = v;
          }
          out.push(max);
        }
        if (!cancelled) setPeaks(out);
        ctx.close();
      } catch {
        if (!cancelled) setPeaks([]);
      }
    })();
    return () => { cancelled = true; };
  }, [storagePath]);

  useEffect(() => {
    if (!peaks || !ref.current) return;
    const c = ref.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const bw = w / peaks.length;
    const mid = h / 2;
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "oklch(0.58 0.16 250)");
    grad.addColorStop(1, "oklch(0.68 0.18 290)");
    ctx.fillStyle = grad;
    peaks.forEach((p, i) => {
      const bh = Math.max(2, p * h * 0.9);
      ctx.fillRect(i * bw + 0.5, mid - bh / 2, Math.max(1, bw - 1.5), bh);
    });
  }, [peaks]);

  return (
    <div className={`relative h-8 w-full rounded-md bg-muted/50 overflow-hidden ${className}`}>
      <canvas ref={ref} className="w-full h-full" />
      {!peaks && <div className="absolute inset-0 grid place-items-center text-[10px] text-muted-foreground">decoding…</div>}
    </div>
  );
}
