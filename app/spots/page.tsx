import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, SlidersHorizontal, MapPin, ChevronDown, Plus } from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';
import { filterSpots } from '@/lib/discovery';
import SpotCard from '@/components/SpotCard';

export const metadata: Metadata = {
  title: 'Fishing spots across the UAE',
  description: 'Find your next fishing spot. Search by location or fish species, and filter by emirate and access type.',
  alternates: { canonical: 'https://uaeangler.com/spots' },
};

type Filters = { q?: string; emirate?: string; access?: string; sort?: string };
export default async function SpotsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const emirate = typeof params.emirate === 'string' ? params.emirate : '';
  const access = typeof params.access === 'string' ? params.access : '';
  const sort = params.sort === 'name' ? 'name' : '';
  const filtered = filterSpots(fishingSpots, { q, emirate, access });
  if (sort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));
  const hasFilters = Boolean(q || emirate || access || sort);
  return <div className="coastal-page min-h-screen pb-20">
    <header className="border-b border-slate-200 bg-[#edf4f3]"><div className="coastal-wrap py-14 sm:py-20"><p className="coastal-eyebrow">The UAE, one shoreline at a time</p><h1 className="coastal-display mt-4">Find your next favourite spot.</h1><p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">Explore {fishingSpots.length} locations across all seven emirates. Find the right setting, see what’s swimming, and plan your next outing.</p><div className="mt-6 flex flex-wrap gap-5 text-sm text-teal-800"><span className="flex items-center gap-2"><MapPin size={16} />GPS coordinates on every spot</span><Link href="/spots/suggest" className="flex items-center gap-2 underline underline-offset-4"><Plus size={16} />Suggest a location</Link></div></div></header>
    <div className="coastal-wrap pt-10">
      <form action="/spots" className="rounded-2xl border border-slate-200 bg-white p-6" key={JSON.stringify(params)}>
        <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-800"><SlidersHorizontal size={17} />Make it your kind of fishing</div>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
          <label><span className="coastal-label mb-2">Location or species</span><span className="relative block"><Search size={17} className="absolute left-3 top-4 text-slate-400" /><input name="q" type="search" defaultValue={q} placeholder="Try Dubai or queenfish" className="coastal-input pl-10" /></span></label>
          <label><span className="coastal-label mb-2">Emirate</span><span className="relative block"><select name="emirate" defaultValue={emirate} className="coastal-input appearance-none pr-8"><option value="">All emirates</option>{emirates.map(em => <option key={em}>{em}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-4" /></span></label>
          <label><span className="coastal-label mb-2">Access</span><span className="relative block"><select name="access" defaultValue={access} className="coastal-input appearance-none pr-8"><option value="">Any access</option>{['Shore', 'Boat', 'Kayak', 'Marina', 'Mangrove', 'Deep Sea', 'Freshwater'].map(a => <option key={a}>{a}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-4" /></span></label>
          <label><span className="coastal-label mb-2">Sort by</span><span className="relative block"><select name="sort" defaultValue={sort} className="coastal-input appearance-none pr-8"><option value="">Directory order</option><option value="name">Name: A–Z</option></select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-4" /></span></label>
          <button type="submit" className="coastal-button">Find spots</button>
        </div>
      </form>
      <div className="my-7 flex flex-wrap items-center justify-between gap-4"><p className="text-sm text-slate-600"><strong className="text-slate-900">{filtered.length}</strong> {filtered.length === 1 ? 'spot' : 'spots'}{emirate ? ` in ${emirate}` : ' to explore'}{q ? ` matching “${q}”` : ''}</p>{hasFilters && <Link href="/spots" className="coastal-text-link">Clear all filters</Link>}</div>
      {filtered.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(spot => <SpotCard key={spot.id} spot={spot} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center"><Search className="mx-auto mb-5 text-teal-800" size={30} /><h2 className="text-xl font-semibold text-slate-900">No spots match just yet.</h2><p className="mt-3 text-slate-600">Try another species, a nearby emirate, or a different access type.</p><Link href="/spots" className="coastal-button mt-6">Explore all spots</Link></div>}
      <p className="mt-10 border-t border-slate-200 pt-6 text-sm leading-relaxed text-slate-500">Access and local restrictions can change. <Link href="/regulations" className="underline underline-offset-4 text-teal-800">Check fishing regulations</Link> and confirm access before travelling.</p>
    </div>
  </div>;
}
