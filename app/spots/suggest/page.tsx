'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { MapPin, Loader2, CheckCircle2, ChevronLeft, Compass } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { emirates } from '@/lib/spots';

type Gate = 'loading' | 'signed-out' | 'ready';

type Prev = {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
};

export default function SuggestSpotPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [prev, setPrev] = useState<Prev[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  const [name, setName] = useState('');
  const [emirate, setEmirate] = useState<string>(emirates[0]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [accessType, setAccessType] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [targetSpecies, setTargetSpecies] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGate('signed-out'); return; }
      setToken(session.access_token);
      setGate('ready');

      const r = await fetch('/api/spots/suggest', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (r.ok) {
        const body = await r.json();
        setPrev(body.contributions ?? []);
      }
    })();
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation not supported on this device');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      err => {
        setError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setSubmitted(false);

    const body = {
      name: name.trim(),
      emirate,
      latitude: Number(latitude),
      longitude: Number(longitude),
      access_type: accessType.trim() || null,
      description: description.trim() || null,
      photo_url: photoUrl.trim() || null,
      target_species: targetSpecies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    };

    const r = await fetch('/api/spots/suggest', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await r.json();
    setSubmitting(false);

    if (!r.ok) { setError(payload.error ?? 'Submission failed'); return; }
    setSubmitted(true);
    setPrev(p => [payload.contribution, ...p]);
    setName(''); setLatitude(''); setLongitude('');
    setAccessType(''); setDescription(''); setPhotoUrl(''); setTargetSpecies('');
  }

  if (gate === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (gate === 'signed-out') {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-white mb-2">Sign in to suggest a spot</h1>
          <p className="text-gray-400 mb-6">
            Help us grow the UAE fishing community. Sign in to submit new spots for admin review.
          </p>
          <Link
            href="/login?next=/spots/suggest"
            className="inline-block bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/spots" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Spots
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-1">
            <MapPin className="w-4 h-4" />
            Community
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Suggest a fishing spot</h1>
          <p className="text-gray-400">
            Know a spot we haven&apos;t catalogued? Submit it for admin review. Approved spots go
            live for the whole community.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5 bg-white/[0.02] border border-white/10 rounded-2xl p-6">
          <Field label="Spot name" required>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="e.g. Al Jeer Breakwater"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Emirate" required>
              <select
                value={emirate}
                onChange={e => setEmirate(e.target.value)}
                className={inputClass}
              >
                {emirates.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
            </Field>
            <Field label="Access type">
              <input
                value={accessType}
                onChange={e => setAccessType(e.target.value)}
                placeholder="Shore · Marina · Kayak…"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="GPS coordinates" required>
            <div className="flex gap-2">
              <input
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                required
                type="number"
                step="0.000001"
                min="22" max="27"
                placeholder="Latitude (22–27)"
                className={inputClass}
              />
              <input
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                required
                type="number"
                step="0.000001"
                min="51" max="57"
                placeholder="Longitude (51–57)"
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 disabled:opacity-40"
            >
              {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
              Use my current location
            </button>
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Access notes, best time, facilities, anything anglers should know."
              className={inputClass}
            />
          </Field>

          <Field label="Target species">
            <input
              value={targetSpecies}
              onChange={e => setTargetSpecies(e.target.value)}
              placeholder="Kingfish, Hammour, Queenfish (comma separated)"
              className={inputClass}
            />
          </Field>

          <Field label="Photo URL">
            <input
              value={photoUrl}
              onChange={e => setPhotoUrl(e.target.value)}
              type="url"
              placeholder="https://…"
              className={inputClass}
            />
          </Field>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {submitted && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Submitted. An admin will review your suggestion shortly.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Submit for review
          </button>
        </form>

        {prev.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
              Your previous submissions
            </h2>
            <ul className="space-y-2">
              {prev.map(p => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/10 text-sm"
                >
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate">{p.name}</div>
                    {p.admin_notes && (
                      <div className="text-xs text-gray-500 italic truncate">
                        Admin note: {p.admin_notes}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-400 transition-colors';

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-300 mb-1.5">
        {label}{required && <span className="text-teal-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatusBadge({ status }: { status: Prev['status'] }) {
  const cls =
    status === 'approved'
      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
      : status === 'rejected'
        ? 'bg-red-500/10 text-red-400 border-red-500/30'
        : 'bg-amber-500/10 text-amber-300 border-amber-500/30';
  return (
    <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border capitalize ${cls}`}>
      {status}
    </span>
  );
}
