import Link from 'next/link';
import Image from 'next/image';
import { Trophy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

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
  profiles: { display_name: string; username: string }[] | null;
}

async function fetchFeaturedCatch(): Promise<FeaturedCatchData | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supabase = createClient(url, key);

  // Last 30 days
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const { data: monthWinner } = await supabase
    .from('catches')
    .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, profiles(display_name, username)')
    .eq('is_public', true)
    .not('weight_kg', 'is', null)
    .gte('caught_at', monthAgo.toISOString())
    .order('weight_kg', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (monthWinner) return monthWinner as unknown as FeaturedCatchData;

  // Fallback: all-time biggest public catch
  const { data: allTimeWinner } = await supabase
    .from('catches')
    .select('id, species, weight_kg, length_cm, bait, technique, photo_url, photo_urls, caught_at, profiles(display_name, username)')
    .eq('is_public', true)
    .not('weight_kg', 'is', null)
    .order('weight_kg', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (allTimeWinner as unknown as FeaturedCatchData) ?? null;
}

function formatCaption(c: FeaturedCatchData): string {
  const profile = c.profiles?.[0];
  const name = profile?.display_name ?? 'An angler';
  const weight = c.weight_kg ? `${c.weight_kg}kg` : null;
  const species = c.species;
  const bait = c.bait ? ` on ${c.bait}` : '';
  const technique = c.technique ? ` using ${c.technique}` : '';

  if (weight) {
    return `${name} caught a ${weight} ${species}${bait}${technique}`;
  }
  return `${name} caught a ${species}${bait}${technique}`;
}

export default async function FeaturedCatch() {
  const catch_ = await fetchFeaturedCatch();
  if (!catch_) return null;

  const imageUrl = catch_.photo_urls?.[0] ?? catch_.photo_url;

  return (
    <div className="hidden xl:flex flex-col w-80 shrink-0">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a1828]/60 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-blue-400 to-teal-400" />

        <div className="p-4 pb-3">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Featured Catch</span>
          </div>
          <p className="text-[10px] text-gray-500">Biggest catch this month</p>
        </div>

        <Link href={`/catches/${catch_.id}`} className="block group">
          {imageUrl ? (
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image
                src={imageUrl}
                alt={catch_.species}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="320px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1828]/90 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-white/5 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white/10" />
            </div>
          )}

          <div className="px-4 pb-4 -mt-8 relative z-10">
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
