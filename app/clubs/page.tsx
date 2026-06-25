import type { Metadata } from 'next';
import Link from 'next/link';
import { Anchor, Plus, Users, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: clubs } = await supabase
    .from('clubs')
    .select('id')
    .eq('visibility', 'public')
    .limit(1);

  const isEmpty = !clubs || clubs.length === 0;

  return {
    title: 'Fishing Clubs — UAE Anglers Hub',
    description: 'Join private fishing clubs and plan trips with fellow UAE anglers.',
    ...(isEmpty && { robots: { index: false, follow: true } }),
  };
}

export const revalidate = 60;

export default async function ClubsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Only public clubs are browsable without auth
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*, profiles!inner(display_name, username, avatar_url)')
    .eq('visibility', 'public')
    .order('member_count', { ascending: false });

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Fishing Clubs</h1>
            <p className="text-gray-400">Private groups for serious anglers</p>
          </div>
          <Link
            href="/clubs/new"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Club
          </Link>
        </div>

        {(!clubs || clubs.length === 0) ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <Anchor className="w-8 h-8 text-teal-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No public clubs yet</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Clubs are private by default. Create your own or get invited to one.
            </p>
            <Link
              href="/clubs/new"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create a Club
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {clubs.map((c) => (
              <Link
                key={c.id}
                href={`/clubs/${c.slug}`}
                className="group p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Anchor className="w-5 h-5 text-teal-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                        {c.name}
                      </h2>
                      {c.visibility === 'private' && (
                        <Lock className="w-3 h-3 text-gray-500 shrink-0" />
                      )}
                    </div>
                    {c.description && (
                      <p className="text-gray-500 text-sm line-clamp-2 mb-2">{c.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {c.member_count} member{c.member_count !== 1 ? 's' : ''}
                      </span>
                      <span>by {c.profiles?.display_name || c.profiles?.username}</span>
                    </div>
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
