'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import StripeCTA from './StripeCTA';

export default function SlotPurchase() {
  const [qty, setQty] = useState(5);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      {/* Quantity picker */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-12 text-center text-white font-semibold text-sm">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(50, q + 1))}
          className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-gray-500 ml-1">
          slot{qty !== 1 ? 's' : ''} · <span className="text-amber-400 font-semibold">AED {qty * 5}</span>
        </span>
      </div>

      <StripeCTA
        type="slots"
        qty={qty}
        className="shrink-0 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-amber-700 text-white px-4 py-2.5 rounded-lg transition-colors"
        loadingText="Redirecting…"
      >
        Buy {qty} Slot{qty !== 1 ? 's' : ''}
      </StripeCTA>
    </div>
  );
}
