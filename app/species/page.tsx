import type { Metadata } from 'next';
import Link from 'next/link';
import { fishSpecies } from '@/lib/species';
import SpeciesSearchBar, { type SpeciesFilters } from './SearchBar';

export const metadata: Metadata = {
  title: 'UAE fish species guide',
  description: 'Explore fish species in UAE waters by common, Arabic, or scientific name. Discover habitats, conservation status, and species information.',
  alternates: { canonical: 'https://uaeangler.com/species' },
};
export default async function SpeciesPage({ searchParams }: { searchParams: Promise<SpeciesFilters> }) {
  const filters = await searchParams;
  return <div className="coastal-page min-h-screen pb-20"><header className="border-b border-slate-200 bg-[#edf4f3]"><div className="coastal-wrap py-14 sm:py-20"><p className="coastal-eyebrow">A field guide for curious anglers</p><h1 className="coastal-display mt-4">Know what’s below the surface.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Discover {fishSpecies.length} species found in UAE waters. Learn their names, understand their habitats, and get to know the marine life around you.</p><div className="mt-6 flex flex-wrap gap-6 text-sm"><Link href="/research" className="coastal-text-link">Explore our research</Link><Link href="/regulations" className="coastal-text-link">Check fishing regulations</Link></div></div></header><div className="coastal-wrap pt-10"><SpeciesSearchBar filters={filters} /></div></div>;
}
