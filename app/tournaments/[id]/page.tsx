'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, MapPin, Users, Check } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Tournament {
  id: string; title: string; description: string; emirate: string; location_name: string;
  start_date: string; end_date: string; scoring_type: string; target_species: string;
  prize_description: string; max_participants: number | null; participant_count: number; status: string;
  profiles: { display_name: string; username: string };
}

interface Participant {
  id: string; total_score: number; catch_count: number;
  profiles: { display_name: string; username: string };
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const [{ data: t }, { data: p }, { data: { user } }] = await Promise.all([
        sb.from('tournaments').select('*, profiles(display_name,username)').eq('id', id).single(),
        sb.from('tournament_participants').select('*, profiles(display_name,username)').eq('tournament_id', id).order('total_score', { ascending: false }),
        sb.auth.getUser(),
      ]);
      setTournament(t);
      setParticipants(p ?? []);
      setUserId(user?.id ?? null);
      if (user) setJoined((p ?? []).some((x: Participant) => (x.profiles as { username: string })?.username === user.email));
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleJoin() {
    if (!userId) { router.push('/login'); return; }
    setJoining(true);
    const sb = getSupabase();
    const { error } = await sb.from('tournament_participants').insert({ tournament_id: id, user_id: userId });
    if (!error) {
      setJoined(true);
      setTournament((t) => t ? { ...t, participant_count: t.participant_count + 1 } : t);
      const { data: p } = await sb.from('tournament_participants').select('*, profiles(display_name,username)').eq('tournament_id', id).order('total_score', { ascending: false });
      setParticipants(p ?? []);
    }
    setJoining(false);
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading tournament...</div>;
  if (!tournament) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Tournament not found.</div>;

  const isActive = tournament.status === 'active';
  const isUpcoming = tournament.status === 'upcoming';

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Tournaments
        </Link>

        {/* Header */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-2xl font-extrabold text-white flex-1 pr-4">{tournament.title}</h1>
            <span className={`text-xs border px-3 py-1 rounded-full capitalize shrink-0 ${isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : isUpcoming ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
              {tournament.status}
            </span>
          </div>

          {tournament.description && <p className="text-gray-300 text-sm leading-relaxed mb-5">{tournament.description}</p>}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: Calendar, label: 'Start', value: new Date(tournament.start_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: Calendar, label: 'End', value: new Date(tournament.end_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ...(tournament.emirate ? [{ icon: MapPin, label: 'Emirates', value: tournament.emirate }] : []),
              { icon: Users, label: 'Participants', value: `${tournament.participant_count}${tournament.max_participants ? ` / ${tournament.max_participants}` : ''}` },
              ...(tournament.target_species ? [{ icon: Trophy, label: 'Target Species', value: tournament.target_species }] : []),
              { icon: Trophy, label: 'Scoring', value: tournament.scoring_type.replace('_', ' ') },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-gray-500 text-xs">{label}</div>
                  <div className="text-white capitalize">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {tournament.prize_description && (
            <div className="mt-5 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-yellow-400/80 text-sm">{tournament.prize_description}</span>
            </div>
          )}

          {(isActive || isUpcoming) && !joined && (
            <button
              onClick={handleJoin}
              disabled={joining}
              className="mt-5 w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white font-bold transition-colors"
            >
              {joining ? 'Joining...' : 'Join Tournament'}
            </button>
          )}
          {joined && (
            <div className="mt-5 flex items-center justify-center gap-2 py-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 font-semibold text-sm">
              <Check className="w-4 h-4" /> You&apos;re registered
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard
        </h2>

        {participants.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No participants yet.</div>
        ) : (
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border ${i === 0 ? 'bg-yellow-500/5 border-yellow-500/20' : i === 1 ? 'bg-gray-400/5 border-gray-400/20' : i === 2 ? 'bg-amber-600/5 border-amber-600/20' : 'bg-white/5 border-white/10'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? 'bg-yellow-400 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-600 text-white' : 'bg-white/10 text-gray-400'}`}>
                  {i + 1}
                </div>
                <Link href={`/profile/${(p.profiles as { username: string })?.username}`} className="flex-1 font-semibold text-white hover:text-teal-400 transition-colors">
                  {(p.profiles as { display_name: string })?.display_name}
                </Link>
                <div className="text-right">
                  <div className="text-teal-400 font-bold">{p.total_score} kg</div>
                  <div className="text-gray-600 text-xs">{p.catch_count} catches</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
