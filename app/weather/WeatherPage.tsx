'use client';

import { useState } from 'react';
import { Cloud, Wind, Waves, Sun, Moon, ShieldAlert } from 'lucide-react';
import { EMIRATES } from '@/lib/emirates';
import WeatherWidget from '@/components/WeatherWidget';

export default function WeatherPage() {
  const [selected, setSelected] = useState(EMIRATES[0]);

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-teal-400" />
            <h1 className="text-3xl font-extrabold text-white">Fishing Conditions</h1>
          </div>
          <p className="text-gray-400">
            Live weather and marine data for all 7 Emirates. Updated every 30 minutes.
          </p>
        </div>

        {/* Emirate selector */}
        <div className="flex flex-wrap gap-2 mb-8">
          {EMIRATES.map((em) => (
            <button
              key={em.slug}
              onClick={() => setSelected(em)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selected.slug === em.slug
                  ? 'bg-teal-500 border-teal-500 text-white'
                  : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
              }`}
            >
              {em.name}
            </button>
          ))}
        </div>

        {/* Selected emirate label */}
        <h2 className="text-lg font-semibold text-white mb-4">{selected.name}</h2>

        {/* Weather widget */}
        <WeatherWidget emirate={selected} />

        {/* Fishing tips based on conditions */}
        <div className="mt-6 p-5 rounded-xl bg-teal-500/5 border border-teal-500/20">
          <h3 className="font-semibold text-white mb-2">Best Fishing Windows Today</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Shore fishing in the UAE is generally best <strong className="text-white">2 hours before sunrise</strong> and
            during <strong className="text-white">the first 2 hours after sunset</strong>. Fish are
            more active in low-light conditions and cooler temperatures. Check the solunar feeding
            times and plan your session around them for the best results.
          </p>
        </div>

        {/* Educational content about UAE fishing weather */}
        <div className="mt-12 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Understanding UAE Fishing Weather</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              The UAE sits between the Persian Gulf and the Gulf of Oman, giving anglers two very different marine environments.
              The Gulf coast is shallow, warm and relatively sheltered, while the east coast along the Gulf of Oman is exposed to
              open-ocean swells and richer upwellings. Understanding these differences is the first step to planning a successful
              trip, whether you are casting from a Dubai beach or trolling offshore from Fujairah.
            </p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-white">Season Notes by Emirate</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400 leading-relaxed">
                <li><strong className="text-gray-300">Dubai & Abu Dhabi:</strong> Peak shore action runs October through April when temperatures drop and predatory species move closer to beaches.</li>
                <li><strong className="text-gray-300">Sharjah & Ajman:</strong> Creek mouths and lagoon entrances fish well on incoming tides year-round, with winter producing larger kingfish and queenfish.</li>
                <li><strong className="text-gray-300">Ras Al Khaimah:</strong> Artificial islands and historic fishing villages offer excellent night fishing; offshore charters peak in winter.</li>
                <li><strong className="text-gray-300">Fujairah:</strong> The east coast season is strongest October to March, when sailfish, tuna, dorado and reef species are most active.</li>
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Wind className="w-4 h-4 text-teal-400" />
                <h3 className="font-semibold text-white">Wind, Waves & Fishing Style</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400 leading-relaxed">
                <li><strong className="text-gray-300">Shore anglers:</strong> Light winds under 15 km/h and a small swell make casting and reading the water much easier. Offshore winds can flatten the surf and reduce bites.</li>
                <li><strong className="text-gray-300">Boat anglers:</strong> Wind against tide creates uncomfortable short chop. A long-period swell is fishable; a wind-driven chop can make anchoring and lure presentation difficult.</li>
                <li><strong className="text-gray-300">Current:</strong> Strong currents concentrate bait along drop-offs and reef edges. Use heavier sinkers or switch to drift fishing when the current picks up.</li>
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Moon className="w-4 h-4 text-indigo-400" />
                <h3 className="font-semibold text-white">Solunar & Tide Basics</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Fish feeding activity is strongly linked to moon phase and tide movement. Around the new and full moon,
                stronger spring tides push baitfish and predators closer to shore. Major solunar periods — roughly
                90-minute windows around moonrise and moonset — often produce the best bites. In the UAE, a rising tide
                typically brings cooler, more oxygenated water into creeks and lagoons, while the falling tide can
                concentrate prey at channel mouths. Keeping a simple tide chart and matching it with sunrise or sunset
                gives you a reliable edge on busy weekends.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h3 className="font-semibold text-white">Safety on the Water</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-400 leading-relaxed">
                <li>Check the official marine forecast before heading out and avoid fishing in thunderstorms or dust storms.</li>
                <li>Shore anglers should watch for sudden high tides and slippery rocks; never turn your back on the sea.</li>
                <li>Boat anglers must carry enough life jackets, a working VHF radio, plenty of water and sun protection.</li>
                <li>Summer temperatures can exceed 45 °C; fish early or late, stay hydrated and know the signs of heat exhaustion.</li>
              </ul>
            </div>
          </section>

          <section className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Waves className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-white">Quick Conditions Checklist</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Ideal UAE fishing conditions usually combine an air temperature below 30 °C, wind speeds under 15 km/h,
              wave heights under 1 metre and a rising or high tide. If the barometer is steady or rising after a low-pressure
              system, predator activity often improves for 24 to 48 hours. Use the live widget above to compare these factors
              across Emirates and pick the best window for your next session.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
