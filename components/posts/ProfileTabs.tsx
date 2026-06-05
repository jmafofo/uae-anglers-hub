'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Grid3X3, Fish, Trophy, MessageSquare, Reply } from 'lucide-react';
import PostGridWrapper from './PostGridWrapper';

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

interface ProfileTabsProps {
  profile: { display_name?: string | null; username: string };
  posts: any[];
  wallItems: WallRow[];
}

export default function ProfileTabs({ profile, posts, wallItems }: ProfileTabsProps) {
  const [tab, setTab] = useState<'posts' | 'catches' | 'activity'>('posts');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-center gap-1 border-t border-white/10 mb-4">
        {[
          { key: 'posts' as const, label: 'Posts', icon: Grid3X3 },
          { key: 'catches' as const, label: 'Catches', icon: Fish },
          { key: 'activity' as const, label: 'Activity', icon: Trophy },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold border-t-2 transition-colors ${
              tab === key
                ? 'text-white border-teal-400'
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'posts' && (
        <PostGridWrapper posts={posts} emptyMessage={`${profile.display_name?.split(' ')[0] ?? 'This angler'} hasn't posted yet.`} />
      )}

      {tab === 'catches' && (
        <div>
          {wallItems.filter((i) => i.kind === 'catch').length === 0 ? (
            <div className="text-center py-16 text-gray-500 rounded-2xl border border-dashed border-white/10">
              <Fish className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No catches logged yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {wallItems
                .filter((i) => i.kind === 'catch')
                .map((item) => (
                  <Link key={item.item_id} href={`/catches/${item.item_id}`} className="relative aspect-square group overflow-hidden rounded-lg bg-white/5">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Fish className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                  </Link>
                ))}
            </div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div>
          {!wallItems || wallItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500 rounded-2xl border border-dashed border-white/10">
              <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No public activity yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {wallItems.map((item) => (
                <li key={`${item.kind}-${item.item_id}`}>
                  <WallItem item={item} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

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
