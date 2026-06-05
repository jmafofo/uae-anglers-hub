'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
  id?: string;
  media_url: string;
  media_type: string;
}

interface ImageCarouselProps {
  media: MediaItem[];
  className?: string;
  aspectRatio?: string;
}

export default function ImageCarousel({ media, className = '', aspectRatio = 'aspect-square' }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : media.length - 1)), [media.length]);
  const goNext = useCallback(() => setIndex((i) => (i < media.length - 1 ? i + 1 : 0)), [media.length]);

  if (media.length === 0) return null;

  return (
    <div className={`relative group ${className}`}>
      <div className={`relative overflow-hidden bg-black/20 ${aspectRatio}`}>
        {media.map((m, i) => (
          <div
            key={m.id ?? i}
            className={`absolute inset-0 transition-transform duration-300 ease-out ${
              i === index ? 'translate-x-0' : i < index ? '-translate-x-full' : 'translate-x-full'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.media_url}
              alt=""
              className="w-full h-full object-cover"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {media.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === index ? 'bg-white w-3' : 'bg-white/50'
                }`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
