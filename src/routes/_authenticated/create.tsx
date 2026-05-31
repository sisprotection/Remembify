import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { CATEGORIES, metersToLabel } from "@/lib/reminders";
import { toast } from "sonner";
import { Clock, MapPin, Save, Crosshair } from "lucide-react";
import ClientMap from "@/components/client-map";
import { SoundPicker } from "@/components/sound-picker";

const searchSchema = z.object({ type: z.enum(["standard", "location"]).optional() });

type FamilyGroup = { id: string; name: string; owner_id: string };
type FamilyMember = { user_id: string; role: string; display_name: string | null };

export const Route = createFileRoute("/_authenticated/create")({
  validateSearch: searchSchema,
  component: CreatePage,
  head: () => ({ meta: [{ title: "Create reminder — RememberFi" }] }),
});

function CreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [type, setType] = useState<"standard" | "location">(search.type ?? "standard");

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [recurrence, setRecurrence] = useState<string>("");

  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(300);
  const [trigger, setTrigger] = useState<"enter" | "leave" | "both">("leave");
  const [locationName, setLocationName] = useState("");
  const [oneTime, setOneTime] = useState(true);
  const [soundId, setSoundId] = useState<string>("chime");
  const [customSoundUrl, setCustomSoundUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<FamilyMember[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(c);
        if (!point) setPoint(c);
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    let cancelled = false;

    async function loadFamilyGroups() {
      const { data: memberships } = await supabase
        .from("family_group_members")
        .select("group_id")
        .eq("user_id", userId);

      const groupIds = [...new Set((memberships ?? []).map((item: any) => item.group_id))].filter(Boolean);
      if (!groupIds.length) {
        if (!cancelled) {
          setFamilyGroups([]);
          setSelectedGroupId(null);
          setGroupMembers([]);
        }
        return;
      }

      const { data: groups } = await supabase
        .from("family_groups")
        .select("id,name,owner_id")
        .in("id", groupIds);

      if (cancelled) return;
      setFamilyGroups((groups ?? []) as FamilyGroup[]);
      if (!selectedGroupId && groups?.length) {
        setSelectedGroupId(groups[0].id);
      }
    }

    loadFamilyGroups();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupMembers([]);
      setAssignedUserId(null);
      return;
    }

    const groupId = selectedGroupId;
    let cancelled = false;
    async function loadGroupMembers() {
      const { data: memberships } = await supabase
        .from("family_group_members")
        .select("user_id,role")
        .eq("group_id", groupId);

      const memberIds = [...new Set((memberships ?? []).map((item: any) => item.user_id))].filter(Boolean);
      if (!memberIds.length) {
        if (!cancelled) setGroupMembers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name")
        .in("id", memberIds);

      if (cancelled) return;
      const profileMap = new Map(((profiles ?? []) as any[]).map((profile: any) => [profile.id, profile.display_name]));
      setGroupMembers(
        (memberships ?? []).map((membership: any) => ({
          user_id: membership.user_id,
          role: membership.role,
          display_name: profileMap.get(membership.user_id) ?? null,
        })),
      );
    }

    loadGroupMembers();
    return () => { cancelled = true; };
  }, [selectedGroupId]);

  const useCurrent = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCenter(c); setPoint(c);
      toast.success("Pinned your current location");
    });
  };

  const save = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Please give your reminder a title");
    if (type === "location" && !point) return toast.error("Pick a location on the map");
    setBusy(true);
    const payload: any = {
      user_id: assignedUserId ?? user.id,
      created_by: user.id,
      group_id: selectedGroupId ?? null,
      assigned_user_id: assignedUserId ?? null,
      type,
      title,
      notes: notes || null,
      priority: priority || null,
      category: category || null,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      recurrence: recurrence || null,
      sound_id: soundId,
      custom_sound_url: customSoundUrl,
    };
    if (type === "location" && point) {
      payload.latitude = point.lat;
      payload.longitude = point.lng;
      payload.radius_m = radius;
      payload.trigger_type = trigger;
      payload.location_name = locationName || null;
      payload.one_time = oneTime;
    }
    const { error } = await supabase.from("reminders").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Reminder saved");
    navigate({ to: type === "location" ? "/map" : "/dashboard" });
  };

  return (
    <div className="p-5 md:p-10 max-w-4xl mx-auto">
      <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Create reminder</h1>
      <p className="mt-1 text-muted-foreground">Pick a type, give it a title, and we'll handle the rest.</p>

      <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1 shadow-soft">
        <Tab active={type === "standard"} onClick={() => setType("standard")} icon={<Clock className="h-4 w-4" />}>Standard</Tab>
        <Tab active={type === "location"} onClick={() => setType("location")} icon={<MapPin className="h-4 w-4" />}>Location</Tab>
      </div>

      <div className="mt-6 grid gap-4">
        <Card>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grocery list at Walmart" />
          <Label className="mt-4">Notes</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add details, items, or a custom alert message…" rows={3} />
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">None</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
        </Card>

        {familyGroups.length > 0 && (
          <Card>
            <Label>Family group</Label>
            <Select value={selectedGroupId ?? ""} onChange={(e) => setSelectedGroupId(e.target.value || null)}>
              <option value="">Personal reminder</option>
              {familyGroups.map((group) => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </Select>
            {selectedGroupId ? (
              <div className="mt-4">
                <Label>Assign reminder to</Label>
                <Select value={assignedUserId ?? ""} onChange={(e) => setAssignedUserId(e.target.value || null)}>
                  <option value="">Myself</option>
                  {groupMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.display_name ?? member.user_id}{member.user_id === user.id ? " (you)" : ""}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-muted-foreground">Assign this reminder to another family member so it triggers on their device and stays tracked in the group activity log.</p>
              </div>
            ) : null}
          </Card>
        )}

        {type === "standard" ? (
          <Card>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Due date & time</Label>
                <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </div>
              <div>
                <Label>Recurring</Label>
                <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
                  <option value="">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
                </Select>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-3">
              <div>
                <Label>Location</Label>
                <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="Friendly name (e.g. Walmart, Home, Office)" />
              </div>
              <button onClick={useCurrent} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted">
                <Crosshair className="h-4 w-4" /> Use my location
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Tap the map to set the pin.</p>
            <div className="h-72 md:h-96">
              <ClientMap center={center} point={point} radius={radius} onPick={setPoint} />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <Label>Radius</Label>
                <span className="text-sm font-medium">{metersToLabel(radius)}</span>
              </div>
              <input type="range" min={15} max={3220} step={5} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full mt-2 accent-[oklch(0.58_0.16_250)]" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>50 ft</span><span>2 mi</span></div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Trigger</Label>
                <Select value={trigger} onChange={(e) => setTrigger(e.target.value as any)}>
                  <option value="enter">When I arrive</option>
                  <option value="leave">When I leave</option>
                  <option value="both">Both</option>
                </Select>
              </div>
              <div>
                <Label>Repeat</Label>
                <Select value={oneTime ? "once" : "repeat"} onChange={(e) => setOneTime(e.target.value === "once")}>
                  <option value="once">One-time trigger</option>
                  <option value="repeat">Every time I cross</option>
                </Select>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <SoundPicker
            value={soundId}
            onChange={({ sound_id, custom_sound_url }) => { setSoundId(sound_id); setCustomSoundUrl(custom_sound_url); }}
          />
        </Card>

        <div className="flex justify-end">
          <button disabled={busy} onClick={save} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
            <Save className="h-4 w-4" /> Save reminder
          </button>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, icon, children }: any) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">{children}</div>;
}
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 ${className}`}>{children}</label>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`} />;
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`} />;
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 ${props.className ?? ""}`} />;
}
