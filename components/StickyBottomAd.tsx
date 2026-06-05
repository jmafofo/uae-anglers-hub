'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const DISMISS_KEY = 'ad_sticky_bottom_dismissed';
const DISMISS_DURATION_MS = 1000 * 60 * 60 * 4; // 4 hours

type AdData = {
  bid_id: string;
  business_name: string;
  image_url: string;
  target_url: string;
  width_px: number;
  height_px: number;
} | null;

async function fetchStickyAd(): Promise<AdData> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const sb = createClient(url, key);
    const { data } = await sb
      .rpc('get_active_banner', { p_position: 'sticky_bottom' })
      .maybeSingle<{
        bid_id: string;
        business_name: string;
        image_url: string;
        target_url: string;
        width_px: number;
        height_px: number;
      }>();
    return data ?? null;
  } catch {
    return null;
  }
}

export default function StickyBottomAd() {
  const [ad, setAd] = useState<AdData>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if recently dismissed
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        setDismissed(true);
        return;
      }
    }

    fetchStickyAd().then((data) => {
      if (data) {
        setAd(data);
        // Small delay for better UX
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!ad || dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-500 ease-out ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      aria-label="Sponsored sticky banner"
    >
      <div className="relative max-w-4xl mx-auto px-4 pb-3">
        <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-[#0d1f33] shadow-2xl shadow-black/60">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-1.5 right-1.5 z-20 p-1 rounded-md bg-black/50 hover:bg-black/70 text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss ad"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Ad label */}
          <div className="absolute top-1.5 left-1.5 z-20">
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/50 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
              Ad
            </span>
          </div>

          <a
            href={ad.target_url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
          >
            <img
              src={ad.image_url}
              alt={`Advertisement by ${ad.business_name}`}
              className="w-full object-contain max-h-[90px]"
              loading="lazy"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
