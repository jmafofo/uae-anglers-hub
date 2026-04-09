'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, AlertTriangle, ShoppingBag, Info } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { emirates } from '@/lib/spots';

const CATEGORIES = ['Rod', 'Reel', 'Lure', 'Accessories', 'Boat', 'Other'];
const CONDITIONS = [{ value: 'new', label: 'New' }, { value: 'like_new', label: 'Like New' }, { value: 'good', label: 'Good' }, { value: 'fair', label: 'Fair' }];

type SlotStatus = 'loading' | 'ok' | 'full';

interface SlotInfo {
  included: number;
  extra: number;
  used: number;
  available: number;
}

export default function CreateListingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [slotStatus, setSlotStatus] = useState<SlotStatus>('loading');
  const [slotInfo, setSlotInfo] = useState<SlotInfo | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Rod', condition: 'good',
    price: '', listing_type: 'fixed', emirate: '', contact_whatsapp: '', contact_email: '',
  });

  useEffect(() => {
    getSupabase().auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // Check listing slot availability (graceful — columns may not exist before migration)
      const { data: profile } = await getSupabase()
        .from('profiles')
        .select('listing_slots_included, listing_slots_extra, listing_slots_used, subscription_tier')
        .eq('id', user.id)
        .single();

      if (!profile || profile.listing_slots_included == null) {
        // Migration not yet run — allow posting (no enforcement yet)
        setSlotStatus('ok');
        return;
      }

      const included = profile.listing_slots_included ?? 5;
      const extra = profile.listing_slots_extra ?? 0;
      const used = profile.listing_slots_used ?? 0;
      // Business tier (999999 included) = unlimited
      const available = included >= 999999 ? Infinity : included + extra - used;

      setSlotInfo({ included, extra, used, available: Math.max(0, available) });
      setSlotStatus(available <= 0 ? 'full' : 'ok');
    });
  }, [router]);

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setPhotos(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || slotStatus !== 'ok') return;
    setPosting(true);

    const sb = getSupabase();
    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const ext = photo.name.split('.').pop();
      const path = `listings/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await sb.storage.from('catches').upload(path, photo);
      if (!error) {
        const { data } = sb.storage.from('catches').getPublicUrl(path);
        uploadedUrls.push(data.publicUrl);
      }
    }

    const { data, error } = await sb.from('listings').insert({
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      condition: form.condition,
      price: form.price ? parseFloat(form.price) : null,
      listing_type: form.listing_type,
      emirate: form.emirate || null,
      photos: uploadedUrls,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      contact_email: form.contact_email.trim() || null,
    }).select('id').single();

    if (!error && data) router.push(`/shop/${data.id}`);
    setPosting(false);
  }

  const field = 'w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm';

  // ── Slot-full gate ──────────────────────────────────────────────────────────
  if (slotStatus === 'full' && slotInfo) {
    return (
      <div className="min-h-screen pt-20 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <Link href="/shop" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Marketplace
          </Link>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Listing Slots Full</h1>
              <p className="text-gray-400 text-sm">
                You&apos;ve used {slotInfo.used} of {slotInfo.included + slotInfo.extra} listing slot{slotInfo.included + slotInfo.extra !== 1 ? 's' : ''}.
                Free accounts include 5 slots.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              {/* Buy extra slots */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-semibold text-white">Buy Extra Slots</span>
                </div>
                <p className="text-xs text-gray-400">AED 5 per additional listing slot, never expires.</p>
                <Link href="/advertise#slots" className="block text-center py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold transition-colors">
                  Get More Slots
                </Link>
              </div>
              {/* Upgrade */}
              <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">Upgrade Plan</span>
                </div>
                <p className="text-xs text-gray-400">Pro (50 slots) from AED 299/mo. Business = unlimited.</p>
                <Link href="/advertise" className="block text-center py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors">
                  View Plans
                </Link>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Questions? Email <a href="mailto:info@uaeangler.com" className="text-teal-400 hover:underline">info@uaeangler.com</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/shop" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Marketplace
        </Link>
        <h1 className="text-2xl font-extrabold text-white mb-1">Post a Listing</h1>

        {/* Slot indicator */}
        {slotInfo && (
          <p className="text-sm text-gray-500 mb-6">
            {slotInfo.available === Infinity
              ? 'Unlimited listing slots (Business)'
              : `${slotInfo.available} listing slot${slotInfo.available !== 1 ? 's' : ''} remaining`}
            {slotInfo.available !== Infinity && slotInfo.available <= 2 && (
              <Link href="/advertise#slots" className="ml-2 text-amber-400 hover:underline">Get more →</Link>
            )}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Photos */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Photos (up to 4)</label>
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            {previews.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setPhotos((f) => f.filter((_, j) => j !== i)); setPreviews((v) => v.filter((_, j) => j !== i)); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {previews.length < 4 && (
                  <button type="button" onClick={() => fileRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-teal-500/50 flex items-center justify-center text-gray-600 hover:text-teal-400">
                    <Upload className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-28 rounded-xl border-2 border-dashed border-white/20 hover:border-teal-500/50 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-teal-400 transition-colors">
                <Upload className="w-6 h-6" />
                <span className="text-sm">Upload photos</span>
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Title *</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Shimano Stradic 4000 — barely used" className={field} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Condition details, specs, reason for selling..." className={`${field} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Category *</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={`${field} bg-[#0a0f1a]`}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Condition *</label>
              <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className={`${field} bg-[#0a0f1a]`}>
                {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Price (AED)</label>
              <input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Leave blank for offers" className={field} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Emirate</label>
              <select value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })} className={`${field} bg-[#0a0f1a]`}>
                <option value="">Select...</option>
                {emirates.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">WhatsApp Number</label>
              <input type="tel" value={form.contact_whatsapp} onChange={(e) => setForm({ ...form, contact_whatsapp: e.target.value })} placeholder="+971 50 000 0000" className={field} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="Optional" className={field} />
            </div>
          </div>

          <button type="submit" disabled={posting || !form.title.trim() || slotStatus !== 'ok'} className="w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-bold transition-colors">
            {posting ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
