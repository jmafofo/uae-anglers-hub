'use client';

import { useEffect, useState, useCallback } from 'react';
import { X } from 'lucide-react';

type AdData = {
  bid_id: string;
  business_name: string;
  image_url: string;
  target_url: string;
  width_px: number;
  height_px: number;
} | null;

const MODAL_KEY = 'ad_modal_shown';
const MODAL_COOLDOWN_MS = 1000 * 60 * 60 * 24; // 24 hours

async function fetchModalAd(): Promise<AdData> {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const sb = createClient(url, key);
    const { data } = await sb
      .rpc('get_active_banner', { p_position: 'home_modal' })
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

export default function ModalAd() {
  const [ad, setAd] = useState<AdData>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check cooldown
    const lastShown = localStorage.getItem(MODAL_KEY);
    if (lastShown) {
      const elapsed = Date.now() - Number(lastShown);
      if (elapsed < MODAL_COOLDOWN_MS) return;
    }

    fetchModalAd().then((data) => {
      if (data) {
        setAd(data);
        // Delay for better UX — let page load first
        const timer = setTimeout(() => {
          setOpen(true);
          localStorage.setItem(MODAL_KEY, String(Date.now()));
        }, 3000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, handleClose]);

  // Prevent body scroll when open
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Advertisement by ${ad.business_name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal content */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl overflow-hidden border border-amber-500/30 bg-[#0d1f33] shadow-2xl shadow-black/80 animate-in fade-in zoom-in-95 duration-300">
        {/* Ad label + close */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-black/60 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
            Ad
          </span>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-gray-400 hover:text-white transition-colors"
            aria-label="Close ad"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <a
          href={ad.target_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block group"
          onClick={handleClose}
        >
          <img
            src={ad.image_url}
            alt={`Advertisement by ${ad.business_name}`}
            className="w-full object-cover group-hover:scale-[1.01] transition-transform duration-500"
            style={{ aspectRatio: `${ad.width_px} / ${ad.height_px}` }}
            loading="eager"
          />
        </a>
      </div>
    </div>
  );
}
