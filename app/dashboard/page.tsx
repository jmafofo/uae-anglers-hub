'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Fish, MapPin, Plus, LogOut, User, Settings } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface Profile {
  username: string;
  display_name: string;
  bio: string | null;
  emirate: string | null;
  total_catches: number;
  created_at: string;
}

interface Catch {
  id: string;
  species: string;
  weight_kg: number | null;
  location_name: string | null;
  caught_at: string;
  photo_url: string | null;
  is_public: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: prof } = await sb
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(prof);

      const { data: myCatches } = await sb
        .from('catches')
        .select('*')
        .eq('user_id', user.id)
        .order('caught_at', { ascending: false })
        .limit(20);
      setCatches(myCatches ?? []);
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleSignOut() {
    await getSupabase().auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Profile bar */}
        <div className="flex items-center justify-between mb-8 p-5 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-bold text-white">{profile?.display_name}</p>
              <p className="text-gray-400 text-sm">@{profile?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${profile?.username}`}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Public profile</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Catches', value: profile?.total_catches ?? 0, icon: Fish },
            { label: 'Emirate', value: profile?.emirate ?? '—', icon: MapPin },
            {
              label: 'Member Since',
              value: profile ? new Date(profile.created_at).getFullYear() : '—',
              icon: Settings,
            },
            { label: 'Public Catches', value: catches.filter((c) => c.is_public).length, icon: User },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
              <Icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Log catch CTA */}
        <Link
          href="/log-catch"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-base transition-colors mb-8"
        >
          <Plus className="w-5 h-5" />
          Log a New Catch
        </Link>

        {/* Catch history */}
        <h2 className="text-xl font-bold text-white mb-5">Your Catch History</h2>

        {catches.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Fish className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No catches yet. Log your first one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {catches.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photo_url}
                    alt={c.species}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Fish className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{c.species}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    {c.weight_kg && <span>{c.weight_kg} kg</span>}
                    {c.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {c.location_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">
                    {new Date(c.caught_at).toLocaleDateString('en-AE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      c.is_public
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                    }`}
                  >
                    {c.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
