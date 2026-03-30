import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Fish, Clock, ChevronRight } from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';

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
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-3">UAE Fishing Spots</h1>
          <p className="text-gray-400 text-lg">
            {fishingSpots.length} verified locations across all 7 Emirates — GPS-tagged, species-listed, community-rated.
          </p>
        </div>

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
              className="group flex flex-col p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 hover:bg-white/8 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                    {spot.name}
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">{spot.emirate}</p>
                </div>
                <span className="ml-2 shrink-0 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
                  {spot.accessType}
                </span>
              </div>

              {/* Species */}
              <div className="flex items-start gap-1.5 mb-3">
                <Fish className="w-3.5 h-3.5 text-gray-500 mt-0.5 shrink-0" />
                <p className="text-gray-400 text-xs leading-relaxed">
                  {spot.species.slice(0, 4).join(', ')}
                  {spot.species.length > 4 && (
                    <span className="text-gray-600"> +{spot.species.length - 4} more</span>
                  )}
                </p>
              </div>

              {/* Best time */}
              <div className="flex items-center gap-1.5 mb-3">
                <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <p className="text-gray-500 text-xs truncate">{spot.bestTime}</p>
              </div>

              {/* Access */}
              <div className="flex items-center gap-1.5 mt-auto pt-3 border-t border-white/5">
                <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <p className="text-gray-500 text-xs truncate">{spot.access}</p>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 ml-auto shrink-0 group-hover:text-teal-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
