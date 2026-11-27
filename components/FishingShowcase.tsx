'use client';

import { useEffect, useState } from 'react';
import type { FilmBrand } from '@/lib/home-advertising';
import { emitShowcase } from '@/lib/showcase-sync';
import { ExternalLink, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

// Curated source videos. Keep attribution attached to each original upload.
const clips = [
  { id: 'W4-Vie4zJ9g', creator: 'Mallu Anglers AUH', title: 'GT fishing in Abu Dhabi', source: 'https://www.youtube.com/watch?v=W4-Vie4zJ9g' },
  { id: 'cvph20t40zc', creator: 'Almheiri', title: 'A day offshore in Fujairah', source: 'https://www.youtube.com/watch?v=cvph20t40zc' },
  { id: 'DxmekXHELUI', creator: "The Angler’s Tales", title: 'Exploring Abu Dhabi’s fishing spots', source: 'https://www.youtube.com/watch?v=DxmekXHELUI' },
  { id: 'q0hxf5yMiA0', creator: 'Ashfaq Fishing', title: 'Kingfish fishing at Ajman Corniche', source: 'https://www.youtube.com/watch?v=q0hxf5yMiA0' },
];

export default function FishingShowcase({ brands = [] }: { brands?: FilmBrand[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rotating, setRotating] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { setRotating(!preference.matches); setPlaying(!preference.matches); };
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(i => (i + 1) % clips.length);
    }, 45000);
    return () => window.clearInterval(timer);
  }, [rotating]);
  const clip = clips[index];
  // Announce the playing clip (and its paid brands) so the hero spotlight
  // and the merchandise ticker can sync to it.
  useEffect(() => {
    emitShowcase({ clipId: clip.id, clipTitle: clip.title, clipCreator: clip.creator, brands: brands.filter(brand => brand.videoId === clip.id) });
  }, [clip, brands]);
  return <section aria-label="UAE fishing films" className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl">
    <div className="flex items-center justify-between px-5 py-4"><p className="text-xs font-semibold uppercase tracking-widest text-teal-800">Life on the water</p><span className="text-xs text-slate-500">{index + 1} / {clips.length}</span></div>
    {/* Brand association lives in the hero's left column (HeroBrandSpotlight),
        synced via lib/showcase-sync — keeping the film panel clean. */}
    <div className="aspect-video bg-slate-950">
      {playing ? <iframe key={clip.id} src={`https://www.youtube-nocookie.com/embed/${clip.id}?autoplay=1&mute=1&playsinline=1&rel=0`} title={`${clip.title} — ${clip.creator}`} className="h-full w-full border-0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : <button onClick={() => { setPlaying(true); setRotating(true); }} className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-teal-50 to-slate-100 p-6 hover:from-teal-100" aria-label={`Watch ${clip.title} by ${clip.creator}`}><span className="rounded-full border border-teal-700/30 bg-teal-100 p-5"><Play size={26} /></span><span className="text-lg font-medium">{clip.title}</span><span className="text-xs text-slate-500">Play muted films from YouTube</span></button>}
    </div>
    <div className="flex items-center gap-3 p-5"><div className="min-w-0 flex-1"><p className="font-semibold">{clip.creator}</p><a href={clip.source} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-teal-800">Watch original <ExternalLink size={12} /></a></div><button onClick={() => { setRotating(value => !value); setPlaying(value => !value); }} className="rounded-full border border-slate-200 p-2 hover:bg-teal-50" aria-label={rotating ? 'Pause fishing showcase' : 'Play fishing showcase'}>{rotating ? <Pause size={18} /> : <Play size={18} />}</button>{clips.length > 1 && <><button onClick={() => setIndex(i => (i - 1 + clips.length) % clips.length)} className="rounded-full border border-slate-200 p-2 hover:bg-teal-50" aria-label="Previous fishing film"><ChevronLeft size={18} /></button><button onClick={() => setIndex(i => (i + 1) % clips.length)} className="rounded-full border border-slate-200 p-2 hover:bg-teal-50" aria-label="Next fishing film"><ChevronRight size={18} /></button></>}</div>
  </section>;
}
