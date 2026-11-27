'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

const scenes = [
  { src: '/spot-photos/hameem-beach.jpg', title: 'Hameem Beach, Abu Dhabi' },
  { src: '/spot-photos/mina-breakwater.jpg', title: 'Mina Breakwater, Abu Dhabi' },
  { src: '/spot-photos/al-zorah-nature-reserve.jpg', title: 'Al Zorah, Ajman' },
];

export default function FishingBackdrop() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (paused || reduced) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % scenes.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [paused, reduced]);
  const advance = (direction: number) => { setPaused(true); setIndex(current => (current + direction + scenes.length) % scenes.length); };
  return <>
    <div className="absolute inset-0 overflow-hidden bg-slate-100" aria-hidden="true">
      {scenes.map((scene, i) => <Image key={scene.src} src={scene.src} alt="" fill priority={i === 0} sizes="100vw" className={`object-cover transition-opacity duration-[1800ms] motion-reduce:transition-none ${index === i ? 'opacity-100' : 'opacity-0'}`} />)}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-white/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#f5faf9]/80 via-transparent to-transparent" />
    </div>
    <div className="absolute bottom-5 right-5 z-10 flex max-w-[calc(100%-2.5rem)] items-center gap-2 rounded-full border border-white/70 bg-white/90 p-2 text-slate-700 backdrop-blur-md sm:bottom-8 sm:right-8">
      <span className="px-2 text-xs sm:text-sm">{scenes[index].title}</span>
      <button type="button" onClick={() => advance(-1)} aria-label="Previous coastal scene" className="rounded-full p-2 hover:bg-teal-50"><ChevronLeft size={16} /></button>
      {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'Resume slideshow' : 'Pause slideshow'} className="rounded-full p-2 hover:bg-teal-50">{paused ? <Play size={16} /> : <Pause size={16} />}</button>}
      <button type="button" onClick={() => advance(1)} aria-label="Next coastal scene" className="rounded-full p-2 hover:bg-teal-50"><ChevronRight size={16} /></button>
    </div>
  </>;
}
