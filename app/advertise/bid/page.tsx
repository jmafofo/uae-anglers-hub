'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  ImageIcon,
  Type,
  Globe,
  CalendarDays,
  Building2,
  Mail,
  CreditCard,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';

interface Slot {
  id: string;
  position: string;
  label: string;
  description: string;
  slot_type: string;
  width_px: number;
  height_px: number;
  base_price_per_day: number;
}

function formatPrice(aed: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(aed);
}

function BidFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slotId = searchParams.get('slot');

  const [slot, setSlot] = useState<Slot | null>(null);
  const [loadingSlot, setLoadingSlot] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    image_url: '',
    marquee_text: '',
    target_url: '',
    duration_days: 7,
  });

  useEffect(() => {
    async function load() {
      if (!slotId) { setLoadingSlot(false); return; }
      try {
        const res = await fetch('/api/banner-slots');
        if (res.ok) {
          const data = await res.json();
          const found = (data.slots ?? []).find((s: Slot) => s.id === slotId);
          if (found) setSlot(found);
        }
      } catch {
        // ignore
      } finally {
        setLoadingSlot(false);
      }
    }
    load();

    // Pre-fill email from profile
    getSupabase().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setForm((f) => ({ ...f, business_email: user.email! }));
      }
    });
  }, [slotId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Step 1: Create draft bid
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      const bidRes = await fetch('/api/banner-bids', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          slot_id: slotId,
          business_name: form.business_name,
          business_email: form.business_email,
          image_url: form.image_url,
          marquee_text: form.marquee_text,
          target_url: form.target_url,
          duration_days: form.duration_days,
        }),
      });

      const bidData = await bidRes.json().catch(() => ({}));
      if (!bidRes.ok) {
        setError(bidData.error || 'Could not create bid. Please check your details.');
        setSubmitting(false);
        return;
      }

      // Step 2: Create Stripe checkout
      const checkoutRes = await fetch('/api/banner-bids/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify({ bid_id: bidData.bid.id }),
      });

      const checkoutData = await checkoutRes.json().catch(() => ({}));
      if (!checkoutRes.ok) {
        setError(checkoutData.error || 'Could not start checkout. Please try again.');
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe
      window.location.href = checkoutData.url;
    } catch {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const total = slot ? slot.base_price_per_day * form.duration_days : 0;
  const isImageSlot = slot && slot.slot_type !== 'marquee';
  const isTextSlot = slot && slot.slot_type === 'marquee';

  if (loadingSlot) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-white mb-2">Slot not found</h1>
        <p className="text-gray-400 text-sm mb-4">This ad placement does not exist or is no longer available.</p>
        <Link href="/advertise" className="text-teal-400 hover:text-teal-300 text-sm font-semibold">
          ← Back to Advertising
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/advertise"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
        <h1 className="text-xl font-bold text-white mb-1">Bid on {slot.label}</h1>
        <p className="text-sm text-gray-400 mb-4">{slot.description}</p>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
            {slot.width_px}×{slot.height_px}px
          </span>
          <span className="px-2 py-1 rounded-md bg-white/5 text-teal-400 border border-teal-500/20">
            {formatPrice(slot.base_price_per_day)}/day
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Business name" icon={<Building2 className="w-4 h-4" />} required>
          <input
            type="text"
            required
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            placeholder="e.g. Abu Dhabi Fishing Tours"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        <Field label="Business email" icon={<Mail className="w-4 h-4" />} required>
          <input
            type="email"
            required
            value={form.business_email}
            onChange={(e) => setForm({ ...form, business_email: e.target.value })}
            placeholder="contact@yourbusiness.com"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        {isImageSlot && (
          <Field label="Ad image URL" icon={<ImageIcon className="w-4 h-4" />} required>
            <input
              type="url"
              required
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://your-site.com/banner.jpg"
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Image must be exactly {slot.width_px}×{slot.height_px}px
            </p>
          </Field>
        )}

        {isTextSlot && (
          <Field label="Marquee text" icon={<Type className="w-4 h-4" />} required>
            <input
              type="text"
              required
              maxLength={120}
              value={form.marquee_text}
              onChange={(e) => setForm({ ...form, marquee_text: e.target.value })}
              placeholder="Your scrolling message…"
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
            />
          </Field>
        )}

        <Field label="Target URL" icon={<Globe className="w-4 h-4" />} required>
          <input
            type="url"
            required
            value={form.target_url}
            onChange={(e) => setForm({ ...form, target_url: e.target.value })}
            placeholder="https://your-site.com/landing-page"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        <Field label="Duration" icon={<CalendarDays className="w-4 h-4" />} required>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={90}
              value={form.duration_days}
              onChange={(e) => setForm({ ...form, duration_days: Number(e.target.value) })}
              className="flex-1 accent-teal-500"
            />
            <span className="text-sm text-white font-semibold w-16 text-right">
              {form.duration_days} day{form.duration_days !== 1 ? 's' : ''}
            </span>
          </div>
        </Field>

        {/* Total */}
        <div className="rounded-xl bg-teal-500/5 border border-teal-500/15 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total</span>
            <span className="text-xl font-extrabold text-teal-400">{formatPrice(total)}</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">
            Payment authorized on checkout. Charged only after admin approval.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {submitting ? 'Processing…' : 'Proceed to Payment'}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  icon,
  required,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-sm text-gray-300 mb-1.5">
        <span className="text-gray-500">{icon}</span>
        {label}
        {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function BidPage() {
  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <Suspense
        fallback={
          <div className="text-center py-20">
            <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
          </div>
        }
      >
        <BidFormContent />
      </Suspense>
    </div>
  );
}
