'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LayoutTemplate,
  Calendar,
  DollarSign,
  Image as ImageIcon,
  Link as LinkIcon,
  Building2,
  Mail,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  Monitor,
  Type,
  PanelTop,
  RectangleHorizontal,
  Popcorn,
  Maximize2,
  Layers,
} from 'lucide-react';
import { supabase, getAuthHeaders } from '@/lib/supabase';

type SlotType = 'banner' | 'marquee' | 'sticky' | 'inline' | 'modal' | 'interstitial';

type Slot = {
  id: string;
  position: string;
  label: string;
  description: string | null;
  slot_type: SlotType;
  width_px: number;
  height_px: number;
  base_price_per_day: number;
  has_active_bid: boolean;
};

// Fallback slots — shown if the API/database isn't available yet
const FALLBACK_SLOTS: Slot[] = [
  { id: 'home-marquee',      position: 'home_top_marquee',      label: 'Homepage Marquee',         description: 'Scrolling marquee banner at the top of the homepage',                          slot_type: 'marquee',      width_px: 1200, height_px: 60,  base_price_per_day: 100, has_active_bid: false },
  { id: 'home-left',         position: 'home_left_sidebar',     label: 'Homepage Left Sidebar',    description: 'Vertical banner on the left side of the homepage hero',                        slot_type: 'banner',       width_px: 300,  height_px: 600, base_price_per_day: 75,  has_active_bid: false },
  { id: 'home-right',        position: 'home_right_sidebar',    label: 'Homepage Right Sidebar',   description: 'Vertical banner on the right side of the homepage hero',                       slot_type: 'banner',       width_px: 300,  height_px: 600, base_price_per_day: 75,  has_active_bid: false },
  { id: 'community',         position: 'community_sidebar',     label: 'Community Sidebar',        description: 'Vertical banner in the community forum pages',                                 slot_type: 'banner',       width_px: 300,  height_px: 600, base_price_per_day: 50,  has_active_bid: false },
  { id: 'spots',             position: 'spots_sidebar',         label: 'Spots Sidebar',            description: 'Vertical banner on fishing spot detail pages',                                 slot_type: 'banner',       width_px: 300,  height_px: 600, base_price_per_day: 60,  has_active_bid: false },
  { id: 'home-leaderboard',  position: 'home_hero_leaderboard', label: 'Homepage Hero Leaderboard', description: 'Large rich-media banner below the homepage hero section',                     slot_type: 'banner',       width_px: 970,  height_px: 250, base_price_per_day: 150, has_active_bid: false },
  { id: 'home-inline-1',     position: 'home_inline_1',         label: 'Homepage Inline 1',        description: 'Medium rectangle between Trending News and Data Gap sections',                 slot_type: 'inline',       width_px: 300,  height_px: 250, base_price_per_day: 80,  has_active_bid: false },
  { id: 'home-inline-2',     position: 'home_inline_2',         label: 'Homepage Inline 2',        description: 'Medium rectangle between Platform Features and Species Showcase',              slot_type: 'inline',       width_px: 300,  height_px: 250, base_price_per_day: 80,  has_active_bid: false },
  { id: 'sticky-bottom',     position: 'sticky_bottom',         label: 'Sticky Bottom Banner',     description: 'Fixed bottom banner visible on all pages',                                     slot_type: 'sticky',       width_px: 728,  height_px: 90,  base_price_per_day: 120, has_active_bid: false },
  { id: 'home-modal',        position: 'home_modal',            label: 'Homepage Modal',           description: 'Modal popup on homepage — shows once per visitor session',                     slot_type: 'modal',        width_px: 600,  height_px: 400, base_price_per_day: 200, has_active_bid: false },
  { id: 'interstitial',      position: 'interstitial',          label: 'Site Interstitial',        description: 'Full-screen overlay between page navigations — shows once per session',        slot_type: 'interstitial', width_px: 1080, height_px: 720, base_price_per_day: 300, has_active_bid: false },
];

function slotTypeLabel(type: SlotType): string {
  switch (type) {
    case 'marquee': return 'Marquee';
    case 'sticky': return 'Sticky';
    case 'inline': return 'Inline';
    case 'modal': return 'Modal';
    case 'interstitial': return 'Interstitial';
    default: return 'Banner';
  }
}

