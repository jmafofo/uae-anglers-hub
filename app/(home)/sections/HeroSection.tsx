import Link from 'next/link';
import { Suspense } from 'react';
import { SponsoredGear } from '@/components/SponsoredGear';
import SponsoredFilms from '@/components/SponsoredFilms';
import HeroBrandSpotlight from '@/components/HeroBrandSpotlight';
import FishSplashBackdrop from '@/components/FishSplashBackdrop';
import FishingBackdrop from '@/components/FishingBackdrop';
import { Search, ChevronDown } from 'lucide-react';
import { emirates } from '@/lib/spots';

export function HeroSection({ spotCount, speciesCount }: { spotCount: number; speciesCount: number }) {
  return <section className="coastal-hero">
    <div className="coastal-cinematic relative isolate overflow-hidden">
    <FishingBackdrop />
    <FishSplashBackdrop tone="light" intensity={1.3} />
    <div className="coastal-wrap coastal-hero-wide relative z-[1] grid items-center gap-10 py-10 pb-24 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.4fr)] lg:gap-14 lg:py-14 lg:pb-28">
      <div className="max-w-2xl">
        <p className="coastal-eyebrow">Your guide to UAE waters</p>
        <h1 className="coastal-display mt-5">A better day<br />starts <em>by the water.</em></h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">Find your next fishing spot, get to know your catch, and share the moments that make it worthwhile.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link className="coastal-button" href="/spots">Explore fishing spots</Link><Link className="coastal-button secondary" href="/community">Meet the community</Link></div>
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-slate-200 pt-6">
          {[[spotCount, 'fishing spots'], [speciesCount, 'species to discover'], [7, 'emirates']].map(([value, label]) => <div key={label}><strong className="block text-2xl font-medium tracking-tight text-slate-900">{value}</strong><span className="text-sm text-slate-500">{label}</span></div>)}
        </div>
        <div className="mt-8 max-w-md"><HeroBrandSpotlight /></div>
      </div>
      <div className="min-w-0"><Suspense fallback={<div className="aspect-video rounded-2xl bg-white/70" />}><SponsoredFilms /></Suspense></div>
    </div>
    </div>
    <Suspense fallback={null}><SponsoredGear /></Suspense>
    <div className="coastal-wrap py-8">
      <form action="/spots" className="coastal-search-panel">
        <label className="min-w-0 flex-1"><span className="coastal-label">What are you looking for?</span><span className="mt-2 flex items-center gap-3"><Search size={20} className="text-teal-800" /><input name="q" type="search" placeholder="Try a location or fish species" className="w-full bg-transparent py-2 text-base outline-none" /></span></label>
        <label className="relative min-w-0 lg:w-64"><span className="coastal-label">Choose your emirate</span><select name="emirate" className="mt-2 w-full appearance-none bg-transparent py-2 pr-8 text-base outline-none"><option value="">All seven emirates</option>{emirates.map(em => <option key={em}>{em}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute bottom-3 right-0" /></label>
        <button className="coastal-button shrink-0" type="submit">Find my spot</button>
      </form>
    </div>
  </section>;
}
