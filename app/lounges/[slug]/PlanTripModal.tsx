'use client';

import { useState } from 'react';
import { CalendarPlus, Loader2, MapPin, X } from 'lucide-react';
import { fishingSpots } from '@/lib/spots';
import { getSupabase } from '@/lib/supabase';

/**
 * Plan-a-trip composer. Creates an expedition event attached to the
 * current conversation, then announces it in chat. Meeting point is a
 * known fishing spot (v1); dropped-pin support comes with the guide page.
 */
export default function PlanTripModal({
  conversationId,
  userId,
  onClose,
}: {
  conversationId: string;
  userId: string;
  onClose: (created: boolean) => void;
}) {
  const [title, setTitle] = useState('');
  const [spotSlug, setSpotSlug] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spot = fishingSpots.find((s) => s.slug === spotSlug) ?? null;
  const valid = title.trim().length > 0 && spot && date && time;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    // Interpret the picked wall-clock time as UAE local time (+04:00).
    const startsAt = new Date(`${date}T${time}:00+04:00`).toISOString();
    const sb = getSupabase();
    const { error: insertErr } = await sb.from('events').insert({
      conversation_id: conversationId,
      title: title.trim(),
      description: description.trim() || null,
      spot_slug: spot.slug,
      location_name: spot.name,
      latitude: spot.latitude,
      longitude: spot.longitude,
      starts_at: startsAt,
      created_by: userId,
    });
    if (insertErr) {
      setBusy(false);
      setError(insertErr.message);
      return;
    }
    // Announce in chat (best effort — the event already exists).
    await sb.from('messages').insert({
      conversation_id: conversationId,
      sender_id: userId,
      body: `🎣 Trip planned: “${title.trim()}” — ${spot.name}, ${new Date(startsAt).toLocaleString('en-AE', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Dubai' })}. RSVP in the trips panel above!`,
    });
    onClose(true);
  }

  const inputCls =
    'w-full rounded-lg border border-[#d4dfe4] bg-white px-3 py-2.5 text-sm text-[#18333f] placeholder:text-[#7a8891] focus:border-[#45a99b] focus:outline-none';

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Plan a fishing trip">
      <div className="w-full max-w-md rounded-2xl border border-[#e1e7eb] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-xl tracking-[-0.02em] text-[#18333f]">
            <CalendarPlus size={19} className="text-[#23675e]" />
            Plan a trip
          </h2>
          <button type="button" onClick={() => onClose(false)} aria-label="Close" className="rounded-full p-1.5 text-[#5b6b77] hover:bg-[#f0f4f5]">
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Trip title — e.g. Saturday kingfish run" className={inputCls} />
          <select value={spotSlug} onChange={(e) => setSpotSlug(e.target.value)} className={inputCls} aria-label="Meeting spot">
            <option value="">Choose a meeting spot…</option>
            {fishingSpots.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name} — {s.emirate}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} aria-label="Date" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} aria-label="Time" />
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={2000} placeholder="Plan, bait, what to bring… (optional)" className={`${inputCls} resize-none`} />
          {spot && (
            <p className="flex items-center gap-1.5 text-xs text-[#5b6b77]">
              <MapPin size={12} className="text-[#23675e]" />
              Meeting at {spot.name} — guide link will be on the event page
            </p>
          )}
          {error && <p className="text-xs font-medium text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!valid || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#23675e] text-sm font-semibold text-white transition-colors hover:bg-[#174e47] disabled:opacity-50"
          >
            {busy && <Loader2 size={15} className="animate-spin" />}
            Create expedition
          </button>
        </div>
      </div>
    </div>
  );
}
