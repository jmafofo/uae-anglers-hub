'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy, Fish, ArrowUpRight } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { catchWeek } from '@/lib/catch-week';

type Entry = {
  id: string; species: string; weight_kg: number; photo_url: string | null;
  photo_urls: string[] | null; caught_at: string;
  profiles: { display_name: string | null; username: string | null } | null;
};

export default function FeaturedCatch() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [period, setPeriod] = useState('This week');
  const [imageError, setImageError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const week = catchWeek();
        const { data, error } = await getSupabase().from('catches')
          .select('id, species, weight_kg, photo_url, photo_urls, caught_at, profiles(display_name, username)')
          .eq('is_public', true).gt('weight_kg', 0)
          .or('identification_status.eq.identified,identification_status.is.null')
          .gte('caught_at', week.start).lt('caught_at', week.end)
          .lte('caught_at', new Date().toISOString())
          .order('weight_kg', { ascending: false }).order('caught_at', { ascending: true }).order('id')
          .limit(3);
        if (!active) return;
        if (error) { setStatus('error'); return; }
        setPeriod(week.label);
        setEntries((data ?? []).map(row => ({ ...row, profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles })) as Entry[]);
        setStatus('ready');
      } catch { if (active) setStatus('error'); }
    }
    void load();
    return () => { active = false; };
  }, []);
  const [winner, ...runnersUp] = entries;
  const image = winner?.photo_urls?.[0] || winner?.photo_url;
  return <section className="w-full overflow-hidden rounded-2xl border border-white/15 bg-[#0b2532] text-white shadow-xl" aria-label="Weekly wall of fame">
    <div className="border-b border-white/10 p-5">
      <div className="flex items-center gap-2 text-teal-200"><Trophy size={18} /><h3 className="text-sm font-semibold uppercase tracking-widest">Weekly wall of fame</h3></div>
      <p className="mt-2 text-sm text-slate-300">{period} · UAE time</p>
      <p className="mt-1 text-xs text-slate-400">Biggest public catches by recorded weight · resets Monday</p>
    </div>
    {winner ? <>
      <Link href={`/catches/${winner.id}`} className="group block">
        {image && !imageError ? <div className="relative aspect-[4/3] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={`${winner.species}, this week's leading catch`} loading="lazy" className="h-full w-full object-cover" onError={() => setImageError(true)} />
          <span className="absolute left-4 top-4 rounded-full bg-[#0b2532]/90 px-4 py-2 text-sm font-semibold">#1 this week · {winner.weight_kg} kg</span>
        </div> : <div className="flex h-40 items-center justify-center bg-white/5"><Fish size={48} className="text-teal-200" /></div>}
        <div className="p-5"><p className="text-xl font-semibold group-hover:text-teal-200">{winner.species} · {winner.weight_kg} kg</p><p className="mt-1 text-sm text-slate-300">Caught by {winner.profiles?.display_name || winner.profiles?.username || 'a community angler'}</p></div>
      </Link>
      {runnersUp.map((entry, index) => <Link key={entry.id} href={`/catches/${entry.id}`} className="flex items-center gap-3 border-t border-white/10 px-5 py-3 hover:bg-white/5"><span className="text-teal-200">#{index + 2}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm">{entry.species}</span><span className="text-xs text-slate-400">{entry.profiles?.display_name || entry.profiles?.username || 'Community angler'}</span></span><strong className="text-sm">{entry.weight_kg} kg</strong></Link>)}
    </> : <div className="px-6 py-10 text-center" role="status"><Trophy className="mx-auto mb-4 text-teal-200" size={32} /><p className="font-medium">{status === 'loading' ? 'Finding this week’s biggest catches…' : status === 'error' ? 'The leaderboard is temporarily unavailable.' : 'This week’s crown is waiting.'}</p><p className="mt-2 text-sm text-slate-300">{status === 'ready' ? 'Log a public, identified catch with its weight to join the weekly standings.' : 'Public catches from the UAE fishing community.'}</p><Link href="/log-catch" className="mt-5 inline-block rounded-lg bg-teal-200 px-4 py-2 text-sm font-semibold text-slate-900">Log your catch</Link></div>}
    <Link href="/hall-of-fame?period=week" className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-teal-200">Explore the hall of fame<ArrowUpRight size={16} /></Link>
  </section>;
}
