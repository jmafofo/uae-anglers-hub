'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import {
  fishSpecies,
  habitatCategories,
  conservationStatuses,
  type FishSpecies,
  type HabitatCategory,
  type Edibility,
  type ConservationStatus,
} from '@/lib/species';

const edibilityOptions: Edibility[] = ['Excellent', 'Good', 'Fair', 'Avoid', 'Not Edible'];

function edibilityColor(ed: Edibility): string {
  switch (ed) {
    case 'Excellent': return 'bg-teal-500/20 text-teal-400 border-teal-500/30';
    case 'Good': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Avoid': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

function conservationColor(status: ConservationStatus): string {
  switch (status) {
    case 'Least Concern': return 'bg-green-500/10 text-green-400';
    case 'Near Threatened': return 'bg-yellow-500/10 text-yellow-400';
    case 'Vulnerable': return 'bg-orange-500/10 text-orange-400';
    case 'Endangered': return 'bg-red-500/10 text-red-400';
    case 'Critically Endangered': return 'bg-red-600/20 text-red-300';
    default: return 'bg-gray-500/10 text-gray-400';
  }
}

function habitatGradient(category: FishSpecies['habitatCategory']): string {
  switch (category) {
    case 'Reef': return 'from-cyan-900/80 to-teal-900/80';
    case 'Open Ocean': return 'from-blue-900/80 to-indigo-900/80';
    case 'Pelagic': return 'from-sky-900/80 to-blue-900/80';
    case 'Coastal': return 'from-teal-900/80 to-green-900/80';
    case 'Demersal': return 'from-stone-900/80 to-slate-800/80';
    case 'Freshwater': return 'from-emerald-900/80 to-green-900/80';
    default: return 'from-gray-800/80 to-gray-900/80';
  }
}

function dangerIcon(level: FishSpecies['dangerLevel']): string {
  switch (level) {
    case 'venomous': return '⚠️ Venomous';
    case 'potentially dangerous': return '⚡ Caution';
    case 'toxic': return '☠️ Toxic';
    case 'dangerous': return '🔴 Dangerous';
    default: return '';
  }
}

export default function SpeciesSearchBar() {
  const [query, setQuery] = useState('');
  const [habitatFilter, setHabitatFilter] = useState<HabitatCategory | ''>('');
  const [edibilityFilter, setEdibilityFilter] = useState<Edibility | ''>('');
  const [conservationFilter, setConservationFilter] = useState<ConservationStatus | ''>('');

  const filtered = useMemo(() => {
    return fishSpecies.filter((s) => {
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.scientificName.toLowerCase().includes(q) ||
        s.habitat.toLowerCase().includes(q) ||
        s.family.toLowerCase().includes(q);
      const matchHabitat = !habitatFilter || s.habitatCategory === habitatFilter;
      const matchEdibility = !edibilityFilter || s.edibility === edibilityFilter;
      const matchConservation = !conservationFilter || s.conservationStatus === conservationFilter;
      return matchQuery && matchHabitat && matchEdibility && matchConservation;
    });
  }, [query, habitatFilter, edibilityFilter, conservationFilter]);

  function clearFilters() {
    setQuery('');
    setHabitatFilter('');
    setEdibilityFilter('');
    setConservationFilter('');
  }

  const hasFilters = query || habitatFilter || edibilityFilter || conservationFilter;

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, scientific name, family, or habitat..."
          className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
        />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <Filter className="w-3.5 h-3.5" />
          <span>Habitat:</span>
        </div>
        {habitatCategories.map((h) => (
          <button
            key={h}
            onClick={() => setHabitatFilter(habitatFilter === h ? '' : h)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              habitatFilter === h
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <span>Edibility:</span>
        </div>
        {edibilityOptions.map((e) => (
          <button
            key={e}
            onClick={() => setEdibilityFilter(edibilityFilter === e ? '' : e)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              edibilityFilter === e
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-1 text-gray-500 text-xs">
          <span>Status:</span>
        </div>
        {conservationStatuses.map((c) => (
          <button
            key={c}
            onClick={() => setConservationFilter(conservationFilter === c ? '' : c)}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${
              conservationFilter === c
                ? 'bg-teal-500 border-teal-500 text-white'
                : 'border-white/20 text-gray-400 hover:border-teal-500/40 hover:text-white'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm">
          {filtered.length} species found
        </p>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Species grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((species) => (
          <Link
            key={species.slug}
            href={`/species/${species.slug}`}
            className="group flex flex-col rounded-xl border border-white/10 hover:border-teal-500/40 transition-all overflow-hidden bg-white/5"
          >
            {/* Gradient thumbnail */}
            <div className={`relative h-36 bg-gradient-to-br ${habitatGradient(species.habitatCategory)} flex items-center justify-center`}>
              <div className="text-4xl opacity-60">
                {species.habitatCategory === 'Reef' ? '🐠' :
                 species.habitatCategory === 'Open Ocean' ? '🐟' :
                 species.habitatCategory === 'Pelagic' ? '🎣' :
                 species.habitatCategory === 'Coastal' ? '🌊' :
                 species.habitatCategory === 'Demersal' ? '🪸' :
                 species.habitatCategory === 'Freshwater' ? '🏞️' : '🐡'}
              </div>
              {species.dangerLevel !== 'none' && (
                <span className="absolute top-2 right-2 text-xs bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  {dangerIcon(species.dangerLevel)}
                </span>
              )}
              <span className="absolute bottom-2 left-2 text-xs bg-black/50 backdrop-blur-sm text-gray-300 px-2 py-0.5 rounded-full">
                {species.habitatCategory}
              </span>
            </div>

            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                {species.name}
              </h3>
              <p className="text-gray-400 text-xs italic mb-2">{species.scientificName}</p>
              <p className="text-gray-500 text-xs mb-3">{species.family}</p>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                <span className={`text-xs border px-2 py-0.5 rounded-full ${edibilityColor(species.edibility)}`}>
                  {species.edibility}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${conservationColor(species.conservationStatus)}`}>
                  {species.conservationStatus}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500">No species match your filters.</p>
          <button onClick={clearFilters} className="text-teal-400 hover:text-teal-300 text-sm mt-2">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
