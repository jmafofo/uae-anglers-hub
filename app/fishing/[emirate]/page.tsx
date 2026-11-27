import Link from 'next/link';
import { notFound } from 'next/navigation';
import SpotCard from '@/components/SpotCard';
import { emirates, fishingSpots } from '@/lib/spots';
import { publicMetadata, breadcrumbs, jsonLd } from '@/lib/seo';

const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-');
type Props = { params: Promise<{ emirate: string }> };
export function generateStaticParams() { return emirates.map(name => ({ emirate: slug(name) })); }
export async function generateMetadata({ params }: Props) {
  const { emirate } = await params;
  const name = emirates.find(name => slug(name) === emirate);
  return name ? publicMetadata(`/fishing/${emirate}`, `Fishing in ${name}: Spots & Trip Planning`, `Explore fishing locations in ${name}, with access information, local species and links to weather, regulations and charter listings.`) : { robots: { index: false } };
}
export default async function EmirateFishingPage({ params }: Props) {
  const { emirate } = await params;
  const name = emirates.find(name => slug(name) === emirate);
  if (!name) notFound();
  const spots = fishingSpots.filter(spot => spot.emirate === name);
  const species = [...new Set(spots.flatMap(spot => spot.species))];
  return <div className="coastal-page min-h-screen pb-16 pt-24">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs([{ name: 'UAEAngler', path: '/' }, { name: 'Fishing spots', path: '/spots' }, { name: `Fishing in ${name}`, path: `/fishing/${emirate}` }])) }} />
    <div className="coastal-wrap">
      <Link href="/spots" className="text-teal-800 underline">All UAE fishing spots</Link>
      <h1 className="mt-6 font-serif text-4xl text-slate-900 sm:text-5xl">Fishing in {name}</h1>
      <p className="mt-5 max-w-3xl text-lg text-slate-600">Explore {spots.length} locations in our {name} fishing guide. Each spot includes access details, coordinates and species reported in the area. Check current permissions and conditions before travelling.</p>
      <nav aria-label="Plan your fishing trip" className="my-8 flex flex-wrap gap-5 text-teal-800 underline">
        <Link href="/regulations">Fishing rules and permits</Link><Link href="/weather">Weather and tides</Link><Link href="/charters">Fishing charter directory</Link><Link href="/shop">Tackle and pre-owned gear</Link>
      </nav>
      <h2 className="mb-6 text-2xl font-semibold text-slate-900">Where to fish in {name}</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{spots.map(spot => <SpotCard key={spot.id} spot={spot} />)}</div>
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-7">
        <h2 className="text-2xl font-semibold text-slate-900">Species in the local spot guide</h2>
        <p className="mt-4 text-slate-600">{species.join(', ')}. Sightings and catches vary with season and conditions.</p>
        <Link href="/species" className="mt-4 inline-block text-teal-800 underline">Identify fish with photographs and local names</Link>
      </section>
      <nav aria-label="Other emirates" className="mt-8 flex flex-wrap gap-4">{emirates.filter(other => other !== name).map(other => <Link key={other} href={`/fishing/${slug(other)}`} className="text-teal-800 underline">Fishing in {other}</Link>)}</nav>
    </div>
  </div>;
}
