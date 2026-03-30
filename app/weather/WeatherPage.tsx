'use client';

import { useState } from 'react';
import { Cloud } from 'lucide-react';
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
      </div>
    </div>
  );
}
