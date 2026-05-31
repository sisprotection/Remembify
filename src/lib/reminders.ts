export type Priority = "low" | "medium" | "high";
export type Category = "Shopping" | "Work" | "Family" | "Emergency" | "Health" | "Other";
export type TriggerType = "enter" | "leave" | "both";
export type ReminderType = "standard" | "location";

export interface Reminder {
  id: string;
  user_id: string;
  created_by?: string | null;
  assigned_user_id?: string | null;
  group_id?: string | null;
  type: ReminderType;
  title: string;
  notes: string | null;
  priority: Priority | null;
  category: string | null;
  due_at: string | null;
  recurrence: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_m: number | null;
  trigger_type: TriggerType | null;
  one_time: boolean | null;
  active: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORIES: Category[] = ["Shopping", "Work", "Family", "Emergency", "Health", "Other"];

// Haversine distance in meters
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function metersToLabel(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function priorityColor(p?: string | null) {
  switch (p) {
    case "high": return "bg-destructive/15 text-destructive border-destructive/30";
    case "medium": return "bg-warning/20 text-warning-foreground border-warning/40";
    case "low": return "bg-success/15 text-success border-success/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
