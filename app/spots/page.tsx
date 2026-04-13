import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Fish, Clock, ChevronRight, Anchor } from 'lucide-react';
import { fishingSpots, emirates, getSpotImage } from '@/lib/spots';

export const metadata: Metadata = {
  title: 'UAE Fishing Spots — 41 Verified Locations Across All 7 Emirates',
  description:
    'Browse 41 verified GPS-tagged fishing spots across Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah and Fujairah. Filter by emirate, species, and access type.',
};

interface PageProps {
  searchParams: Promise<{ emirate?: string }>;
}

export default async function SpotsPage({ searchParams }: PageProps) {
  const { emirate: selectedEmirate } = await searchParams;

  const filtered = selectedEmirate
    ? fishingSpots.filter((s) => s.emirate === selectedEmirate)
    : fishingSpots;

  return (
    <div className="min-h-screen pb-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[420px] sm:h-[500px] w-full overflow-hidden">
        {/* Background photo */}
        <Image
          src="/spot-photos/hameem-beach.jpg"
          alt="Hameem Beach at sunset — UAE fishing"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        {/* Dark overlay — heavier at bottom so text pops */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/60 to-[#0a0f1a]/20" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-10 max-w-6xl mx-auto w-full left-0 right-0">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-teal-500/20 border border-teal-500/40 text-teal-400 text-xs font-medium px-3 py-1 rounded-full backdrop-blur-sm">
              <Anchor className="w-3.5 h-3.5" />
              UAE Fishing Spots
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3 leading-tight drop-shadow-lg">
            Find Your Next
            <br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg, #00d4aa, #8ab4d4)' }}>
              Perfect Spot
            </span>
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-xl leading-relaxed drop-shadow">
            {fishingSpots.length} verified locations across all 7 Emirates — GPS-tagged, species-listed, community-rated.
          </p>

          {/* Quick stats */}
          <div className="flex gap-5 mt-5 flex-wrap">
            {[
              { value: fishingSpots.length,                                        label: 'Spots' },
              { value: fishingSpots.filter(s => s.accessType === 'Free').length,   label: 'Free Access' },
              { value: [...new Set(fishingSpots.flatMap(s => s.species))].length,  label: 'Species' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-extrabold text-teal-400">{value}</p>
                <p className="text-gray-400 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters + grid ───────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-10">

        {/* Emirate filter */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/spots"
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              !selectedEmirate
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
            }`}
          >
            All ({fishingSpots.length})
          </Link>
          {emirates.map((em) => {
            const count = fishingSpots.filter((s) => s.emirate === em).length;
            return (
              <Link
                key={em}
                href={`/spots?emirate=${encodeURIComponent(em)}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selectedEmirate === em
                    ? 'bg-teal-500 border-teal-500 text-white'
                    : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
                }`}
              >
                {em} ({count})
              </Link>
            );
          })}
        </div>

        {/* Results count */}
        <p className="text-gray-500 text-sm mb-6">
          Showing {filtered.length} spot{filtered.length !== 1 ? 's' : ''}
          {selectedEmirate ? ` in ${selectedEmirate}` : ''}
        </p>

        {/* Spots grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((spot) => (
            <Link
              key={spot.id}
              href={`/spots/${spot.slug}`}
              className="group flex flex-col rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative w-full h-44 overflow-hidden">
                <Image
                  src={getSpotImage(spot.slug, spot.accessType)}
                  alt={spot.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs bg-black/50 text-teal-400 border border-teal-500/30 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {spot.accessType}
                </span>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <div className="mb-2">
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                    {spot.name}
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{spot.emirate}
                  </p>
                </div>

                <div className="flex items-start gap-1.5 mb-2">
                  <Fish className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-gray-400 text-xs leading-relaxed">
                    {spot.species.slice(0, 3).join(', ')}
                    {spot.species.length > 3 && <span className="text-gray-600"> +{spot.species.length - 3} more</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-white/5">
                  <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  <p className="text-gray-500 text-xs truncate flex-1">{spot.bestTime}</p>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-600 shrink-0 group-hover:text-teal-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>{/* end spots grid */}
      </div>{/* end max-w-6xl */}
    </div>
  );
}
