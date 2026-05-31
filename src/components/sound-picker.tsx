import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SOUND_PRESETS, playPreset, playCustomSound } from "@/lib/alert-sounds";
import { PresetWaveform, CustomWaveform } from "@/components/waveform";
import { Play, Volume2 } from "lucide-react";

type CustomSound = { id: string; name: string; storage_path: string };

/** Compact picker used in the create-reminder flow. Value is a sound_id:
 *  either a preset id ("chime"…) or "custom:<uuid>" for a user-uploaded sound. */
export function SoundPicker({
  value,
  onChange,
  defaultVolume = 0.8,
}: {
  value: string;
  onChange: (next: { sound_id: string; custom_sound_url: string | null }) => void;
  defaultVolume?: number;
}) {
  const { user } = useAuth();
  const [sounds, setSounds] = useState<CustomSound[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_sounds").select("id, name, storage_path").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setSounds((data ?? []) as CustomSound[]));
  }, [user?.id]);

  const isCustom = value.startsWith("custom:");
  const activeCustomId = isCustom ? value.slice(7) : null;

  const pickPreset = (id: string) => onChange({ sound_id: id, custom_sound_url: null });
  const pickCustom = (s: CustomSound) => onChange({ sound_id: `custom:${s.id}`, custom_sound_url: s.storage_path });

  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5" /> Alert sound
        </div>
        <span className="text-[10px] text-muted-foreground">Tap to pick · play to preview</span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {SOUND_PRESETS.map((p) => {
          const active = value === p.id;
          return (
            <div key={p.id} className={`flex items-center gap-2 rounded-lg border p-2 transition ${active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"}`}>
              <button type="button" onClick={() => pickPreset(p.id)} className="flex-1 text-left min-w-0">
                <div className="text-xs font-semibold truncate">{p.name}</div>
                <PresetWaveform id={p.id} className="mt-1" />
              </button>
              <button type="button" onClick={() => playPreset(p.id, defaultVolume)} className="rounded-md p-1.5 hover:bg-muted shrink-0" aria-label="Preview">
                <Play className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {sounds.length > 0 && (
        <>
          <div className="mt-3 mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your custom</div>
          <ul className="space-y-1.5">
            {sounds.map((s) => {
              const active = activeCustomId === s.id;
              return (
                <li key={s.id} className={`flex items-center gap-2 rounded-lg border p-2 ${active ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
                  <button type="button" onClick={() => pickCustom(s)} className="flex-1 text-left min-w-0">
                    <div className="text-xs font-semibold truncate">{s.name}</div>
                    <CustomWaveform storagePath={s.storage_path} className="mt-1" />
                  </button>
                  <button type="button" onClick={() => playCustomSound(s.storage_path, defaultVolume)} className="rounded-md p-1.5 hover:bg-muted shrink-0" aria-label="Preview">
                    <Play className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
