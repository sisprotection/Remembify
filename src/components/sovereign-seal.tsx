import sealSrc from "@/assets/sovereign-seal.png";

export function SovereignSeal({ size = 120, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={sealSrc}
      alt="Sovereign Holdings LLC"
      width={size}
      height={size}
      loading="lazy"
      className={`select-none ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
