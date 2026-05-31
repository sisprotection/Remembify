import { Link } from "@tanstack/react-router";
import { SovereignSeal } from "./sovereign-seal";

export function RememberFiLogo({ size = "md", to = "/", showText = true }: { size?: "sm" | "md" | "lg"; to?: string; showText?: boolean }) {
  const dim = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  return (
    <Link to={to} className="flex items-center gap-2.5 group">
      <SovereignSeal size={dim} className="transition group-hover:scale-105 drop-shadow-[0_0_10px_rgba(201,168,76,0.35)]" />
      {showText && (
        <span className={`font-serif-display ${textSize} font-semibold tracking-tight text-gold small-caps`}>
          RememberFi
        </span>
      )}
    </Link>
  );
}
