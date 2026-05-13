import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';

interface SpotsShowcaseProps {
  featuredSpots: typeof fishingSpots;
  spotCount: number;
}

export function SpotsShowcase({ featuredSpots, spotCount }: SpotsShowcaseProps) {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Where to Fish</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Featured Spots</h2>
            <p className="text-gray-400 mt-2">{spotCount}{' '}verified locations · updated regularly</p>
          </div>
          <Link href="/spots"
            className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm whitespace-nowrap transition-colors">
            View all {spotCount} spots <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredSpots.map((spot) => (
            <Link key={spot.id} href={`/spots/${spot.slug}`}
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-teal-500/40 bg-white/5 hover:bg-white/8 transition-all p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-teal-400 font-medium bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
                  {spot.emirate}
                </span>
                <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full">
                  {spot.accessType}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-teal-400 transition-colors mb-2">
                {spot.name}
              </h3>
              <p className="text-gray-400 text-xs mb-4 line-clamp-1">
                {typeof spot.species === 'string'
                  ? (spot.species as string).split(',').slice(0, 4).join(', ')
                  : spot.species.slice(0, 4).join(', ')}
              </p>
              <div className="flex items-center gap-1 text-gray-500 text-xs">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="line-clamp-1">{spot.bestTime}</span>
              </div>
              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 pt-10 border-t border-white/10">
          <p className="text-gray-500 text-xs text-center mb-5 uppercase tracking-widest">All 7 Emirates</p>
          <div className="flex flex-wrap justify-center gap-2">
            {emirates.map((emirate) => {
              const count = fishingSpots.filter((s) => s.emirate === emirate).length;
              return (
                <Link key={emirate}
                  href={`/spots?emirate=${encodeURIComponent(emirate)}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal-500/40 hover:text-teal-400 text-sm text-gray-400 transition-colors">
                  {emirate}
                  <span className="text-xs text-gray-600">{count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
