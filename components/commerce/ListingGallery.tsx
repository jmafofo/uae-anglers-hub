'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

/**
 * Amazon-style product gallery: large main image (original aspect, on
 * white) with a thumbnail rail and keyboard-accessible controls.
 */
export default function ListingGallery({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-[#e1e7eb] bg-white">
        <Package size={64} className="text-[#dce4e8]" />
      </div>
    );
  }

  return (
    <div>
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl border border-[#e1e7eb] bg-white p-6"
        role="group"
        aria-label={`Photo ${index + 1} of ${photos.length}`
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- seller uploads, keep aspect */}
        <img
          key={photos[index]}
          src={photos[index]}
          alt={`${title} — photo ${index + 1}`}
          className="max-h-full max-w-full object-contain [animation:gallery-in_.3s_ease-out]"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + photos.length) % photos.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[#e1e7eb] bg-white/90 p-2 text-[#4a5d68] shadow-sm transition-colors hover:bg-white"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % photos.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[#e1e7eb] bg-white/90 p-2 text-[#4a5d68] shadow-sm transition-colors hover:bg-white"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Product photos">
          {photos.map((url, i) => (
            <button
              key={url + i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-white p-1.5 transition-colors ${
                i === index ? 'border-[#23675e]' : 'border-[#e1e7eb] hover:border-[#a8c9c2]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="max-h-full max-w-full object-contain" />
            </button>
          ))}
        </div>
      )}
      <style>{`@keyframes gallery-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  );
}
