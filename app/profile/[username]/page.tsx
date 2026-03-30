import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fish, MapPin, Calendar, Trophy } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, emirate')
    .eq('username', username)
    .single();

  if (!profile) return { title: 'Angler not found' };

  return {
    title: `${profile.display_name} (@${username}) — UAE Anglers Hub`,
    description:
      profile.bio ||
      `${profile.display_name} is a UAE angler${profile.emirate ? ` based in ${profile.emirate}` : ''}. View their catch log on UAE Anglers Hub.`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const { data: catches } = await supabase
    .from('catches')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('caught_at', { ascending: false })
    .limit(12);

  const joinedYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* Profile header */}
        <div className="flex items-start gap-5 mb-10 p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-teal-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {profile.display_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold text-white">{profile.display_name}</h1>
            <p className="text-gray-400 text-sm">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-300 text-sm mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {profile.emirate && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.emirate}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {joinedYear}
              </span>
            </div>
          </div>
          {/* Stats */}
          <div className="text-center shrink-0">
            <div className="flex items-center gap-1 text-teal-400">
              <Fish className="w-4 h-4" />
              <span className="text-2xl font-bold">{profile.total_catches}</span>
            </div>
            <div className="text-gray-500 text-xs">Catches</div>
          </div>
        </div>

        {/* Catches feed */}
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-teal-400" />
          Recent Catches
        </h2>

        {!catches || catches.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Fish className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No public catches yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {catches.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors"
              >
                {c.photo_url && (
                  <div className="w-full h-36 rounded-lg overflow-hidden mb-3 bg-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.photo_url}
                      alt={c.species}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">{c.species}</p>
                    {c.weight_kg && (
                      <p className="text-teal-400 text-sm">{c.weight_kg} kg</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(c.caught_at).toLocaleDateString('en-AE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                {c.location_name && (
                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {c.location_name}
                  </p>
                )}
                {c.bait && (
                  <p className="text-gray-600 text-xs mt-1">Bait: {c.bait}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
          >
            Join UAE Anglers Hub — Log Your Catches
          </Link>
        </div>
      </div>
    </div>
  );
}
