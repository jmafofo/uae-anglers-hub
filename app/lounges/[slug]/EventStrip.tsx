'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Check, HelpCircle, Navigation, Users } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { eventDateLabel, type ExpeditionEvent, type Rsvp, type RsvpStatus } from '@/lib/events';

/**
 * Upcoming expeditions for a conversation — a horizontally scrolling strip
 * of event cards with one-tap RSVP, live-updated via realtime.
 */
export default function EventStrip({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const [events, setEvents] = useState<ExpeditionEvent[]>([]);
  const [rsvps, setRsvps] = useState<Map<string, Rsvp[]>>(new Map());

  const load = useCallback(async () => {
    const sb = getSupabase();
    const { data: evts } = await sb
      .from('events')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('cancelled_at', null)
      .gt('starts_at', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
      .order('starts_at', { ascending: true })
      .limit(12);
    const list = (evts ?? []) as ExpeditionEvent[];
    setEvents(list);
    if (list.length) {
      const { data: rows } = await sb
        .from('event_rsvps')
        .select('event_id, user_id, status')
        .in('event_id', list.map((e) => e.id));
      const map = new Map<string, Rsvp[]>();
      for (const r of (rows ?? []) as Rsvp[]) {
        map.set(r.event_id, [...(map.get(r.event_id) ?? []), r]);
      }
      setRsvps(map);
    } else {
      setRsvps(new Map());
    }
  }, [conversationId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch is a valid effect pattern
    void load();
    const sb = getSupabase();
    const ch = sb
      .channel(`events:${conversationId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `conversation_id=eq.${conversationId}` }, () => void load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_rsvps' }, () => void load())
      .subscribe();
    return () => {
      void sb.removeChannel(ch);
    };
  }, [conversationId, load]);

  async function setRsvp(eventId: string, status: RsvpStatus) {
    const sb = getSupabase();
    await sb.from('event_rsvps').upsert(
      { event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() },
      { onConflict: 'event_id,user_id' },
    );
    void load();
  }

  if (events.length === 0) return null;

  return (
    <div className="border-b border-[#e1e7eb] bg-white/70">
      <div className="mx-auto max-w-3xl px-4 py-2.5">
        <div className="flex gap-3 overflow-x-auto pb-1">
          {events.map((e) => {
            const mine = rsvps.get(e.id)?.find((r) => r.user_id === userId)?.status ?? null;
            const going = (rsvps.get(e.id) ?? []).filter((r) => r.status === 'going').length;
            return (
              <div key={e.id} className="w-64 shrink-0 rounded-xl border border-[#e1e7eb] bg-white p-3.5 shadow-sm">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#27685f]">
                  <CalendarDays size={11} />
                  {eventDateLabel(e.starts_at)}
                </p>
                <h3 className="mt-1 truncate font-serif text-lg tracking-[-0.02em] text-[#18333f]">{e.title}</h3>
                <p className="mt-0.5 truncate text-xs text-[#5b6b77]">{e.location_name ?? 'Dropped pin'}</p>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void setRsvp(e.id, 'going')}
                    aria-pressed={mine === 'going'}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      mine === 'going' ? 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52]' : 'border-[#dce4e8] text-[#4a5d68] hover:border-[#a8c9c2]'
                    }`}
                  >
                    <Check size={11} /> Going{going > 0 ? ` · ${going}` : ''}
                  </button>
                  <button
                    type="button"
                    onClick={() => void setRsvp(e.id, 'maybe')}
                    aria-pressed={mine === 'maybe'}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      mine === 'maybe' ? 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52]' : 'border-[#dce4e8] text-[#4a5d68] hover:border-[#a8c9c2]'
                    }`}
                  >
                    <HelpCircle size={11} /> Maybe
                  </button>
                  <Link
                    href={`/trips/${e.id}`}
                    aria-label={`Open guide for ${e.title}`}
                    className="ms-auto inline-flex items-center gap-1 rounded-full border border-[#dce4e8] px-2.5 py-1 text-xs font-semibold text-[#23675e] hover:border-[#a8c9c2]"
                  >
                    <Navigation size={11} /> Guide
                  </Link>
                </div>
                {going > 0 && (
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#7a8891]">
                    <Users size={10} /> {going} going
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
