'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { LocateFixed, MapPin, X } from 'lucide-react';
import { fishingSpots, emirates, getSpotImage, type FishingSpot } from '@/lib/spots';

const LeafletSpotsMap = dynamic(() => import('@/components/map/LeafletSpotsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#e7edef]">
      <div className="flex items-center gap-2 text-sm font-medium text-[#5b6b77]">
        <MapPin size={16} className="animate-bounce text-[#23675e]" />
        Loading the map…
      </div>
    </div>
  ),
});

const accessTypes = Array.from(new Set(fishingSpots.map((s) => s.accessType))).sort();

function chipClass(active: boolean) {
  return [
    'inline-flex items-center justify-center rounded-full border px-3.5 py-2 text-sm transition-colors cursor-pointer',
    active
      ? 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52] font-semibold'
      : 'border-[#dce4e8] bg-white text-[#4a5d68] hover:border-[#a8c9c2]',
  ].join(' ');
}

export default function SpotsMapClient() {
  const [emirate, setEmirate] = useState<string>('all');
  const [accessType, setAccessType] = useState<string>('all');
  const [speciesQuery, setSpeciesQuery] = useState('');
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<FishingSpot | null>(null);
  const [locating, setLocating] = useState(false);

  const filtered = useMemo(() => {
    const q = speciesQuery.trim().toLowerCase();
    return fishingSpots.filter((s) => {
      if (emirate !== 'all' && s.emirate !== emirate) return false;
      if (accessType !== 'all' && s.accessType !== accessType) return false;
      if (q && !s.species.some((sp) => sp.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [emirate, accessType, speciesQuery]);

  function locateMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const hasFilters = emirate !== 'all' || accessType !== 'all' || speciesQuery.trim() !== '';

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#f7f9fa]">
      {/* Filter bar */}
      <div className="z-[500] border-b border-[#e1e7eb] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <h1 className="mr-2 hidden font-serif text-xl tracking-[-0.02em] text-[#18333f] md:block">
            Spots Map
          </h1>
          <select
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
            aria-label="Filter by emirate"
            className="min-h-10 rounded-lg border border-[#d4dfe4] bg-white px-3 text-sm text-[#18333f]"
          >
            <option value="all">All Emirates</option>
            {emirates.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={accessType}
            onChange={(e) => setAccessType(e.target.value)}
            aria-label="Filter by access type"
            className="min-h-10 rounded-lg border border-[#d4dfe4] bg-white px-3 text-sm text-[#18333f]"
          >
            <option value="all">All access types</option>
            {accessTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="search"
            value={speciesQuery}
            onChange={(e) => setSpeciesQuery(e.target.value)}
            placeholder="Species — e.g. Kingfish"
            aria-label="Filter by species"
            className="min-h-10 min-w-40 flex-1 rounded-lg border border-[#d4dfe4] bg-white px-3 text-sm text-[#18333f] placeholder:text-[#7a8891] sm:flex-none sm:w-52"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setEmirate('all'); setAccessType('all'); setSpeciesQuery(''); }}
              className={chipClass(false)}
            >
              <X size={14} className="mr-1" /> Reset
            </button>
          )}
          <div className="ms-auto flex items-center gap-3">
            <span className="text-sm font-medium text-[#5b6b77]">
              {filtered.length} spot{filtered.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={locateMe}
              disabled={locating}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#23675e] bg-[#23675e] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#174e47] disabled:opacity-60"
            >
              <LocateFixed size={15} className={locating ? 'animate-spin' : ''} />
              Near me
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative min-h-0 flex-1">
        <LeafletSpotsMap spots={filtered} userPos={userPos} onSelect={setSelected} />

        {/* Selected spot — bottom sheet on mobile, floating card on desktop */}
        {selected && (
          <div className="absolute inset-x-3 bottom-3 z-[600] rounded-2xl border border-[#e1e7eb] bg-white p-4 shadow-[0_16px_40px_#173b4a1f] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close spot preview"
              className="absolute right-3 top-3 rounded-full p-1.5 text-[#5b6b77] hover:bg-[#f0f4f5]"
            >
              <X size={16} />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- mixed local/remote sources */}
            <img
              src={getSpotImage(selected.slug, selected.accessType)}
              alt={selected.name}
              className="mb-3 h-36 w-full rounded-xl object-cover"
              loading="lazy"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#27685f]">
              {selected.emirate} · {selected.accessType}
            </p>
            <h2 className="mt-1 font-serif text-2xl tracking-[-0.02em] text-[#18333f]">
              {selected.name}
            </h2>
            <p className="mt-1.5 line-clamp-2 text-sm text-[#5b6b77]">
              {selected.species.slice(0, 5).join(', ')}
            </p>
            <div className="mt-3.5 flex gap-2">
              <a
                href={`/spots/${selected.slug}`}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-[#23675e] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#174e47]"
              >
                View spot
              </a>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-[#cbd5dc] px-4 text-sm font-semibold text-[#18333f] transition-colors hover:bg-[#eaf1f2]"
              >
                Directions
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
