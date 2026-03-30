import type { Metadata } from 'next';
import Link from 'next/link';
import { Fish, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'UAE Angler Catches — Community Catch Feed',
  description:
    'Browse the latest catches from UAE anglers. Hammour, Kingfish, Barracuda, Trevally and more from Dubai, Abu Dhabi, RAK, Fujairah and across the Emirates.',
};

export const revalidate = 60;

interface Catch {
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

export default async function CatchesPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: catches } = await supabase
    .from('catches')
    .select('*, profiles(display_name, username)')
    .eq('is_public', true)
    .order('caught_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Community Catches</h1>
            <p className="text-gray-400">Latest catches from UAE anglers</p>
          </div>
          <Link
            href="/log-catch"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Fish className="w-4 h-4" />
            Log Yours
          </Link>
        </div>

        {!catches || catches.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <Fish className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No catches yet.</p>
            <p className="text-sm mb-6">Be the first to log a catch!</p>
            <Link
              href="/log-catch"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-3 rounded-lg font-semibold text-sm"
            >
              Log a Catch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(catches as Catch[]).map((c) => (
              <div
                key={c.id}
                className="rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors overflow-hidden"
              >
                {c.photo_url && (
                  <div className="w-full h-44 bg-white/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.photo_url}
                      alt={c.species}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{c.species}</p>
                      {c.weight_kg && (
                        <p className="text-teal-400 text-sm font-medium">{c.weight_kg} kg</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 ml-2">
                      {new Date(c.caught_at).toLocaleDateString('en-AE', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  {c.location_name && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" />
                      {c.location_name}
                      {c.emirate && `, ${c.emirate}`}
                    </p>
                  )}
                  {c.bait && (
                    <p className="text-xs text-gray-600">Bait: {c.bait}</p>
                  )}

                  {c.profiles && (
                    <Link
                      href={`/profile/${c.profiles.username}`}
                      className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 group"
                    >
                      <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {c.profiles.display_name?.[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs text-gray-500 group-hover:text-teal-400 transition-colors">
                        {c.profiles.display_name}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
