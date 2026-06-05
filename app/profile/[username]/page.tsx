import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import OnlineDot from '@/components/OnlineDot';
import FollowButton from '@/components/FollowButton';
import ProfileTabs from '@/components/posts/ProfileTabs';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

  // Posts
  const admin = getSupabaseAdmin();
  const { data: posts } = await admin
    .from('posts')
    .select('id, caption, created_at, likes_count:post_likes(count), comments_count:post_comments(count), media:post_media(media_url, media_type)')
    .eq('user_id', profile.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Activity wall
  const { data: wallItems } = await supabase
    .from('profile_wall')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const joinedYear = new Date(profile.created_at).getFullYear();

  // Follower / following counts
  const { count: followerCount } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id);
  const { count: followingCount } = await admin
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id);

  // Social links
  const socials = [
    { key: 'instagram_handle' as const, label: 'Instagram', url: (v: string) => `https://instagram.com/${v}` },
    { key: 'tiktok_handle' as const, label: 'TikTok', url: (v: string) => `https://tiktok.com/@${v}` },
    { key: 'youtube_channel' as const, label: 'YouTube', url: (v: string) => v.startsWith('http') ? v : `https://youtube.com/@${v}` },
    { key: 'facebook_page' as const, label: 'Facebook', url: (v: string) => v.startsWith('http') ? v : `https://facebook.com/${v}` },
  ];

  const postItems = (posts ?? []).map((p: any) => ({
    id: p.id,
    caption: p.caption,
    created_at: p.created_at,
    likes_count: p.likes_count?.[0]?.count ?? 0,
    comments_count: p.comments_count?.[0]?.count ?? 0,
    has_liked: false,
    media: p.media ?? [],
    profile: {
      username: profile.username,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
    },
  }));

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        {/* ── Instagram-style header ───────────────────────── */}
        <div className="flex items-start gap-5 mb-8">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-teal-600 flex items-center justify-center text-white text-3xl sm:text-4xl font-bold overflow-hidden ring-2 ring-teal-500/30">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                profile.display_name?.[0]?.toUpperCase() ?? '?'
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">{profile.display_name}</h1>
              <OnlineDot userId={profile.id} />
            </div>
            <p className="text-gray-400 text-sm mb-4">@{profile.username}</p>

            {/* Stats row */}
            <div className="flex items-center gap-6 mb-4">
              <div className="text-center">
                <span className="block text-base sm:text-lg font-bold text-white">{postItems.length}</span>
                <span className="text-xs text-gray-500">posts</span>
              </div>
              <div className="text-center">
                <span className="block text-base sm:text-lg font-bold text-white">{followerCount ?? 0}</span>
                <span className="text-xs text-gray-500">followers</span>
              </div>
              <div className="text-center">
                <span className="block text-base sm:text-lg font-bold text-white">{followingCount ?? 0}</span>
                <span className="text-xs text-gray-500">following</span>
              </div>
              <div className="text-center">
                <span className="block text-base sm:text-lg font-bold text-teal-400">{profile.total_catches ?? 0}</span>
                <span className="text-xs text-gray-500">catches</span>
              </div>
            </div>

            {/* Bio + Meta */}
            {profile.bio && (
              <p className="text-sm text-gray-300 mb-2 leading-relaxed">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
              {profile.emirate && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {profile.emirate}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Member since {joinedYear}
              </span>
            </div>

            {/* Social links */}
            {socials.some((s) => !!profile[s.key]) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {socials
                  .filter((s) => !!profile[s.key])
                  .map((s) => (
                    <a
                      key={s.key}
                      href={s.url(profile[s.key])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors bg-teal-500/10 px-2.5 py-1 rounded-full"
                    >
                      {s.label}
                    </a>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <FollowButton userId={profile.id} username={profile.username} />
              {profile.dm_policy !== 'closed' && (
                <Link
                  href={`/community/messages?to=${profile.username}`}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Message
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────── */}
        <ProfileTabs
          profile={profile}
          posts={postItems}
          wallItems={(wallItems ?? []) as any[]}
        />

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
