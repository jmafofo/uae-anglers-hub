import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Fish, MapPin, Calendar, Trophy, MessageCircle, MessageSquare, Reply } from 'lucide-react';
import OnlineDot from '@/components/OnlineDot';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PageProps {
  params: Promise<{ username: string }>;
}

/** One row from the profile_wall view (UNION ALL across sources) */
interface WallRow {
  user_id: string;
  kind: 'catch' | 'thread' | 'comment';
  item_id: string;
  created_at: string;
  title: string;
  excerpt: string;
  photo_url: string | null;
  parent_id: string | null;
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

  // Unified wall: catches + forum threads + catch comments,
  // ordered chronologically. The profile_wall view does the
  // UNION ALL server-side.
  const { data: wallItems } = await supabase
    .from('profile_wall')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20);

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
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-white">{profile.display_name}</h1>
              <OnlineDot userId={profile.id} showLabel />
            </div>
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
          {/* Stats + Message CTA */}
          <div className="flex flex-col items-end gap-3 shrink-0">
            <div className="text-center">
              <div className="flex items-center gap-1 text-teal-400">
                <Fish className="w-4 h-4" />
                <span className="text-2xl font-bold">{profile.total_catches}</span>
              </div>
              <div className="text-gray-500 text-xs">Catches</div>
            </div>
            {profile.dm_policy === 'closed' ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold cursor-not-allowed"
                title="This angler isn't accepting direct messages"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                DMs off
              </span>
            ) : (
              <Link
                href={`/community/messages?to=${profile.username}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 text-xs font-semibold transition-colors"
                title={profile.dm_policy === 'followers_only' ? 'May be limited to followers' : undefined}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Message
              </Link>
            )}
          </div>
        </div>

        {/* Unified wall — catches + threads + comments */}
        <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-teal-400" />
          {profile.display_name?.split(' ')[0] ?? 'Angler'}&rsquo;s activity
        </h2>

        {!wallItems || wallItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500 rounded-2xl border border-dashed border-white/10">
            <Fish className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No public activity yet.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {wallItems.map((item) => (
              <li key={`${item.kind}-${item.item_id}`}>
                <WallItem item={item as WallRow} />
              </li>
            ))}
          </ul>
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

/* ─── Wall item renderer ─────────────────────────────────────
 * Kind-aware card. Three layouts:
 *   catch    → photo + species; links to /catches/[id]
 *   thread   → text card with title + excerpt; links to /forum/thread/[id]
 *   comment  → quoted excerpt under "Comment on <catch>"; links to the catch
 */
function WallItem({ item }: { item: WallRow }) {
  const when = new Date(item.created_at).toLocaleDateString('en-AE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  if (item.kind === 'catch') {
    return (
      <Link
        href={`/catches/${item.item_id}`}
        className="block rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors overflow-hidden"
      >
        {item.photo_url && (
          <div className="w-full h-44 bg-white/10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photo_url} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-4 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Fish className="w-3.5 h-3.5 text-green-400" />
              <span className="text-[10px] uppercase tracking-wider text-green-400 font-bold">Catch</span>
            </div>
            <p className="font-semibold text-white">{item.title}</p>
            {item.excerpt && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 shrink-0">{when}</span>
        </div>
      </Link>
    );
  }

  if (item.kind === 'thread') {
    return (
      <Link
        href={`/forum/thread/${item.item_id}`}
        className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold">Thread</span>
            </div>
            <p className="font-semibold text-white line-clamp-1">{item.title}</p>
            {item.excerpt && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.excerpt}</p>
            )}
          </div>
          <span className="text-xs text-gray-500 shrink-0">{when}</span>
        </div>
      </Link>
    );
  }

  // comment
  return (
    <Link
      href={`/catches/${item.parent_id}`}
      className="block p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Reply className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[10px] uppercase tracking-wider text-teal-400 font-bold">{item.title}</span>
          </div>
          {item.excerpt && (
            <p className="text-sm text-gray-300 italic border-l-2 border-white/10 pl-3 mt-1 line-clamp-3">
              &ldquo;{item.excerpt}&rdquo;
            </p>
          )}
        </div>
        <span className="text-xs text-gray-500 shrink-0">{when}</span>
      </div>
    </Link>
  );
}
