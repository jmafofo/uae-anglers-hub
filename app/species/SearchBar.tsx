import Link from 'next/link';
import Image from 'next/image';
import { Search, Fish, ChevronDown, TriangleAlert } from 'lucide-react';
import { fishSpecies, habitatCategories, conservationStatuses } from '@/lib/species';
import { matchesSpecies } from '@/lib/discovery';
import speciesPhotos from '@/lib/species-images';

export type SpeciesFilters = { q?: string; habitat?: string; edibility?: string; status?: string };
export default function SpeciesSearchBar({ filters }: { filters: SpeciesFilters }) {
  const q = typeof filters.q === 'string' ? filters.q : '';
  const habitat = typeof filters.habitat === 'string' ? filters.habitat : '';
  const edibility = typeof filters.edibility === 'string' ? filters.edibility : '';
  const status = typeof filters.status === 'string' ? filters.status : '';
  const filtered = fishSpecies.filter(s => matchesSpecies(s, q) && (!habitat || s.habitatCategory === habitat) && (!edibility || s.edibility === edibility) && (!status || s.conservationStatus === status));
  const hasFilters = Boolean(q || habitat || edibility || status);
  return <div>
    <form action="/species" className="rounded-2xl border border-slate-200 bg-white p-6" key={JSON.stringify(filters)}>
      <label className="block"><span className="coastal-label mb-2">Find a species</span><span className="relative block"><Search size={19} className="absolute left-4 top-4 text-teal-800" /><input type="search" name="q" defaultValue={q} placeholder="Try Kingfish, Sheri, Kofer, صافي, or a scientific name" className="coastal-input pl-12" /></span></label>
      <div className="mt-4 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        {[
          { name: 'habitat', label: 'Habitat', value: habitat, options: habitatCategories },
          { name: 'edibility', label: 'Edibility', value: edibility, options: ['Excellent', 'Good', 'Fair', 'Avoid', 'Not Edible', 'Not verified'] },
          { name: 'status', label: 'Conservation status', value: status, options: conservationStatuses },
        ].map(field => <label key={field.name}><span className="coastal-label mb-2">{field.label}</span><span className="relative block"><select className="coastal-input appearance-none pr-9" name={field.name} defaultValue={field.value}><option value="">All</option>{field.options.map(option => <option key={option}>{option}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-3 top-4" /></span></label>)}
        <button className="coastal-button" type="submit">Search species</button>
      </div>
    </form>
    <div className="my-7 flex items-center justify-between gap-4"><p className="text-sm text-slate-600"><strong className="text-slate-900">{filtered.length}</strong> species{q ? ` matching “${q}”` : ' to discover'}</p>{hasFilters && <Link href="/species" className="coastal-text-link">Clear filters</Link>}</div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filtered.map(species => {
      const photo = (speciesPhotos as Record<string, string[]>)[species.slug]?.[0];
      return <Link key={species.slug} href={`/species/${species.slug}`} className="coastal-card group">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e7efee]">{photo ? <Image src={photo} alt={species.name} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full flex-col items-center justify-center gap-3 text-teal-800/60"><Fish size={60} strokeWidth={1} /><span className="text-sm">Photo coming soon</span></div>}<span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800">{species.habitatCategory}</span></div>
        <div className="flex flex-1 flex-col p-6"><p className="text-xs uppercase tracking-wider text-teal-800">{species.family}</p><h2 className="mt-2 text-xl font-semibold text-slate-900 group-hover:text-teal-800">{species.name}</h2><p className="mt-1 text-sm italic text-slate-500">{species.scientificName}</p><p className="mt-2 text-sm text-slate-500" dir="auto">{species.localName || 'Local name awaiting verification'}</p>{!!species.aliases?.length && <p className="mt-2 text-xs text-slate-500">Also known as: {species.aliases.slice(0, 4).join(' · ')}</p>}{species.dangerLevel !== 'none' && <p className="mt-4 flex items-center gap-2 text-sm font-medium capitalize text-amber-800"><TriangleAlert size={16} />{species.dangerLevel}</p>}<div className="mt-auto flex flex-wrap gap-2 pt-5"><span className={`rounded-full px-3 py-1 text-xs font-medium ${['Avoid', 'Not Edible', 'Not verified'].includes(species.edibility) ? 'bg-amber-50 text-amber-800' : 'bg-teal-50 text-teal-800'}`}>{species.edibility === 'Not Edible' ? 'Not edible' : `${species.edibility} · edibility`}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{species.conservationStatus}{species.conservationScope?.startsWith('UAE') ? ' · UAE' : species.conservationScope?.startsWith('Global') ? ' · global' : ''}</span></div></div>
      </Link>;
    })}</div>
    {!filtered.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center"><Fish size={32} className="mx-auto text-teal-800" /><h2 className="mt-4 text-xl font-semibold">No species match these filters.</h2><p className="mt-3 text-slate-600">Try another name or broaden your habitat and conservation filters.</p><Link href="/species" className="coastal-button mt-6">Explore all species</Link></div>}
  </div>;
}