function slotTypeIcon(type: SlotType) {
  switch (type) {
    case 'marquee': return Monitor;
    case 'sticky': return PanelTop;
    case 'inline': return RectangleHorizontal;
    case 'modal': return Popcorn;
    case 'interstitial': return Maximize2;
    default: return LayoutTemplate;
  }
}

function isImageSlot(type: SlotType): boolean {
  return type === 'banner' || type === 'sticky' || type === 'inline' || type === 'modal' || type === 'interstitial';
}

function SlotCard({ slot, onBid }: { slot: Slot; onBid: (s: Slot) => void }) {
  const Icon = slotTypeIcon(slot.slot_type);
  return (
    <div
      className={`relative rounded-2xl border p-5 flex flex-col ${
        slot.has_active_bid
          ? 'border-white/5 bg-white/[0.02] opacity-60'
          : 'border-white/10 bg-white/5 hover:border-amber-500/30 transition-colors'
      }`}
    >
      {slot.has_active_bid && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">
          Occupied
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">{slot.label}</h3>
          <span className="text-[10px] uppercase tracking-wider text-gray-500">{slotTypeLabel(slot.slot_type)}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3 flex-1">{slot.description}</p>

      <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
        <span className="flex items-center gap-1">
          <Monitor className="w-3 h-3" /> {slot.width_px}×{slot.height_px}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" /> From AED {slot.base_price_per_day}/day
        </span>
      </div>

      <button
        onClick={() => onBid(slot)}
        disabled={slot.has_active_bid}
        className={`w-full text-center py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1 ${
          slot.has_active_bid
            ? 'bg-white/5 text-gray-600 cursor-not-allowed'
            : 'bg-amber-500 hover:bg-amber-400 text-white'
        }`}
      >
        {slot.has_active_bid ? 'Currently Booked' : 'Place Bid'}
        {!slot.has_active_bid && <ChevronRight className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function BannerBiddingSection() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({
    business_name: '',
    business_email: '',
    image_url: '',
    marquee_text: '',
    target_url: '',
    duration_days: '7',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    try {
      const r = await fetch('/api/banner-slots');
      const body = await r.json();
      if (r.ok && body.slots?.length) {
        setSlots(body.slots);
      } else {
        setSlots(FALLBACK_SLOTS);
      }
    } catch {
      setSlots(FALLBACK_SLOTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setForm((f) => ({ ...f, business_email: data.user!.email! }));
      }
    });
  }, []);

  function openBid(slot: Slot) {
    setSelectedSlot(slot);
    setFormError(null);
    setForm((f) => ({
      ...f,
      business_name: '',
      image_url: '',
      marquee_text: '',
      target_url: '',
      duration_days: '7',
    }));
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;

    setFormError(null);
    const needsImage = isImageSlot(selectedSlot.slot_type) && !form.image_url.trim();
    const needsText = selectedSlot.slot_type === 'marquee' && !form.marquee_text.trim();

    if (!form.business_name.trim() || !form.business_email.trim() || !form.target_url.trim() || needsImage || needsText) {
      setFormError('All fields are required');
      return;
    }

    const duration = Math.max(1, Math.min(90, Number(form.duration_days) || 7));
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      setFormError('Please sign in to place a bid');
      return;
    }

    setSubmitting(true);

    const body: Record<string, unknown> = {
      slot_id: selectedSlot.id,
      business_name: form.business_name,
      business_email: form.business_email,
      target_url: form.target_url,
      duration_days: duration,
    };
    if (selectedSlot.slot_type === 'marquee') {
      body.marquee_text = form.marquee_text.trim();
    } else {
      body.image_url = form.image_url.trim();
    }

    const createRes = await fetch('/api/banner-bids', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const createBody = await createRes.json().catch(() => ({}));
    if (!createRes.ok) {
      setSubmitting(false);
      setFormError(createBody.error ?? 'Failed to create bid');
      return;
    }

    const checkoutRes = await fetch('/api/banner-bids/checkout', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bid_id: createBody.bid.id }),
    });

    const checkoutBody = await checkoutRes.json().catch(() => ({}));
    setSubmitting(false);

    if (!checkoutRes.ok) {
      setFormError(checkoutBody.error ?? 'Failed to start checkout');
      return;
    }

    if (checkoutBody.url) {
      window.location.href = checkoutBody.url;
    }
  }

  // Group slots by category
  const marqueeSlots = slots.filter((s) => s.slot_type === 'marquee');
  const bannerSlots = slots.filter((s) => s.slot_type === 'banner');
  const advancedSlots = slots.filter((s) => s.slot_type === 'sticky' || s.slot_type === 'inline' || s.slot_type === 'modal' || s.slot_type === 'interstitial');

  const totalPrice = selectedSlot
    ? selectedSlot.base_price_per_day * Math.max(1, Number(form.duration_days) || 7)
    : 0;

  const isMarquee = selectedSlot?.slot_type === 'marquee';
  const slotLabel = selectedSlot ? slotTypeLabel(selectedSlot.slot_type) : 'Ad';

  return (
    <section className="max-w-5xl mx-auto mb-24">
      {/* ── Marquee Ads ── */}
      {marqueeSlots.length > 0 && (
        <div id="marquee-bids" className="mb-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
              <Monitor className="w-3 h-3" /> Scrolling
            </span>
            <h2 className="text-2xl font-extrabold text-white mb-2">Marquee Advertising</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              A scrolling message at the top of every page. High visibility, fixed position.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
              {marqueeSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onBid={openBid} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Banner Ads ── */}
      {bannerSlots.length > 0 && (
        <div id="banner-bids" className="mb-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
              <LayoutTemplate className="w-3 h-3" /> Fixed Placements
            </span>
            <h2 className="text-2xl font-extrabold text-white mb-2">Banner Advertising</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Vertical and leaderboard banner positions on the homepage, community, and spots pages.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bannerSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onBid={openBid} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Advanced Formats (Badders) ── */}
      {advancedSlots.length > 0 && (
        <div id="advanced-bids" className="mb-14">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-3">
              <Layers className="w-3 h-3" /> High Impact
            </span>
            <h2 className="text-2xl font-extrabold text-white mb-2">Advanced Ad Formats</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-sm">
              Maximum visibility with sticky banners, inline content ads, modal popups, and full-screen interstitials.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advancedSlots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onBid={openBid} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bid Modal ── */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1f33] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-white font-bold">Place Bid — {selectedSlot.label}</h3>
                <p className="text-xs text-gray-400">
                  {selectedSlot.width_px}×{selectedSlot.height_px} • AED {selectedSlot.base_price_per_day}/day
                </p>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs text-gray-400 mb-1">Business name *</span>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                      required
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                      placeholder="Your business"
                    />
                  </div>
                </label>
                <label className="block">
                  <span className="block text-xs text-gray-400 mb-1">Email *</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="email"
                      value={form.business_email}
                      onChange={(e) => setForm((f) => ({ ...f, business_email: e.target.value }))}
                      required
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                      placeholder="you@company.com"
                    />
                  </div>
                </label>
              </div>

              {isMarquee ? (
                <label className="block">
                  <span className="block text-xs text-gray-400 mb-1">Marquee text *</span>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="text"
                      value={form.marquee_text}
                      onChange={(e) => setForm((f) => ({ ...f, marquee_text: e.target.value }))}
                      required
                      maxLength={120}
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                      placeholder="Your scrolling message (max 120 chars)"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">Max 120 characters. This text will scroll across the top of the page.</p>
                </label>
              ) : (
                <label className="block">
                  <span className="block text-xs text-gray-400 mb-1">{slotLabel} image URL *</span>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                    <input
                      type="url"
                      value={form.image_url}
                      onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                      required
                      className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                      placeholder="https://example.com/banner.jpg"
                    />
                  </div>
                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Must be exactly {selectedSlot.width_px}×{selectedSlot.height_px}px
                  </p>
                </label>
              )}

              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">Target URL *</span>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                  <input
                    type="url"
                    value={form.target_url}
                    onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))}
                    required
                    className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-amber-400"
                    placeholder="https://your-website.com"
                  />
                </div>
              </label>

              <label className="block">
                <span className="block text-xs text-gray-400 mb-1">Duration (days) *</span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={90}
                    value={form.duration_days}
                    onChange={(e) => setForm((f) => ({ ...f, duration_days: e.target.value }))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-white font-bold text-sm w-12 text-right">{form.duration_days}d</span>
                </div>
              </label>

              <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{selectedSlot.base_price_per_day} AED/day × {Math.max(1, Number(form.duration_days) || 7)} days</span>
                  <span className="text-white font-bold">AED {totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">
                  Payment is authorized now and only captured when your bid is approved.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" /> Pay AED {totalPrice.toFixed(2)} & Place Bid
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
