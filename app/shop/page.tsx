import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, Plus, MapPin, Tag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'UAE Fishing Gear Marketplace — Buy & Sell Tackle',
  description: 'Buy and sell fishing gear across the UAE. Rods, reels, lures, boats and accessories from UAE anglers.',
};

export const revalidate = 60;

const CATEGORIES = ['All', 'Rod', 'Reel', 'Lure', 'Accessories', 'Boat', 'Other'];
const CONDITIONS: Record<string, string> = { new: 'New', like_new: 'Like New', good: 'Good', fair: 'Fair' };

export default async function ShopPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: listings } = await supabase
    .from('listings')
    .select('*, profiles(display_name, username)')
    .eq('is_active', true)
    .eq('is_sold', false)
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Gear Marketplace</h1>
            <p className="text-gray-400">Buy & sell fishing gear across the UAE</p>
          </div>
          <Link href="/shop/create" className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" /> Sell Gear
          </Link>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((c) => (
            <span key={c} className="px-4 py-1.5 rounded-full text-sm border border-white/20 text-gray-400 cursor-pointer hover:border-teal-500/40 hover:text-white transition-colors">
              {c}
            </span>
          ))}
        </div>

        {(!listings || listings.length === 0) ? (
          <div className="text-center py-24 text-gray-500">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No listings yet.</p>
            <Link href="/shop/create" className="text-teal-400 hover:underline text-sm">Be the first to sell</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((l) => (
              <Link key={l.id} href={`/shop/${l.id}`} className="group rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all overflow-hidden">
                {l.photos?.[0] ? (
                  <div className="w-full h-44 bg-white/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.photos[0]} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="w-full h-44 bg-white/5 flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-700" />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate mb-1">{l.title}</h2>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-teal-400 font-bold text-lg">
                      {l.price ? `AED ${l.price.toLocaleString()}` : 'Make an offer'}
                    </span>
                    <span className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full">
                      {CONDITIONS[l.condition] ?? l.condition}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {l.category}
                    </span>
                    {l.emirate && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {l.emirate}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
