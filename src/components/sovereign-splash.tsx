import { useEffect, useState } from "react";
import { SovereignSeal } from "./sovereign-seal";
import { SOVEREIGN, TC_VERSION } from "@/lib/sovereign";

const SPLASH_KEY = "sovereign:splash:" + TC_VERSION;

export function SovereignSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = sessionStorage.getItem(SPLASH_KEY);
    if (seen) return;
    setShow(true);
    sessionStorage.setItem(SPLASH_KEY, "1");
    const t = setTimeout(() => setShow(false), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <div
      className="splash-fade fixed inset-0 z-[200] grid place-items-center"
      style={{ background: SOVEREIGN.navy, color: "#c9a84c" }}
      aria-hidden
    >
      <div className="splash-seal flex flex-col items-center gap-6 px-6 text-center">
        <SovereignSeal size={180} />
        <div>
          <p className="font-serif-display text-2xl md:text-3xl small-caps">
            {SOVEREIGN.tagline}
          </p>
          <p className="mt-2 text-xs tracking-[0.3em] uppercase text-gold/70">
            EST. {SOVEREIGN.est}
          </p>
        </div>
      </div>
    </div>
  );
}
