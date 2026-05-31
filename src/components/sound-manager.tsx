import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SOUND_PRESETS, playPreset, playCustomSound } from "@/lib/alert-sounds";
import { PresetWaveform, CustomWaveform } from "@/components/waveform";
import { toast } from "sonner";
import { Play, Mic, Square, Trash2, Volume2, Upload } from "lucide-react";

type CustomSound = { id: string; name: string; storage_path: string; created_at: string };

export function SoundManager({
  defaultSoundId,
  volume,
  onChange,
}: {
  defaultSoundId: string;
  volume: number;
  onChange: (next: { defaultSoundId: string; volume: number }) => void;
}) {
  const { user } = useAuth();
  const [sounds, setSounds] = useState<CustomSound[]>([]);
  const [recording, setRecording] = useState(false);
  const [recName, setRecName] = useState("");
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_sounds").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setSounds((data ?? []) as CustomSound[]);
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await uploadBlob(blob, recName || `Voice note ${new Date().toLocaleString()}`);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Microphone access denied");
    }
  };
  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const uploadBlob = async (blob: Blob, name: string) => {
    if (!user) return;
    const path = `${user.id}/${crypto.randomUUID()}.webm`;
    const { error: upErr } = await supabase.storage.from("alert-sounds").upload(path, blob, { contentType: blob.type });
    if (upErr) return toast.error(upErr.message);
    const { error: dbErr } = await supabase.from("user_sounds").insert({ user_id: user.id, name, storage_path: path });
    if (dbErr) return toast.error(dbErr.message);
    setRecName("");
    toast.success("Sound saved");
    refresh();
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 5_000_000) return toast.error("Audio must be under 5 MB");
    await uploadBlob(f, f.name.replace(/\.[^.]+$/, ""));
  };

  const remove = async (s: CustomSound) => {
    await supabase.storage.from("alert-sounds").remove([s.storage_path]);
    await supabase.from("user_sounds").delete().eq("id", s.id);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Volume</label>
          <span className="text-sm font-medium tabular-nums">{Math.round(volume * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <input type="range" min={0} max={1} step={0.05} value={volume}
            onChange={(e) => onChange({ defaultSoundId, volume: Number(e.target.value) })}
            className="flex-1 accent-[oklch(0.58_0.16_250)]" />
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Preset sounds</div>
        <div className="grid sm:grid-cols-2 gap-2">
          {SOUND_PRESETS.map((p) => {
            const active = defaultSoundId === p.id;
            return (
              <div key={p.id} className={`rounded-xl border p-3 flex items-start justify-between gap-2 transition ${active ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <button type="button" onClick={() => onChange({ defaultSoundId: p.id, volume })} className="text-left flex-1">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {p.name}
                    <IntensityChip i={p.intensity} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                  <PresetWaveform id={p.id} className="mt-2" />
                </button>
                <button type="button" onClick={() => playPreset(p.id, volume)} className="rounded-lg p-2 hover:bg-muted" aria-label="Play preview">
                  <Play className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Your custom sounds</div>
        <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input value={recName} onChange={(e) => setRecName(e.target.value)} placeholder="Name your voice note (optional)" className="flex-1 min-w-[180px] rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            {!recording ? (
              <button type="button" onClick={startRecording} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
                <Mic className="h-4 w-4" /> Record voice
              </button>
            ) : (
              <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground animate-pulse">
                <Square className="h-4 w-4" /> Stop & save
              </button>
            )}
            <label className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer hover:bg-muted">
              <Upload className="h-4 w-4" /> Upload audio
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground">Tip: record yourself saying "Hey — did you forget the laundry?" so your own voice yanks you back. Max 5 MB.</p>
        </div>

        {sounds.length > 0 && (
          <ul className="mt-3 space-y-2">
            {sounds.map((s) => (
              <li key={s.id} className={`rounded-xl border p-3 ${defaultSoundId === `custom:${s.id}` ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={() => onChange({ defaultSoundId: `custom:${s.id}`, volume })} className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => playCustomSound(s.storage_path, volume)} className="rounded-lg p-2 hover:bg-muted" aria-label="Preview"><Play className="h-4 w-4" /></button>
                    <button onClick={() => remove(s)} className="rounded-lg p-2 hover:bg-destructive/10 text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
                <CustomWaveform storagePath={s.storage_path} className="mt-2" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function IntensityChip({ i }: { i: "gentle" | "standard" | "loud" | "alarm" }) {
  const map: Record<typeof i, string> = {
    gentle: "bg-success/15 text-success border-success/30",
    standard: "bg-muted text-muted-foreground border-border",
    loud: "bg-warning/20 text-warning-foreground border-warning/40",
    alarm: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[i]}`}>{i}</span>;
}
