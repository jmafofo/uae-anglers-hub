'use client';

import { useState } from 'react';
import { Check, Link2, Share2 } from 'lucide-react';

/**
 * Share buttons for the crowned angler — WhatsApp and X post text, plus
 * copy-link. The shared URL unfurls as the victory card (the page's
 * og:image is /api/og/victory).
 */
export default function ShareVictory({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const payload = `${text} ${url}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — no-op */ }
  }

  const btn =
    'inline-flex items-center gap-1.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/20';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
      <span className="inline-flex items-center gap-1 text-xs text-gray-500"><Share2 className="h-3.5 w-3.5" /> Share the crown</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(payload)}`} target="_blank" rel="noopener noreferrer" className={btn}>
        WhatsApp
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(payload)}`} target="_blank" rel="noopener noreferrer" className={btn}>
        Post on X
      </a>
      <button type="button" onClick={() => void copy()} className={btn}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </div>
  );
}
