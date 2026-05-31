import { supabase } from "@/integrations/supabase/client";
import { playPreset } from "@/lib/alert-sounds";
import { toast } from "sonner";

export async function triggerTestReminder(userId: string) {
  // Visual + audible cue
  playPreset("chime", 0.8);
  toast.success("Test alert fired", { description: "This is what a real reminder feels like." });

  // Web push notification (PWA)
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission === "granted") {
      new Notification("RememberFi test reminder", {
        body: "Notifications are working — you'll get one of these when a real reminder fires.",
        icon: "/icons/icon-192.png",
      });
    }
  }

  // Persist a notification row so it shows in /notifications too
  await supabase.from("notifications").insert({
    user_id: userId,
    title: "Test reminder",
    message: "This is a test alert fired from your dashboard.",
    trigger_kind: "test",
    status: "unread",
  });
}
