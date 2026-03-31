import type { Metadata } from 'next';
import { fishSpecies } from '@/lib/species';
import SpeciesSearchBar from './SearchBar';

export const metadata: Metadata = {
  title: 'UAE Fish Species Guide — MOCCAE 2023 Official List',
  description:
    'Comprehensive guide to fish species in UAE waters based on the MOCCAE 2023 official fish list. Scientific names, Arabic names, habitat, conservation status and edibility for Persian Gulf and Gulf of Oman species.',
};

export default function SpeciesPage() {
  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-400 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Citizen Science Database
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3">UAE Fish Species Guide</h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {fishSpecies.length}{' '}species documented with scientific names, habitats, and conservation status.
            Every catch you log contributes to UAE marine research.
          </p>
        </div>

        {/* Search + Filter + Grid (client component) */}
        <SpeciesSearchBar />
      </div>
    </div>
  );
}
