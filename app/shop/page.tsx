import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag, Plus, MapPin, Tag, Zap, BadgeCheck } from 'lucide-react';
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
    .select('*, profiles(display_name, username, verified_retailer, account_type)')
    .eq('is_active', true)
    .eq('is_sold', false)
    .order('is_boosted', { ascending: false })
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

        {/* Retailer CTA banner */}
        <Link href="/advertise" className="flex items-center justify-between gap-4 rounded-xl bg-teal-500/5 border border-teal-500/20 hover:border-teal-500/40 px-5 py-3.5 mb-6 transition-colors group">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
              <span className="font-semibold text-teal-400">Tackle shop or brand?</span> Get a Verified Retailer badge and priority placement.
            </p>
          </div>
          <span className="text-xs font-bold text-teal-400 whitespace-nowrap">See plans →</span>
        </Link>

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
            {listings.map((l) => {
              const profile = l.profiles as { display_name: string; username: string; verified_retailer?: boolean; account_type?: string } | null;
              const isBoosted = l.is_boosted && l.boosted_until && new Date(l.boosted_until) > new Date();
              const isVerified = profile?.verified_retailer;
              return (
                <Link key={l.id} href={`/shop/${l.id}`}
                  className={`group rounded-xl border hover:border-teal-500/40 transition-all overflow-hidden ${
                    isBoosted
                      ? 'bg-amber-500/5 border-amber-500/30 shadow-md shadow-amber-500/5'
                      : 'bg-white/5 border-white/10'
                  }`}>
                  {/* Photo */}
                  <div className="relative">
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
                    {/* Badges overlay */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isBoosted && (
                        <span className="flex items-center gap-1 text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
                          <Zap className="w-3 h-3" /> Boosted
                        </span>
                      )}
                      {isVerified && (
                        <span className="flex items-center gap-1 text-xs font-semibold bg-teal-600 text-white px-2 py-0.5 rounded-full shadow">
                          <BadgeCheck className="w-3 h-3" /> Verified Retailer
                        </span>
                      )}
                    </div>
                  </div>

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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
