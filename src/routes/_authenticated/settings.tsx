import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/use-role";
import { metersToLabel } from "@/lib/reminders";
import { toast } from "sonner";
import { Save, Trash2, Settings as SettingsIcon, Volume2, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { SoundManager } from "@/components/sound-manager";
import { deleteMyAccount } from "@/lib/account.functions";
import { createPortalSession } from "@/utils/payments.functions";
import { createFamilyGroup, inviteFamilyMember } from "@/utils/family.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — RememberFi" }] }),
});

type FamilyGroup = { id: string; name: string; owner_id: string };
type FamilyMember = { user_id: string; role: string; display_name: string | null };
type FamilyActivity = { id: string; title: string; message: string | null; trigger_kind: string | null; created_at: string; user_id: string; reminder_id: string | null };

function SettingsPage() {
  const { user, signOut } = useAuth();
  const { tier, isStaff } = useRoles();
  const navigate = useNavigate();
  const deleteAccountFn = useServerFn(deleteMyAccount);
  const portalFn = useServerFn(createPortalSession);
  const [radius, setRadius] = useState(200);
  const [trigger, setTrigger] = useState("leave");
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [soundId, setSoundId] = useState("chime");
  const [volume, setVolume] = useState(0.8);
  const [portalBusy, setPortalBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<FamilyMember[]>([]);
  const [groupActivity, setGroupActivity] = useState<FamilyActivity[]>([]);
  const [groupName, setGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [groupBusy, setGroupBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const familyGroupFn = useServerFn(createFamilyGroup);
  const inviteFamilyMemberFn = useServerFn(inviteFamilyMember);

  const hasPaidSub = tier === "plus" || tier === "pro";

  useEffect(() => {
    if (!user) return;
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setRadius(data.default_radius_m); setTrigger(data.default_trigger);
        setNotif(data.notifications_enabled); setDark(data.dark_mode);
        setSoundId((data as any).default_sound_id ?? "chime");
        setVolume(Number((data as any).sound_volume ?? 0.8));
        if (data.dark_mode) document.documentElement.classList.add("dark");
      }
    });
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!user?.id) return;
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
          setGroupActivity([]);
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
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupMembers([]);
      setGroupActivity([]);
      return;
    }

    const groupId = selectedGroupId;
    let cancelled = false;

    async function loadGroupData() {
      const [{ data: memberships }, { data: activities }] = await Promise.all([
        supabase.from("family_group_members").select("user_id,role").eq("group_id", groupId),
        supabase.from("notifications")
          .select("id,title,message,trigger_kind,created_at,user_id,reminder_id")
          .eq("group_id", selectedGroupId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const memberIds = [...new Set((memberships ?? []).map((item: any) => item.user_id))].filter(Boolean);
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
      setGroupActivity((activities ?? []) as FamilyActivity[]);
    }

    loadGroupData();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupId]);

  const save = async () => {
    if (!user) return;
    const [s, p] = await Promise.all([
      supabase.from("user_settings").update({
        default_radius_m: radius, default_trigger: trigger,
        notifications_enabled: notif, dark_mode: dark,
        default_sound_id: soundId, sound_volume: volume,
      } as any).eq("user_id", user.id),
      supabase.from("profiles").update({ display_name: displayName }).eq("id", user.id),
    ]);
    if (s.error || p.error) return toast.error((s.error ?? p.error)!.message);
    toast.success("Settings saved");
  };

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      const url = await portalFn({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not open billing portal");
    } finally {
      setPortalBusy(false);
    }
  };

  const createFamily = async () => {
    if (!user) return;
    if (!groupName.trim()) return toast.error("Enter a family group name.");
    setGroupBusy(true);
    try {
      await familyGroupFn({ data: { name: groupName.trim() } });
      setGroupName("");
      toast.success("Family group created.");
      if (user) {
        const groups = await supabase
          .from("family_group_members")
          .select("group_id")
          .eq("user_id", user.id);
        const groupIds = [...new Set((groups.data ?? []).map((item: any) => item.group_id))].filter(Boolean);
        if (groupIds.length) {
          const { data: loadedGroups } = await supabase.from("family_groups").select("id,name,owner_id").in("id", groupIds);
          setFamilyGroups((loadedGroups ?? []) as FamilyGroup[]);
          if (loadedGroups?.length) setSelectedGroupId(loadedGroups[0].id);
        }
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create family group.");
    } finally {
      setGroupBusy(false);
    }
  };

  const inviteFamilyMemberToGroup = async () => {
    if (!selectedGroupId) return;
    if (!inviteEmail.trim()) return toast.error("Enter a member email.");
    setInviteBusy(true);
    try {
      await inviteFamilyMemberFn({ data: { groupId: selectedGroupId, email: inviteEmail.trim().toLowerCase() } });
      setInviteEmail("");
      const [{ data: memberships }] = await Promise.all([
        supabase.from("family_group_members").select("user_id,role").eq("group_id", selectedGroupId),
      ]);
      const memberIds = [...new Set((memberships ?? []).map((item: any) => item.user_id))].filter(Boolean);
      const { data: profiles } = await supabase.from("profiles").select("id,display_name").in("id", memberIds);
      const profileMap = new Map(((profiles ?? []) as any[]).map((profile: any) => [profile.id, profile.display_name]));
      setGroupMembers(
        (memberships ?? []).map((membership: any) => ({
          user_id: membership.user_id,
          role: membership.role,
          display_name: profileMap.get(membership.user_id) ?? null,
        })),
      );
      const { data: activities } = await supabase
        .from("notifications")
        .select("id,title,message,trigger_kind,created_at,user_id,reminder_id")
        .eq("group_id", selectedGroupId)
        .order("created_at", { ascending: false })
        .limit(5);
      setGroupActivity((activities ?? []) as FamilyActivity[]);
      toast.success("Family member invited.");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not invite member.");
    } finally {
      setInviteBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    if (!confirm("Permanently delete your account, subscription, and all reminders? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure? Type OK on the next prompt to confirm.")) return;
    const confirmText = prompt('Type "DELETE" to permanently remove your account.');
    if (confirmText !== "DELETE") return toast.error("Cancelled — text did not match.");
    setDeleting(true);
    try {
      await deleteAccountFn({});
      await signOut();
      toast.success("Your account has been deleted.");
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted-foreground">Tune RememberFi to feel like yours.</p>
        </div>
        <SettingsIcon className="h-6 w-6 text-primary" />
      </div>

      <div className="mt-6 space-y-4">
        <Card title="Profile">
          <Label>Display name</Label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          <Label className="mt-3">Email</Label>
          <input value={user?.email ?? ""} disabled className="w-full rounded-xl border border-input bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground" />
        </Card>

        <Card title="Defaults for new reminders">
          <div className="flex items-center justify-between mb-1">
            <Label className="mb-0">Default radius</Label>
            <span className="text-sm font-medium">{metersToLabel(radius)}</span>
          </div>
          <input type="range" min={15} max={3220} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-[oklch(0.58_0.16_250)]" />
          <Label className="mt-4">Default trigger</Label>
          <select value={trigger} onChange={(e) => setTrigger(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
            <option value="enter">When I arrive</option><option value="leave">When I leave</option><option value="both">Both</option>
          </select>
        </Card>

        <Card title="Preferences">
          <Toggle label="In-app notifications" checked={notif} onChange={setNotif} />
          <Toggle label="Dark mode" checked={dark} onChange={setDark} />
        </Card>

        <Card title="Family sharing">
          <p className="text-sm text-muted-foreground mb-4">
            Create a family group so you can assign reminders to members and keep shared geofence activity visible to the group owner.
          </p>
          {familyGroups.length === 0 ? (
            <div className="space-y-3">
              <Label>Group name</Label>
              <input value={groupName} onChange={(e) => setGroupName(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" placeholder="e.g. Smith family" />
              <button onClick={createFamily} disabled={groupBusy} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60">
                Create family group
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Group</Label>
                <select value={selectedGroupId ?? ""} onChange={(e) => setSelectedGroupId(e.target.value || null)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm">
                  {familyGroups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-medium">Members</p>
                <div className="mt-3 space-y-2 text-sm text-foreground">
                  {groupMembers.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-3 py-2">
                      <span>{member.display_name ?? member.user_id}</span>
                      <span className="text-xs text-muted-foreground">{member.role === "owner" ? "Owner" : "Member"}</span>
                    </div>
                  ))}
                  {groupMembers.length === 0 && <p className="text-sm text-muted-foreground">No members yet.</p>}
                </div>
              </div>
              {familyGroups.find((group) => group.id === selectedGroupId)?.owner_id === user?.id ? (
                <div className="space-y-3">
                  <Label>Invite by email</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" placeholder="member@example.com" />
                    <button onClick={inviteFamilyMemberToGroup} disabled={inviteBusy} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-95 disabled:opacity-60">
                      Invite member
                    </button>
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-border bg-muted p-4">
                <p className="text-sm font-medium">Recent family activity</p>
                <div className="mt-3 space-y-3 text-sm text-foreground">
                  {groupActivity.length ? (
                    groupActivity.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-border bg-card p-3">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{event.trigger_kind ? `${event.trigger_kind} event` : "Event"} · {new Date(event.created_at).toLocaleString()}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{event.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No shared activity recorded yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="Alert sound">
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            Choose the sound that plays when you enter or leave a geofence. Loud presets are abrasive on purpose — they stop you in your tracks.
          </p>
          <SoundManager
            defaultSoundId={soundId}
            volume={volume}
            onChange={(next) => { setSoundId(next.defaultSoundId); setVolume(next.volume); }}
          />
        </Card>

        <div className="flex justify-end">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">
            <Save className="h-4 w-4" /> Save settings
          </button>
        </div>

        <Card title="Billing & subscription">
          <p className="text-sm text-muted-foreground mb-3">
            Current plan: <span className="font-semibold capitalize text-foreground">{tier}{isStaff && " · staff"}</span>
          </p>
          {hasPaidSub ? (
            <button
              onClick={openPortal}
              disabled={portalBusy}
              className="inline-flex items-center gap-2 rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" /> {portalBusy ? "Opening…" : "Manage billing"} <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </button>
          ) : !isStaff && tier !== "lifetime" ? (
            <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow">
              <Sparkles className="h-4 w-4" /> Upgrade your plan
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">No billing actions available for this account.</p>
          )}
        </Card>

        <Card title="Danger zone">
          <p className="text-sm text-muted-foreground mb-3">
            Permanently deletes your account, subscription, reminders, notifications, and all profile data.
            This action cannot be undone. (Required for App Store account-deletion compliance.)
          </p>
          <button onClick={deleteAccount} disabled={deleting} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/20 disabled:opacity-60">
            <Trash2 className="h-4 w-4" /> {deleting ? "Deleting…" : "Delete my account"}
          </button>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/80 p-5 shadow-card backdrop-blur">
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5 ${className}`}>{children}</label>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-gradient-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
