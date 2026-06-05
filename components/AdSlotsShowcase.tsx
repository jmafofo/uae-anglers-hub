'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  ExternalLink,
  Monitor,
  MessageSquare,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface AdSlot {
  id: string;
  position: string;
  label: string;
  description: string;
  slot_type: string;
  width_px: number;
  height_px: number;
  base_price_per_day: number;
  is_active: boolean;
  has_active_bid: boolean;
}

const positionIcons: Record<string, React.ReactNode> = {
  home_top_marquee: <Sparkles className="w-5 h-5" />,
  home_left_sidebar: <Monitor className="w-5 h-5" />,
  home_right_sidebar: <Monitor className="w-5 h-5" />,
  community_sidebar: <MessageSquare className="w-5 h-5" />,
  spots_sidebar: <MapPin className="w-5 h-5" />,
};

function formatPrice(aed: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(aed);
}

export default function AdSlotsShowcase() {
  const [slots, setSlots] = useState<AdSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    loadSlots();
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await getSupabase().auth.getSession();
    setIsAuth(!!session);
  }

  async function loadSlots() {
    setLoading(true);
    try {
      const res = await fetch('/api/banner-slots');
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-6 h-6 text-teal-400 animate-spin mx-auto" />
        <p className="text-gray-500 text-sm mt-2">Loading ad placements…</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No ad placements available at the moment.</p>
        <a
          href="mailto:info@uaeangler.com?subject=Ad Placement Enquiry"
          className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm mt-3"
        >
          <Mail className="w-4 h-4" /> Contact us for custom placements
        </a>
      </div>
    );
  }

  const availableCount = slots.filter((s) => !s.has_active_bid).length;

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-full px-3 py-1 mb-4">
          <LayoutTemplate className="w-3 h-3" /> Media Kit
        </span>
        <h2 className="text-3xl font-extrabold text-white mb-3">Ad Placements</h2>
        <p className="text-gray-400 max-w-xl mx-auto text-sm">
          Premium fixed positions across high-traffic pages. Bid on the exact slot that matches your brand.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          {availableCount} of {slots.length} slots currently available
        </p>
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {slots.map((slot) => (
          <SlotCard key={slot.id} slot={slot} isAuth={isAuth} />
        ))}
      </div>

      {/* How it works */}
      <div className="max-w-2xl mx-auto rounded-2xl bg-white/[0.02] border border-white/10 p-6">
        <h3 className="text-sm font-semibold text-white mb-4">How bidding works</h3>
        <ol className="space-y-3">
          {[
            'Choose an available slot and select your duration (1–90 days).',
            'Submit your ad creative (image or text) and target URL.',
            'Pay securely via Stripe — your card is authorized but only charged after admin approval.',
            'Your ad goes live within 24 hours of approval.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
              <span className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[10px] font-bold text-teal-400 shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SlotCard({ slot, isAuth }: { slot: AdSlot; isAuth: boolean }) {
  const [showInquire, setShowInquire] = useState(false);
  const mailtoSubject = encodeURIComponent(`Ad Placement Enquiry: ${slot.label}`);
  const mailtoBody = encodeURIComponent(
    `Hi UAE Anglers Hub team,\n\nI'm interested in bidding for the following ad placement:\n\n` +
    `Slot: ${slot.label}\n` +
    `Position: ${slot.position}\n` +
    `Size: ${slot.width_px}×${slot.height_px}px\n` +
    `Rate: ${formatPrice(slot.base_price_per_day)}/day\n\n` +
    `Please send me more details on how to proceed.\n\n` +
    `Business Name: \n` +
    `Contact Email: \n` +
    `Desired Duration: \n`
  );

  return (
    <>
      <div
        className={`relative rounded-xl border p-5 transition-all ${
          slot.has_active_bid
            ? 'bg-white/[0.02] border-white/10 opacity-60'
            : 'bg-white/5 border-white/10 hover:border-teal-500/30'
        }`}
      >
        {/* Availability badge */}
        <div className="absolute top-3 right-3">
          {slot.has_active_bid ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
              <XCircle className="w-3 h-3" /> Booked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              <CheckCircle2 className="w-3 h-3" /> Available
            </span>
          )}
        </div>

        {/* Icon + Label */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            {positionIcons[slot.position] ?? <LayoutTemplate className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{slot.label}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{slot.slot_type}</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">{slot.description}</p>

        {/* Specs */}
        <div className="flex items-center gap-3 mb-4 text-xs">
          <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
            {slot.width_px}×{slot.height_px}px
          </span>
          <span className="px-2 py-1 rounded-md bg-white/5 text-gray-400 border border-white/10">
            {slot.slot_type === 'marquee' ? 'Text / HTML' : 'Image'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-xl font-extrabold text-teal-400">
            {formatPrice(slot.base_price_per_day)}
          </span>
          <span className="text-xs text-gray-500">/ day</span>
        </div>

        {/* CTA */}
        {slot.has_active_bid ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 text-gray-500 text-sm font-semibold cursor-not-allowed"
          >
            Currently Booked
          </button>
        ) : isAuth ? (
          <Link
            href={`/advertise/bid?slot=${slot.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors"
          >
            Bid on this slot <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={() => setShowInquire(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-500/30 text-white text-sm font-semibold transition-colors"
          >
            Inquire <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Inquire modal */}
      {showInquire && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowInquire(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-[#0a0f1a] border border-white/10 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">{slot.label}</h3>
            <p className="text-sm text-gray-400 mb-5">
              Interested in this placement? Get in touch and we&apos;ll send you a booking link.
            </p>
            <div className="space-y-2">
              <a
                href={`mailto:info@uaeangler.com?subject=${mailtoSubject}&body=${mailtoBody}`}
                className="flex items-center justify-center gap-2 w-full bg-teal-500 hover:bg-teal-400 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                <Mail className="w-4 h-4" /> Email us
              </a>
              <Link
                href="/login?next=/advertise"
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Sign in to bid instantly
              </Link>
            </div>
            <button
              onClick={() => setShowInquire(false)}
              className="mt-4 w-full text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
