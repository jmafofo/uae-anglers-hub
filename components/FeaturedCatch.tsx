'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trophy, Fish } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface FeaturedCatchData {
  id: string;
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  bait: string | null;
  technique: string | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  caught_at: string;
  profiles: { display_name: string; username: string } | null;
}

function formatCaption(c: FeaturedCatchData): string {
  const name = c.profiles?.display_name ?? 'An angler';
  const weight = c.weight_kg ? `${c.weight_kg}kg` : null;
  const species = c.species;
  const bait = c.bait ? ` on ${c.bait.toLowerCase()}` : '';
  const technique = c.technique ? ` using ${c.technique.toLowerCase()}` : '';

  if (weight) {
    return `${name} caught a ${weight} ${species}${bait}${technique}`;
  }
  return `${name} caught a ${species}${bait}${technique}`;
}

export default function FeaturedCatch() {
  const [catch_, setCatch] = useState<FeaturedCatchData | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();

      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);

      let { data: winner } = await sb
        .from('catches')
        .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, profiles(display_name, username)')
        .eq('is_public', true)
        .not('weight_kg', 'is', null)
        .gte('caught_at', monthAgo.toISOString())
        .order('weight_kg', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!winner) {
        const { data: allTime } = await sb
          .from('catches')
          .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, profiles(display_name, username)')
          .eq('is_public', true)
          .not('weight_kg', 'is', null)
          .order('weight_kg', { ascending: false })
          .limit(1)
          .maybeSingle();
        winner = allTime;
      }

      if (winner) {
        // Supabase returns one-to-one joins as an array of one
        const mapped: FeaturedCatchData = {
          ...winner,
          profiles: Array.isArray(winner.profiles) ? winner.profiles[0] ?? null : winner.profiles,
        } as FeaturedCatchData;
        setCatch(mapped);
      }
    }
    load();
  }, []);

  if (!catch_) return null;

  const imageUrl = catch_.photo_urls?.[0] ?? catch_.photo_url;

  return (
    <div className="hidden xl:flex flex-col w-[360px] shrink-0">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1828]/70 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-blue-400 to-teal-400" />

        <div className="p-4 pb-3">
          <div className="flex items-center gap-2 text-teal-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Featured Catch</span>
          </div>
          <p className="text-[10px] text-gray-500">Biggest catch this month</p>
        </div>

        <Link href={`/catches/${catch_.id}`} className="block group">
          {imageUrl && !imageError ? (
            <div className="relative w-full aspect-[4/3] overflow-hidden bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={catch_.species}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1828]/90 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-white/5 flex flex-col items-center justify-center text-gray-500">
              <Fish className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-xs">{imageUrl ? 'Photo unavailable' : 'No photo'}</span>
            </div>
          )}

          <div className="px-4 pb-4 pt-3">
            <p className="text-sm font-semibold text-white leading-snug group-hover:text-teal-300 transition-colors">
              {formatCaption(catch_)}
            </p>
            {catch_.length_cm && (
              <p className="text-xs text-gray-500 mt-1">{catch_.length_cm} cm</p>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
