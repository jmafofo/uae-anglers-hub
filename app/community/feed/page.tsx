'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Rss, Users, ArrowLeft, Fish, MapPin,
  UserPlus, ChevronRight,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface FeedCatch {
  id: string;
  species: string;
  weight_kg: number | null;
  length_cm: number | null;
  location_name: string | null;
  emirate: string | null;
  photo_url: string | null;
  caught_at: string;
  bait: string | null;
  profiles: { display_name: string; username: string } | null;
}

interface SuggestedAngler {
  id: string;
  username: string;
  display_name: string;
  total_catches: number;
}

export default function FeedPage() {
  const [catches, setCatches] = useState<FeedCatch[]>([]);
  const [suggested, setSuggested] = useState<SuggestedAngler[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();

      if (user) {
        // Get who user follows
        const { data: following } = await sb
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = (following ?? []).map((f: { following_id: string }) => f.following_id);
        setFollowingCount(followingIds.length);

        if (followingIds.length > 0) {
          const { data: feed } = await sb
            .from('catches')
            .select('*, profiles(display_name, username)')
            .in('user_id', followingIds)
            .eq('is_public', true)
            .order('caught_at', { ascending: false })
            .limit(30);
          setCatches(feed ?? []);
        }
      }

      // Suggested anglers — most active
      const { data: anglers } = await sb
        .from('profiles')
        .select('id, username, display_name, total_catches')
        .order('total_catches', { ascending: false })
        .limit(5);
      setSuggested(anglers ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="min-h-screen pt-14 pb-16">

      {/* Sub-nav breadcrumb */}
      <div className="border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md px-4 py-3 mb-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/community" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Community
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
          <span className="text-sm text-white font-semibold">Following Feed</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main feed */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Rss className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Your Following Feed</h1>
                <p className="text-xs text-gray-500">
                  {loading ? 'Loading…' : `Activity from ${followingCount} angler${followingCount !== 1 ? 's' : ''} you follow`}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
                ))}
              </div>
            ) : catches.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-teal-400" />
                </div>
                <h2 className="text-white font-bold text-lg mb-2">No Following Yet</h2>
                <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                  Start following other anglers to see their catches and activity here.
                </p>
                <Link
                  href="/catches"
                  className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Discover Anglers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {catches.map((c) => {
                  const profile = c.profiles;
                  return (
                    <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                      {/* Photo or placeholder */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                        {c.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.photo_url} alt={c.species} className="w-full h-full object-cover" />
                        ) : (
                          <Fish className="w-6 h-6 text-teal-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-white">{c.species}</p>
                            <p className="text-xs text-gray-500">
                              {profile?.display_name ?? 'Angler'}
                              {c.weight_kg ? ` · ${c.weight_kg} kg` : ''}
                              {c.length_cm ? ` · ${c.length_cm} cm` : ''}
                            </p>
                          </div>
                          <span className="text-xs text-gray-600 shrink-0">{timeAgo(c.caught_at)}</span>
                        </div>
                        {(c.location_name || c.emirate) && (
                          <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {c.location_name ?? c.emirate}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-64 shrink-0 space-y-5">
            {/* Suggested anglers */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">Suggested Anglers</h3>
              </div>
              <div className="space-y-3">
                {suggested.map((a) => (
                  <Link
                    key={a.id}
                    href={`/profile/${a.username}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0">
                      {(a.display_name ?? a.username).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                        {a.display_name ?? a.username}
                      </p>
                      <p className="text-xs text-gray-600">{a.total_catches ?? 0} catches</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Pro tip */}
            <div className="rounded-2xl bg-teal-500/5 border border-teal-500/15 p-5">
              <p className="text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2">Pro Tip</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Follow active anglers to get inspired by their catches and learn new techniques from their posts!
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
