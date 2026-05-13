import Link from 'next/link';
import {
  Anchor, FlaskConical, ChevronRight,
} from 'lucide-react';

interface PlatformFeaturesProps {
  spotCount: number;
  speciesCount: number;
}

export function PlatformFeatures({ spotCount, speciesCount }: PlatformFeaturesProps) {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-3">Two Worlds. One Platform.</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Every cast counts twice</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            You fish. The data lives on. Every catch logged is a permanent record
            of UAE coastal marine life — useful now, invaluable in ten years.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Angler card */}
          <div className="relative rounded-2xl overflow-hidden border border-teal-500/20 bg-gradient-to-br from-teal-950/60 to-[#070d1a] p-8">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-teal-500/5 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center mb-6">
              <Anchor className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">For Anglers</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Find the best spots on both UAE coastlines, get AI bait and timing
              advice, log your catches, join tournaments, and connect with the
              UAE fishing community.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                `${spotCount} GPS-verified fishing spots`,
                'Live weather, tides & fishing score',
                'AI fishing assistant & species ID',
                'Tournaments with live leaderboards',
                'Community forum & tackle shop',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/spots"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
              Explore Spots <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Science card */}
          <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-[#070d1a] p-8">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-blue-500/5 pointer-events-none" />
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mb-6">
              <FlaskConical className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">For Marine Science</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Each logged catch — species, weight, GPS location, depth, season —
              becomes a verified data point in the UAE&apos;s first community-driven
              coastal fish dataset, aligned with UAE marine conservation goals.
            </p>
            <ul className="space-y-2.5 mb-8">
              {[
                `${speciesCount} species aligned with MOCCAE 2023 official list`,
                'Persian Gulf & Gulf of Oman coverage',
                'Georeferenced catch data by emirate',
                'Conservation status & seasonal tracking',
                'Ocean Sentinel mobile species ID app',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/research"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors">
              Research Vision <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
