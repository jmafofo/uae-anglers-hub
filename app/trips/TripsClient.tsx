'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Lock, MapPin, Navigation, Users } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { eventDateLabel, eventDayKey, type ExpeditionEvent, type Rsvp } from '@/lib/events';
import { EmptyState, SkeletonCard } from '@/components/ui';

type EventWithMeta = ExpeditionEvent & { loungeName: string | null; loungeSlug: string | null };

export default function TripsClient() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [events, setEvents] = useState<EventWithMeta[]>([]);
  const [rsvps, setRsvps] = useState<Map<string, Rsvp[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setChecked(true);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const sb = getSupabase();
    (async () => {
      const { data: evts } = await sb
        .from('events')
        .select('*, conversation:conversations(name, slug)')
        .is('cancelled_at', null)
        .gt('starts_at', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(50);
      const list: EventWithMeta[] = ((evts ?? []) as Array<ExpeditionEvent & { conversation: { name: string; slug: string } | { name: string; slug: string }[] | null }>).map((e) => {
        const conv = Array.isArray(e.conversation) ? e.conversation[0] : e.conversation;
        return { ...e, loungeName: conv?.name ?? null, loungeSlug: conv?.slug ?? null };
      });
      setEvents(list);
      if (list.length) {
        const { data: rows } = await sb
          .from('event_rsvps')
          .select('event_id, user_id, status')
          .in('event_id', list.map((e) => e.id));
        const map = new Map<string, Rsvp[]>();
        for (const r of (rows ?? []) as Rsvp[]) map.set(r.event_id, [...(map.get(r.event_id) ?? []), r]);
        setRsvps(map);
      }
      setLoading(false);
    })();
  }, [user]);

  if (checked && !user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f7f9fa] px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2ee] text-[#23675e]">
          <Lock size={24} />
        </div>
        <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#18333f]">Sign in to see expeditions</h1>
        <Link href="/login?next=/trips" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#23675e] px-6 text-sm font-semibold text-white hover:bg-[#174e47]">
          Sign in
        </Link>
      </div>
    );
  }

  const days = new Map<string, EventWithMeta[]>();
  for (const e of events) {
    const key = eventDayKey(e.starts_at);
    days.set(key, [...(days.get(key) ?? []), e]);
  }

  return (
    <div className="min-h-screen bg-[#f7f9fa] text-[#182e3c]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27685f]">Expeditions</p>
        <h1 className="mt-2 font-serif text-[clamp(2rem,4vw,3rem)] leading-tight tracking-[-0.04em] text-[#15313f]">
          Your upcoming trips
        </h1>
        <p className="mt-3 text-[#5b6b77]">
          Trips planned in your lounges. RSVP, then let Ocean Sentinel guide you to the meeting point.
        </p>

        <div className="mt-8 flex flex-col gap-8">
          {loading && <><SkeletonCard lines={2} /><SkeletonCard lines={2} /></>}
          {!loading && events.length === 0 && (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="No trips on the horizon"
              body="Plan a trip from any lounge and it will appear here — with RSVPs and a GPS guide to the meeting point."
              action={
                <Link href="/lounges" className="inline-flex min-h-11 items-center rounded-lg bg-[#23675e] px-5 text-sm font-semibold text-white hover:bg-[#174e47]">
                  Open lounges
                </Link>
              }
            />
          )}
          {[...days.entries()].map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#5b6b77]">
                {new Date(`${day}T12:00:00+04:00`).toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Dubai' })}
              </h2>
              <div className="flex flex-col gap-3">
                {dayEvents.map((e) => {
                  const going = (rsvps.get(e.id) ?? []).filter((r) => r.status === 'going').length;
                  const mine = rsvps.get(e.id)?.find((r) => r.user_id === user?.id)?.status;
                  return (
                    <div key={e.id} className="flex items-center gap-4 rounded-2xl border border-[#e1e7eb] bg-white p-4 transition-shadow hover:shadow-[0_12px_32px_#173b4a0b]">
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#27685f]">
                          {eventDateLabel(e.starts_at)}{e.loungeName ? ` · ${e.loungeName}` : ''}
                        </p>
                        <h3 className="mt-0.5 truncate font-serif text-xl tracking-[-0.02em] text-[#18333f]">{e.title}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#5b6b77]">
                          <MapPin size={11} className="text-[#23675e]" /> {e.location_name ?? 'Dropped pin'}
                          {going > 0 && <span className="flex items-center gap-1"><Users size={11} /> {going} going</span>}
                          {mine && <span className="rounded-full bg-[#e7f2ee] px-2 py-0.5 font-semibold text-[#205b52]">{mine}</span>}
                        </p>
                      </div>
                      <Link
                        href={`/trips/${e.id}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#23675e] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[#174e47]"
                      >
                        <Navigation size={13} /> Guide
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
