import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Users, MessageSquare, MessageCircle, Fish,
  ChevronRight, Rss, ArrowRight,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'Community — UAE Anglers Hub',
  description:
    'The UAE angling community hub. Follow other anglers, read the forum, send messages and browse the latest catches from across the Emirates.',
};

export const revalidate = 60;

const SECTIONS = [
  {
    href: '/community/feed',
    icon: Rss,
    label: 'Following Feed',
    desc: 'Catches and updates from anglers you follow',
    accent: 'teal',
  },
  {
    href: '/forum',
    icon: MessageSquare,
    label: 'Forum',
    desc: 'General discussion, techniques, gear & spot reports',
    accent: 'blue',
  },
  {
    href: '/community/messages',
    icon: MessageCircle,
    label: 'Messages',
    desc: 'Direct messages and group chats with fellow anglers',
    accent: 'indigo',
  },
  {
    href: '/catches',
    icon: Fish,
    label: 'Catches',
    desc: 'Community catch feed — the latest from UAE waters',
    accent: 'green',
  },
];

const ACCENT: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  teal:   { bg: 'bg-teal-500/10',   border: 'border-teal-500/20',   icon: 'text-teal-400',   badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  blue:   { bg: 'bg-blue-500/10',   border: 'border-blue-500/20',   icon: 'text-blue-400',   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: 'text-indigo-400', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  green:  { bg: 'bg-green-500/10',  border: 'border-green-500/20',  icon: 'text-green-400',  badge: 'bg-green-500/10 text-green-400 border-green-500/20' },
};

export default async function CommunityPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch recent catches for the preview strip
  const { data: recentCatches } = await supabase
    .from('catches')
    .select('id, species, emirate, caught_at, photo_url, profiles(display_name, username)')
    .eq('is_public', true)
    .order('caught_at', { ascending: false })
    .limit(4);

  // Fetch recent forum threads
  const { data: recentThreads } = await supabase
    .from('forum_threads')
    .select('id, title, category_slug, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(4);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <h1 className="text-3xl font-extrabold text-white">Community</h1>
          </div>
          <p className="text-gray-400 ml-13 pl-0.5">
            Connect with UAE anglers — follow, chat, share catches, and discuss the sport.
          </p>
        </div>

        {/* 4 section cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {SECTIONS.map(({ href, icon: Icon, label, desc, accent }) => {
            const a = ACCENT[accent];
            return (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-500/30 hover:bg-white/8 transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${a.icon}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white group-hover:text-teal-400 transition-colors">{label}</p>
                  <p className="text-sm text-gray-400 truncate">{desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Recent activity — two columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

          {/* Recent catches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Recent Catches</h2>
              <Link href="/catches" className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
                All catches <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {!recentCatches || recentCatches.length === 0 ? (
                <div className="py-8 text-center rounded-xl bg-white/5 border border-white/10">
                  <Fish className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-600">No catches yet — be the first!</p>
                  <Link href="/log-catch" className="text-xs text-teal-400 hover:underline mt-1 block">Log a catch →</Link>
                </div>
              ) : (
                recentCatches.map((c) => {
                  const profile = c.profiles as unknown as { display_name: string; username: string } | null;
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                        <Fish className="w-4 h-4 text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{c.species}</p>
                        <p className="text-xs text-gray-500">
                          {profile?.display_name ?? 'Angler'}{c.emirate ? ` · ${c.emirate}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent forum threads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Forum Activity</h2>
              <Link href="/forum" className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1">
                All threads <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {!recentThreads || recentThreads.length === 0 ? (
                <div className="py-8 text-center rounded-xl bg-white/5 border border-white/10">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                  <p className="text-sm text-gray-600">No threads yet — start a discussion!</p>
                  <Link href="/forum/new" className="text-xs text-teal-400 hover:underline mt-1 block">New thread →</Link>
                </div>
              ) : (
                recentThreads.map((t) => {
                  const profile = t.profiles as unknown as { display_name: string } | null;
                  return (
                    <Link
                      key={t.id}
                      href={`/forum/thread/${t.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-colors group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageSquare className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors line-clamp-1">{t.title}</p>
                        <p className="text-xs text-gray-500">{profile?.display_name ?? 'Angler'}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
