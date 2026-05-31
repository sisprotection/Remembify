import { Smartphone, Apple, Chrome, Share } from "lucide-react";
import { useState } from "react";

export function InstallInstructions() {
  const [tab, setTab] = useState<"ios" | "android">("ios");

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-card p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow shrink-0">
          <Smartphone className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-display font-semibold">Install RememberFi on your phone</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Our App Store build is in review. While we wait, you can install RememberFi directly from your browser — it works just like a native app, with home-screen icon and full-screen experience.
          </p>

          <div className="mt-4 flex items-center gap-1 rounded-full bg-card border border-border p-1 w-fit">
            <button onClick={() => setTab("ios")} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${tab === "ios" ? "bg-gradient-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <Apple className="h-3.5 w-3.5" /> iPhone / iPad
            </button>
            <button onClick={() => setTab("android")} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${tab === "android" ? "bg-gradient-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <Chrome className="h-3.5 w-3.5" /> Android
            </button>
          </div>

          {tab === "ios" ? (
            <ol className="mt-4 space-y-2 text-sm">
              <Step n={1}>Open <strong>rememberfi.lovable.app</strong> in <strong>Safari</strong> (other browsers won't work for this).</Step>
              <Step n={2}>Tap the <strong>Share</strong> button <Share className="inline h-3.5 w-3.5 align-text-bottom" /> at the bottom of the screen.</Step>
              <Step n={3}>Scroll and tap <strong>Add to Home Screen</strong>.</Step>
              <Step n={4}>Tap <strong>Add</strong>. The RememberFi icon will appear on your home screen.</Step>
              <Step n={5}>Open the icon and grant <strong>location</strong> + <strong>notification</strong> permissions when prompted.</Step>
            </ol>
          ) : (
            <ol className="mt-4 space-y-2 text-sm">
              <Step n={1}>Open <strong>rememberfi.lovable.app</strong> in <strong>Chrome</strong>.</Step>
              <Step n={2}>Tap the <strong>three-dot menu</strong> in the top right.</Step>
              <Step n={3}>Tap <strong>Install app</strong> (or "Add to Home screen").</Step>
              <Step n={4}>Confirm. The RememberFi icon will appear on your home screen.</Step>
              <Step n={5}>Open it and allow <strong>location</strong> + <strong>notifications</strong> so we can alert you at the right time and place.</Step>
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary text-xs font-bold">{n}</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
