'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft, CalendarDays, Check, Crown, HelpCircle, Loader2, Lock,
  MapPin, Navigation, Thermometer, Users, Wind,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { eventDateLabel, windVerdict, type ExpeditionEvent, type Rsvp, type RsvpStatus } from '@/lib/events';

const TripGuideMap = dynamic(() => import('@/components/map/TripGuideMap'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-[#e7edef] text-sm text-[#5b6b77]">Loading guide…</div>,
});

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface Conditions { temp: number; windKmh: number }

export default function TripGuideClient({ eventId }: { eventId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [premium, setPremium] = useState(false);
  const [event, setEvent] = useState<ExpeditionEvent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [conditions, setConditions] = useState<Conditions | null>(null);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setChecked(true);
    });
  }, []);

  const loadRsvps = useCallback(async () => {
    const { data } = await getSupabase().from('event_rsvps').select('event_id, user_id, status').eq('event_id', eventId);
    setRsvps((data ?? []) as Rsvp[]);
  }, [eventId]);

  useEffect(() => {
    if (!user) return;
    const sb = getSupabase();
    (async () => {
      const [{ data: evt }, { data: profile }] = await Promise.all([
        sb.from('events').select('*').eq('id', eventId).maybeSingle(),
        sb.from('profiles').select('ocean_sentinel_premium').eq('id', user.id).maybeSingle(),
      ]);
      if (!evt) { setNotFound(true); return; }
      setEvent(evt as ExpeditionEvent);
      setPremium(Boolean(profile?.ocean_sentinel_premium));
      void loadRsvps();
    })();
  }, [user, eventId, loadRsvps]);

  // Live position (premium guide)
  useEffect(() => {
    if (!premium || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 15000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [premium]);

  // Conditions forecast at the meeting point for trip time
  useEffect(() => {
    if (!event?.latitude || !event?.longitude) return;
    const { latitude: lat, longitude: lng } = event;
    (async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m&forecast_days=14&timezone=Asia%2FDubai`,
        );
        const json = await res.json();
        const times: string[] = json.hourly?.time ?? [];
        const target = event.starts_at.slice(0, 13); // hour precision
        let idx = times.findIndex((t) => t.startsWith(target.slice(0, 10)) && t.slice(11, 13) === target.slice(11, 13));
        if (idx < 0) idx = 0;
        setConditions({
          temp: json.hourly.temperature_2m[idx],
          windKmh: json.hourly.wind_speed_10m[idx],
        });
      } catch { /* conditions are a bonus, never block the guide */ }
    })();
  }, [event]);

  async function setRsvp(status: RsvpStatus) {
    if (!user) return;
    await getSupabase().from('event_rsvps').upsert(
      { event_id: eventId, user_id: user.id, status, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' },
    );
    void loadRsvps();
  }

  if (checked && !user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f7f9fa] px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2ee] text-[#23675e]"><Lock size={24} /></div>
        <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#18333f]">Sign in for the trip guide</h1>
        <Link href={`/login?next=/trips/${eventId}`} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#23675e] px-6 text-sm font-semibold text-white hover:bg-[#174e47]">Sign in</Link>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f7f9fa] px-6 text-center">
        <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#18333f]">Trip not found</h1>
        <Link href="/trips" className="mt-4 text-sm font-semibold text-[#23675e] underline underline-offset-4">All expeditions</Link>
      </div>
    );
  }

  const meeting: [number, number] | null =
    event?.latitude != null && event?.longitude != null ? [event.latitude, event.longitude] : null;
  const distanceKm = userPos && meeting ? haversineKm(userPos.lat, userPos.lng, meeting[0], meeting[1]) : null;
  const going = rsvps.filter((r) => r.status === 'going').length;
  const mine = rsvps.find((r) => r.user_id === user?.id)?.status ?? null;
  const verdict = conditions ? windVerdict(conditions.windKmh) : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f7f9fa]">
      <div className="border-b border-[#e1e7eb] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link href="/trips" aria-label="Back to expeditions" className="rounded-full p-2 text-[#5b6b77] hover:bg-[#f0f4f5]">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-xl leading-tight tracking-[-0.02em] text-[#18333f]">{event?.title ?? '…'}</h1>
            {event && (
              <p className="flex items-center gap-1.5 text-xs text-[#5b6b77]">
                <CalendarDays size={11} /> {eventDateLabel(event.starts_at)}
                <MapPin size={11} className="ms-1" /> {event.location_name ?? 'Dropped pin'}
              </p>
            )}
          </div>
          {premium && (
            <span className="ms-auto inline-flex items-center gap-1 rounded-full border border-[#d4af5a]/60 bg-[#faf3e3] px-2.5 py-1 text-xs font-semibold text-[#8a651c]">
              <Crown size={12} /> Sentinel guide
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-4">
        {/* Guide panel */}
        {meeting && premium ? (
          <div className="relative h-72 overflow-hidden rounded-2xl border border-[#e1e7eb] sm:h-96">
            <TripGuideMap meeting={meeting} meetingLabel={event?.location_name ?? 'Meeting point'} userPos={userPos} />
            {distanceKm != null && (
              <div className="absolute bottom-3 left-3 z-[500] rounded-full border border-[#e1e7eb] bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#18333f] backdrop-blur-sm">
                {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`} from the meeting point
              </div>
            )}
          </div>
        ) : meeting ? (
          <div className="rounded-2xl border border-[#d4af5a]/50 bg-gradient-to-br from-[#faf3e3] to-white p-6">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a651c]">
              <Crown size={13} /> Ocean Sentinel · Premium
            </p>
            <h2 className="mt-2 font-serif text-2xl tracking-[-0.02em] text-[#18333f]">
              Let Sentinel guide you to the water.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[#5b6b77]">
              Live GPS guide to the meeting point, distance as you approach, and the conditions
              forecast for trip time. Upgrade to unlock it for this trip and every one after.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/ocean-sentinel" className="inline-flex min-h-11 items-center rounded-lg bg-[#b8892d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8a651c]">
                Upgrade to Sentinel
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${meeting[0]},${meeting[1]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#cbd5dc] px-5 text-sm font-semibold text-[#18333f] hover:bg-[#eaf1f2]"
              >
                <Navigation size={14} /> Basic directions
              </a>
            </div>
          </div>
        ) : null}

        {/* Conditions at trip time */}
        {conditions && verdict && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-[#e1e7eb] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#27685f]">Forecast for trip time</p>
            <span className="flex items-center gap-1.5 text-sm text-[#18333f]"><Thermometer size={14} className="text-[#23675e]" /> {Math.round(conditions.temp)}°C</span>
            <span className="flex items-center gap-1.5 text-sm text-[#18333f]"><Wind size={14} className="text-[#23675e]" /> {Math.round(conditions.windKmh)} km/h</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              verdict.tone === 'good' ? 'bg-[#e7f2ee] text-[#205b52]' : verdict.tone === 'fair' ? 'bg-[#faf3e3] text-[#8a651c]' : 'bg-red-50 text-red-700'
            }`}>{verdict.label}</span>
          </div>
        )}

        {/* RSVP */}
        <div className="flex items-center gap-2 rounded-2xl border border-[#e1e7eb] bg-white p-4">
          <span className="flex items-center gap-1.5 text-sm text-[#5b6b77]"><Users size={15} /> {going} going</span>
          <div className="ms-auto flex gap-2">
            <button
              type="button"
              onClick={() => void setRsvp('going')}
              aria-pressed={mine === 'going'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${mine === 'going' ? 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52]' : 'border-[#dce4e8] text-[#4a5d68] hover:border-[#a8c9c2]'}`}
            >
              <Check size={12} /> Going
            </button>
            <button
              type="button"
              onClick={() => void setRsvp('maybe')}
              aria-pressed={mine === 'maybe'}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${mine === 'maybe' ? 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52]' : 'border-[#dce4e8] text-[#4a5d68] hover:border-[#a8c9c2]'}`}
            >
              <HelpCircle size={12} /> Maybe
            </button>
          </div>
        </div>

        {event?.description && (
          <div className="rounded-2xl border border-[#e1e7eb] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#27685f]">Plan</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#18333f]">{event.description}</p>
          </div>
        )}

        {event && !premium && (
          <p className="pb-4 text-center text-xs text-[#7a8891]">
            <Loader2 size={11} className="me-1 inline animate-spin" /> Live GPS guide is an Ocean Sentinel feature
          </p>
        )}
      </div>
    </div>
  );
}
