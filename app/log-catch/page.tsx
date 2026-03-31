'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Fish, Upload, MapPin, X, Check } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { emirates } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';

const COMMON_SPECIES = [
  'Hammour (Grouper)', 'Kingfish', 'Barracuda', 'Queenfish', 'Trevally',
  'Snapper', 'Sea Bream', 'Cobia', 'Dorado', 'Sailfish',
  'Yellowfin Tuna', 'Amberjack', 'Tilapia', 'Catfish', 'Other',
];

const COMMON_BAITS = [
  'Live bait', 'Dead bait', 'Squid', 'Shrimp', 'Sardine',
  'Lure', 'Jig', 'Popper', 'Soft plastic', 'Other',
];

export default function LogCatchPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    species: '',
    scientific_name: '',
    weight_kg: '',
    length_cm: '',
    bait: '',
    technique: '',
    location_name: '',
    emirate: '',
    notes: '',
    is_public: true,
    caught_at: new Date().toISOString().slice(0, 16),
  });

  // Auto-suggest scientific name when species changes
  const suggestedScientificName = useMemo(() => {
    if (!form.species) return '';
    const q = form.species.toLowerCase();
    const match = fishSpecies.find(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        q.includes(s.name.toLowerCase().split(' ')[0].toLowerCase())
    );
    return match ? match.scientificName : '';
  }, [form.species]);

  useEffect(() => {
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
      else setAuthed(true);
    });
  }, [router]);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.species) return;
    setLoading(true);

    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push('/login'); return; }

    let photo_url: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await sb.storage
        .from('catches')
        .upload(path, photoFile, { upsert: true });
      if (!uploadErr) {
        const { data } = sb.storage.from('catches').getPublicUrl(path);
        photo_url = data.publicUrl;
      }
    }

    const { error } = await sb.from('catches').insert({
      user_id: user.id,
      species: form.species,
      scientific_name: form.scientific_name || suggestedScientificName || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      length_cm: form.length_cm ? parseFloat(form.length_cm) : null,
      bait: form.bait || null,
      technique: form.technique || null,
      location_name: form.location_name || null,
      emirate: form.emirate || null,
      notes: form.notes || null,
      is_public: form.is_public,
      caught_at: new Date(form.caught_at).toISOString(),
      photo_url,
    });

    setLoading(false);
    if (!error) setSuccess(true);
  }

  if (!authed) return null;

  if (success) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
            <Check className="w-8 h-8 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Catch Logged!</h1>
          <p className="text-gray-400 mb-6">Your catch has been saved successfully.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setPreview(null); setPhotoFile(null); setForm({ ...form, species: '', weight_kg: '', length_cm: '', bait: '', notes: '' }); }}
              className="px-5 py-2.5 rounded-lg border border-white/20 text-gray-300 hover:text-white text-sm"
            >
              Log Another
            </button>
            <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold">
              View Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <Fish className="w-5 h-5 text-teal-400" />
          <h1 className="text-2xl font-extrabold text-white">Log a Catch</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photo upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Photo (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            {preview ? (
              <div className="relative w-full h-48 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setPreview(null); setPhotoFile(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-white/20 hover:border-teal-500/50 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-teal-400 transition-colors"
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm">Tap to upload a photo</span>
              </button>
            )}
          </div>

          {/* Species */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Species *</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_SPECIES.slice(0, 8).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, species: s })}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.species === s
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'border-white/20 text-gray-400 hover:border-teal-500/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.species}
              onChange={(e) => setForm({ ...form, species: e.target.value })}
              placeholder="Or type species name..."
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
            />
            {/* Scientific name suggestion */}
            {suggestedScientificName && !form.scientific_name && (
              <p className="mt-1.5 text-xs text-gray-500">
                Scientific name:{' '}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, scientific_name: suggestedScientificName })}
                  className="italic text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {suggestedScientificName}
                </button>
                {' '}(tap to use)
              </p>
            )}
            {form.scientific_name && (
              <div className="mt-1.5 flex items-center gap-2">
                <p className="text-xs text-gray-500 italic">{form.scientific_name}</p>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, scientific_name: '' })}
                  className="text-xs text-gray-600 hover:text-gray-400"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Weight & Length */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={form.weight_kg}
                onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                placeholder="e.g. 2.5"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Length (cm)</label>
              <input
                type="number"
                step="1"
                min="0"
                value={form.length_cm}
                onChange={(e) => setForm({ ...form, length_cm: e.target.value })}
                placeholder="e.g. 45"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
              />
            </div>
          </div>

          {/* Bait */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Bait / Lure</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_BAITS.slice(0, 6).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setForm({ ...form, bait: b })}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    form.bait === b
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'border-white/20 text-gray-400 hover:border-teal-500/40'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={form.bait}
              onChange={(e) => setForm({ ...form, bait: e.target.value })}
              placeholder="Or describe your bait..."
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Location name
              </label>
              <input
                type="text"
                value={form.location_name}
                onChange={(e) => setForm({ ...form, location_name: e.target.value })}
                placeholder="e.g. Jumeirah Beach"
                className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Emirate</label>
              <select
                value={form.emirate}
                onChange={(e) => setForm({ ...form, emirate: e.target.value })}
                className="w-full bg-[#0a0f1a] border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white outline-none text-sm"
              >
                <option value="">Select...</option>
                {emirates.map((em) => (
                  <option key={em} value={em}>{em}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Date & Time Caught</label>
            <input
              type="datetime-local"
              value={form.caught_at}
              onChange={(e) => setForm({ ...form, caught_at: e.target.value })}
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white outline-none text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Conditions, tips, anything worth remembering..."
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm resize-none"
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="text-sm font-medium text-white">Make this catch public</p>
              <p className="text-xs text-gray-500 mt-0.5">Visible to the community on your profile</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_public: !form.is_public })}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                form.is_public ? 'bg-teal-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  form.is_public ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !form.species}
            className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-bold text-base transition-colors"
          >
            {loading ? 'Saving...' : 'Log Catch'}
          </button>
        </form>
      </div>
    </div>
  );
}
