import { Suspense } from 'react';
import Link from 'next/link';
import { TrendingNews } from '@/components/TrendingNews';
import VisitorCounter from '@/components/VisitorCounter';
import FeaturedCatch from '@/components/FeaturedCatch';
import Image from 'next/image';
import { Compass, Fish, CloudSun, BookOpen, Users, Camera, ShieldCheck, Waves } from 'lucide-react';
import { fishingSpots, emirates } from '@/lib/spots';
import { fishSpecies } from '@/lib/species';
import speciesPhotos from '@/lib/species-images';
import { HeroSection } from './(home)/sections/HeroSection';
import SpotCard from '@/components/SpotCard';
import GoogleAd from '@/components/GoogleAd';

// Paid placements must be checked against current booking state on every request.
export const revalidate = 0;

export default function HomePage() {
  const featured = ['hameem-beach', 'al-zorah-nature-reserve', 'mina-breakwater'].flatMap(slug => fishingSpots.filter(s => s.slug === slug));
  const species = fishSpecies.filter(s => (speciesPhotos as Record<string, string[]>)[s.slug]?.[0]).slice(0, 4);
  const structuredData = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'UAE Anglers Hub', url: 'https://uaeangler.com', potentialAction: { '@type': 'SearchAction', target: 'https://uaeangler.com/species?q={search_term_string}', 'query-input': 'required name=search_term_string' } };
  return <div className="coastal-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <HeroSection spotCount={fishingSpots.length} speciesCount={fishSpecies.length} />
    <section className="border-y border-slate-200 bg-white">
      <div className="coastal-wrap grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/spots', icon: Compass, title: 'Find your next spot', detail: 'Explore the UAE coastline' },
          { href: '/weather', icon: CloudSun, title: 'Check the conditions', detail: 'Weather before you head out' },
          { href: '/species', icon: Fish, title: 'Know your catch', detail: 'Your local species field guide' },
          { href: '/log-catch', icon: Camera, title: 'Keep the memory', detail: 'Add a catch to your fishing log' },
        ].map(({ href, icon: Icon, title, detail }) => <Link key={href} href={href} className="flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-teal-50"><Icon size={25} strokeWidth={1.5} className="shrink-0 text-teal-800" /><div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{detail}</p></div></Link>)}
      </div>
    </section>
    <section className="coastal-wrap coastal-section">
      <div className="coastal-section-heading"><div><p className="coastal-eyebrow">A coastline worth exploring</p><h2>Where will the water take you?</h2><p>Quiet shores, city breakwaters, and a new favourite waiting to happen.</p></div><Link className="coastal-text-link" href="/spots">View all {fishingSpots.length} spots</Link></div>
      <div className="mb-8 flex flex-wrap gap-2">{emirates.map(em => <Link key={em} href={`/spots?emirate=${encodeURIComponent(em)}`} className="coastal-chip">{em}</Link>)}</div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map(spot => <SpotCard key={spot.id} spot={spot} />)}</div>
    </section>
    <Suspense fallback={null}><TrendingNews /></Suspense>
    <section className="bg-[#eaf2f1]">
      <div className="coastal-wrap coastal-section grid items-center gap-12 lg:grid-cols-2">
        <div><p className="coastal-eyebrow">Make every outing count</p><h2 className="coastal-heading mt-4">A little preparation.<br />A much better day.</h2><p className="mt-5 max-w-lg leading-relaxed text-slate-600">Whether it’s your first cast or your favourite weekend ritual, the right information makes all the difference.</p><Link className="coastal-button mt-7" href="/beginners-guide">Start with the essentials</Link></div>
        <div className="space-y-3">{[
          { icon: CloudSun, title: 'Check the weather', description: 'Look at the forecast before choosing when to head out.', href: '/weather' },
          { icon: ShieldCheck, title: 'Fish responsibly', description: 'Review local rules, permits, and conservation guidance.', href: '/regulations' },
          { icon: BookOpen, title: 'Build your confidence', description: 'Get familiar with tackle, techniques, and shore fishing.', href: '/beginners-guide' },
        ].map(({ icon: Icon, title, description, href }) => <Link key={href} href={href} className="flex gap-4 rounded-2xl border border-white bg-white/80 p-6 hover:bg-white"><Icon size={24} strokeWidth={1.5} className="shrink-0 text-teal-800" /><div><h3 className="font-semibold text-slate-900">{title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{description}</p></div></Link>)}</div>
      </div>
    </section>
    <section className="coastal-wrap coastal-section">
      <div className="coastal-section-heading"><div><p className="coastal-eyebrow">Below the surface</p><h2>Get to know UAE waters.</h2><p>Explore the species, habitats, and stories behind your next catch.</p></div><Link className="coastal-text-link" href="/species">Explore the species guide</Link></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{species.map(s => <Link key={s.slug} href={`/species/${s.slug}`} className="coastal-card group"><div className="relative aspect-[4/3] overflow-hidden bg-slate-100"><Image src={(speciesPhotos as Record<string, string[]>)[s.slug][0]} alt={s.name} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" /></div><div className="p-5"><p className="text-xs font-medium uppercase tracking-wider text-teal-800">{s.habitatCategory}</p><h3 className="mt-2 text-lg font-semibold text-slate-900">{s.name}</h3><p className="mt-1 text-sm italic text-slate-500">{s.scientificName}</p></div></Link>)}</div>
    </section>
    {process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT && <div className="coastal-wrap pb-12"><p className="mb-2 text-center text-xs text-slate-500">Advertisement</p><GoogleAd format="leaderboard" slot={process.env.NEXT_PUBLIC_GOOGLE_ADS_SLOT_HOME} /></div>}
    <section className="coastal-wrap pb-20"><div className="relative overflow-hidden rounded-[2rem] bg-[#112f3d] px-7 py-14 text-white sm:px-12 lg:px-16"><Waves className="pointer-events-none absolute -right-10 -top-10 h-80 w-80 text-white/5" strokeWidth={.5} /><div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]"><div><p className="text-sm font-medium uppercase tracking-[.15em] text-teal-200">Better together</p><h2 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">Good spots. Great stories.<br />Your fishing community.</h2><p className="mt-5 max-w-xl leading-relaxed text-slate-300">Share a catch, find a local club, or learn from anglers who know these waters.</p></div><div className="flex flex-col gap-5"><FeaturedCatch /><Link href="/signup" className="coastal-button light"><Users size={18} />Join the community</Link><Link href="/clubs" className="rounded-xl border border-white/25 px-6 py-3 text-center text-sm font-semibold hover:bg-white/10">Discover local clubs</Link></div></div></div></section>
    <div className="border-t border-slate-200 bg-white"><div className="coastal-wrap flex flex-wrap items-center justify-between gap-4 py-7 text-sm text-slate-500"><p>Explore thoughtfully. Leave the coastline better than you found it.</p><div className="flex gap-6"><Link href="/research" className="hover:text-teal-800">Marine research</Link><Link href="/conservation" className="hover:text-teal-800">Conservation</Link></div></div></div>
    <VisitorCounter />
  </div>;
}
