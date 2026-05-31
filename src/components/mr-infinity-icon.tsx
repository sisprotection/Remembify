import videoSrc from "@/assets/mr-infinity.mp4";

export function MrInfinityIcon({
  size = 48,
  className = "",
  title = "Mr. Infinity — Head Admin",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <video
      src={videoSrc}
      width={size}
      height={size}
      autoPlay
      loop
      muted
      playsInline
      aria-label={title}
      title={title}
      className={`rounded-full object-cover select-none pointer-events-none ${className}`}
      style={{ width: size, height: size, background: "#000" }}
    />
  );
}
