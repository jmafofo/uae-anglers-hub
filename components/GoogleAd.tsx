'use client';

import { useEffect, useRef } from 'react';

interface GoogleAdProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'leaderboard' | 'fluid';
  layout?: string;
  className?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
}

const AD_CLIENT = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT;

/**
 * Google AdSense ad unit.
 *
 * Renders nothing if NEXT_PUBLIC_GOOGLE_ADS_CLIENT is not configured.
 * Uses a fixed-size container to prevent layout shift.
 *
 * NOTE: Google AdSense requires site approval before ads will fill.
 * Blank containers during review are expected.
 */
export default function GoogleAd({
  slot,
  format = 'auto',
  layout,
  className = '',
  style,
  responsive = true,
}: GoogleAdProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!AD_CLIENT || pushed.current) return;
    if (!ref.current) return;

    const win = window as any;

    // If adsbygoogle is already loaded, push immediately
    if (win.adsbygoogle) {
      try {
        win.adsbygoogle.push({});
        pushed.current = true;
        return;
      } catch {
        // AdSense blocked or error
      }
    }

    // Otherwise poll for the script to load (max 10s)
    let attempts = 0;
    const maxAttempts = 50; // 50 × 200ms = 10s
    const timer = setInterval(() => {
      attempts++;
      if (pushed.current) {
        clearInterval(timer);
        return;
      }
      if (win.adsbygoogle) {
        try {
          win.adsbygoogle.push({});
          pushed.current = true;
          clearInterval(timer);
        } catch {
          clearInterval(timer);
        }
      }
      if (attempts >= maxAttempts) {
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, []);

  if (!AD_CLIENT) return null;

  const adStyle: React.CSSProperties = {
    display: 'block',
    minHeight: format === 'leaderboard' ? 90 : format === 'rectangle' ? 250 : 100,
    ...style,
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] ${className}`}>
      <ins
        ref={ref}
        className={`adsbygoogle ${responsive ? 'w-full' : ''}`}
        style={adStyle}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        {...(layout ? { 'data-ad-layout': layout } : {})}
      />
    </div>
  );
}
