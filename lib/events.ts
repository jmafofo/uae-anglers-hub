/** Shared types and helpers for Expeditions (events + RSVPs). */

export interface ExpeditionEvent {
  id: string;
  conversation_id: string;
  title: string;
  description: string | null;
  spot_slug: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  cancelled_at: string | null;
}

export type RsvpStatus = 'going' | 'maybe' | 'declined';

export interface Rsvp {
  event_id: string;
  user_id: string;
  status: RsvpStatus;
}

export function meetingPointLabel(e: ExpeditionEvent, spotName?: string): string {
  if (spotName) return spotName;
  if (e.location_name) return e.location_name;
  if (e.latitude != null && e.longitude != null) {
    return `${e.latitude.toFixed(4)}°N, ${e.longitude.toFixed(4)}°E`;
  }
  return 'Location TBD';
}

export function eventDateLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-AE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  });
}

export function eventDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
}

/** Rough UAE fishing condition score from Open-Meteo wind (km/h). */
export function windVerdict(kmh: number): { label: string; tone: 'good' | 'fair' | 'rough' } {
  if (kmh < 15) return { label: 'Light — great conditions', tone: 'good' };
  if (kmh < 25) return { label: 'Moderate — fishable', tone: 'fair' };
  return { label: 'Rough — consider rescheduling', tone: 'rough' };
}
