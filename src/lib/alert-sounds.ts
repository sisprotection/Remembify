import { supabase } from "@/integrations/supabase/client";

export type SoundPreset = {
  id: string;
  name: string;
  description: string;
  intensity: "gentle" | "standard" | "loud" | "alarm";
};

// Procedurally generated tones so we don't ship binary assets.
// "loud" / "alarm" presets are designed to be abrasive enough to stop you in your tracks.
export const SOUND_PRESETS: SoundPreset[] = [
  { id: "chime",      name: "Gentle chime",     description: "Soft two-tone bell. Easy on the ears.",           intensity: "gentle" },
  { id: "ping",       name: "Quick ping",       description: "Short, sharp notification ping.",                  intensity: "standard" },
  { id: "marimba",    name: "Marimba",          description: "Warm wooden notes, classic reminder tone.",        intensity: "standard" },
  { id: "siren",      name: "Siren",            description: "Loud rising/falling siren. Hard to ignore.",       intensity: "loud" },
  { id: "klaxon",     name: "Klaxon horn",      description: "Aggressive horn blast. Stops you in your tracks.", intensity: "alarm" },
  { id: "fanfare",    name: "Brass fanfare",    description: "Bold, ceremonial — like a mission alert.",         intensity: "loud" },
  { id: "rock-riff",  name: "Rock riff",        description: "Power-chord stinger. Wakes you up.",               intensity: "loud" },
  { id: "voice-hey",  name: "\"Hey — remember!\"", description: "Synthesised voice nudge.",                       intensity: "standard" },
  { id: "social-ding", name: "Social ding",     description: "Familiar two-tone social notification chime.",    intensity: "standard" },
];

type Ctx = AudioContext | null;
let cachedCtx: Ctx = null;
function ctx(): AudioContext {
  if (cachedCtx) return cachedCtx;
  const AC = (window as any).AudioContext ?? (window as any).webkitAudioContext;
  cachedCtx = new AC();
  return cachedCtx!;
}

function envelope(g: GainNode, t0: number, attack: number, decay: number, peak: number) {
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
}

function tone(freq: number, t0: number, dur: number, type: OscillatorType, peak: number) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.connect(g).connect(c.destination);
  envelope(g, t0, 0.005, dur, peak);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

function sweep(f1: number, f2: number, t0: number, dur: number, type: OscillatorType, peak: number) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f1, t0);
  o.frequency.linearRampToValueAtTime(f2, t0 + dur);
  o.connect(g).connect(c.destination);
  envelope(g, t0, 0.02, dur, peak);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export function playPreset(id: string, volume = 0.8) {
  const c = ctx();
  if (c.state === "suspended") c.resume();
  const t = c.currentTime + 0.02;
  const v = Math.max(0, Math.min(1, volume));
  switch (id) {
    case "chime":
      tone(880, t, 0.8, "sine", 0.4 * v);
      tone(1320, t + 0.18, 1.0, "sine", 0.35 * v);
      break;
    case "ping":
      tone(1568, t, 0.25, "triangle", 0.5 * v);
      break;
    case "marimba":
      [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.12, 0.5, "triangle", 0.45 * v));
      break;
    case "siren":
      for (let i = 0; i < 3; i++) {
        sweep(440, 1200, t + i * 0.55, 0.25, "sawtooth", 0.55 * v);
        sweep(1200, 440, t + i * 0.55 + 0.25, 0.25, "sawtooth", 0.55 * v);
      }
      break;
    case "klaxon":
      for (let i = 0; i < 4; i++) {
        tone(330, t + i * 0.35, 0.18, "square", 0.7 * v);
        tone(220, t + i * 0.35 + 0.18, 0.14, "square", 0.7 * v);
      }
      break;
    case "fanfare":
      [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.12, 0.4, "sawtooth", 0.5 * v));
      tone(784, t + 0.6, 0.7, "sawtooth", 0.55 * v);
      break;
    case "rock-riff":
      [196, 196, 233, 261, 233].forEach((f, i) => tone(f, t + i * 0.13, 0.18, "sawtooth", 0.6 * v));
      break;
    case "voice-hey":
      sweep(180, 240, t, 0.18, "sawtooth", 0.5 * v);
      sweep(260, 200, t + 0.25, 0.3, "sawtooth", 0.5 * v);
      sweep(220, 320, t + 0.65, 0.35, "sawtooth", 0.5 * v);
      break;
    case "social-ding":
      // Original two-tone notification chime (rising perfect fourth) — not derived from any branded sound
      tone(1175, t, 0.22, "sine", 0.5 * v);          // D6
      tone(1568, t + 0.11, 0.5, "sine", 0.45 * v);   // G6
      tone(2349, t + 0.11, 0.5, "sine", 0.18 * v);   // soft overtone for sparkle
      break;
    default:
      tone(880, t, 0.5, "sine", 0.4 * v);
  }
}

export async function playCustomSound(storagePath: string, volume = 0.8) {
  const { data, error } = await supabase.storage
    .from("alert-sounds")
    .createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) return false;
  const a = new Audio(data.signedUrl);
  a.volume = Math.max(0, Math.min(1, volume));
  await a.play().catch(() => {});
  return true;
}

export async function playAlert(opts: { presetId?: string | null; customPath?: string | null; volume?: number }) {
  const vol = opts.volume ?? 0.8;
  if (opts.customPath) {
    const ok = await playCustomSound(opts.customPath, vol);
    if (ok) return;
  }
  playPreset(opts.presetId ?? "chime", vol);
}
