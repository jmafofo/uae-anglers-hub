import type { Metadata } from 'next';
import Link from 'next/link';
import { Trophy, Plus, Calendar, MapPin, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'UAE Fishing Tournaments — Join & Compete',
  description: 'Browse and join fishing tournaments across the UAE. Live leaderboards, multiple scoring types, and prizes for UAE anglers.',
};

export const revalidate = 60;

function statusBadge(status: string) {
  if (status === 'active') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'upcoming') return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
  return 'bg-white/5 text-gray-500 border-white/10';
}

export default async function TournamentsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('*, profiles(display_name)')
    .order('start_date', { ascending: true });

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Tournaments</h1>
            <p className="text-gray-400">Compete with UAE anglers — live leaderboards</p>
          </div>
          <Link
            href="/tournaments/create"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </Link>
        </div>

        {(!tournaments || tournaments.length === 0) ? (
          <div className="text-center py-24 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">No tournaments yet.</p>
            <Link href="/tournaments/create" className="text-teal-400 hover:underline text-sm">
              Create the first one
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {tournaments.map((t) => (
              <Link
                key={t.id}
                href={`/tournaments/${t.id}`}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors leading-snug flex-1 pr-2">
                    {t.title}
                  </h2>
                  <span className={`text-xs border px-2 py-0.5 rounded-full shrink-0 capitalize ${statusBadge(t.status)}`}>
                    {t.status}
                  </span>
                </div>

                {t.description && (
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">{t.description}</p>
                )}

                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(t.start_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {new Date(t.end_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  {t.emirate && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {t.emirate}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {t.participant_count} joined
                    {t.max_participants ? ` / ${t.max_participants} max` : ''}
                  </div>
                </div>

                {t.prize_description && (
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-yellow-400/80">{t.prize_description}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
