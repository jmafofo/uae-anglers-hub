'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Timer } from 'lucide-react';

type AdData = {
  bid_id: string;
  business_name: string;
  image_url: string;
  target_url: string;
  width_px: number;
  height_px: number;
} | null;

const INTERSTITIAL_KEY = 'ad_interstitial_shown';
const INTERSTITIAL_COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6 hours
const SKIP_DELAY_SECONDS = 5;

async function fetchInterstitialAd(): Promise<AdData> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const sb = createClient(url, key);
    const { data } = await sb
      .rpc('get_active_banner', { p_position: 'interstitial' })
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

export default function InterstitialAd() {
  const [ad, setAd] = useState<AdData>(null);
  const [open, setOpen] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [countdown, setCountdown] = useState(SKIP_DELAY_SECONDS);

  useEffect(() => {
    // Check cooldown
    const lastShown = localStorage.getItem(INTERSTITIAL_KEY);
    if (lastShown) {
      const elapsed = Date.now() - Number(lastShown);
      if (elapsed < INTERSTITIAL_COOLDOWN_MS) return;
    }

    fetchInterstitialAd().then((data) => {
      if (data) {
        setAd(data);
        // Show after short delay on first navigation
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem(INTERSTITIAL_KEY, String(Date.now()));
        }, 2500);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!open) return;
    if (countdown <= 0) {
      setCanSkip(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [open, countdown]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on Escape only after skip delay
  useEffect(() => {
    if (!open || !canSkip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, canSkip, handleClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = original; };
    }
  }, [open]);

  if (!ad || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Advertisement by ${ad.business_name}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-20">
        {canSkip ? (
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            aria-label="Skip ad"
          >
            <X className="w-3.5 h-3.5" /> Skip Ad
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs font-semibold">
            <Timer className="w-3.5 h-3.5" /> Skip in {countdown}s
          </div>
        )}
      </div>

      {/* Ad label */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-black/60 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
          Advertisement
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl px-4 animate-in fade-in zoom-in-95 duration-500">
        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block group rounded-2xl overflow-hidden border border-amber-500/20"
          onClick={handleClose}
        >
          <img
            src={ad.image_url}
            alt={`Advertisement by ${ad.business_name}`}
            className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            style={{ aspectRatio: `${ad.width_px} / ${ad.height_px}`, maxHeight: '70vh' }}
            loading="eager"
          />
        </a>
        <p className="text-center text-xs text-gray-500 mt-3">
          Sponsored by {ad.business_name}
        </p>
      </div>
    </div>
  );
}
