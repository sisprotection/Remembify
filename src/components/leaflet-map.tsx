import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

// Fix default icon paths (Leaflet expects bundler-resolvable URLs)
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

type LatLng = { lat: number; lng: number };

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Recenter({ center }: { center: LatLng }) {
  const map = useMap();
  useEffect(() => { map.setView([center.lat, center.lng]); }, [center, map]);
  return null;
}

export default function LeafletMap({
  center, point, radius, onPick, height = "100%",
  markers, interactive = true,
}: {
  center: LatLng;
  point?: LatLng | null;
  radius?: number;
  onPick?: (p: LatLng) => void;
  height?: string;
  markers?: Array<{ id: string; lat: number; lng: number; radius?: number; label?: string; color?: string }>;
  interactive?: boolean;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return <div style={{ height }} className="w-full rounded-2xl bg-muted animate-pulse" />;

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-border">
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && interactive && <ClickHandler onPick={onPick} />}
        <Recenter center={center} />
        {point && (
          <>
            <Marker position={[point.lat, point.lng]} icon={icon} />
            {radius && <Circle center={[point.lat, point.lng]} radius={radius} pathOptions={{ color: "#4f7cff", fillColor: "#4f7cff", fillOpacity: 0.15 }} />}
          </>
        )}
        {markers?.map((m) => (
          <div key={m.id}>
            <Marker position={[m.lat, m.lng]} icon={icon} />
            {m.radius && <Circle center={[m.lat, m.lng]} radius={m.radius} pathOptions={{ color: m.color ?? "#4f7cff", fillColor: m.color ?? "#4f7cff", fillOpacity: 0.12 }} />}
          </div>
        ))}
      </MapContainer>
    </div>
  );
}
