import { useEffect, useState } from "react";

type Props = React.ComponentProps<typeof import("./leaflet-map")["default"]>;

export default function ClientMap(props: Props) {
  const [Comp, setComp] = useState<React.ComponentType<Props> | null>(null);
  useEffect(() => {
    let mounted = true;
    import("./leaflet-map").then((m) => { if (mounted) setComp(() => m.default); });
    return () => { mounted = false; };
  }, []);
  if (!Comp) return <div style={{ height: props.height ?? "100%" }} className="w-full rounded-2xl bg-muted animate-pulse" />;
  return <Comp {...props} />;
}
