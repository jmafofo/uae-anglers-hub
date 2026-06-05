'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Anchor, Users, Settings, Calendar, MapPin,
  UserPlus, Check, X, CircleDot, Circle,
} from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

interface Club {
  id: string; slug: string; name: string; description: string | null;
  logo_url: string | null; visibility: string; member_count: number;
  created_at: string; created_by: { id: string; display_name: string; username: string; avatar_url: string | null };
}

interface Member {
  id: string; display_name: string; username: string; avatar_url: string | null;
  role: string; joined_at: string;
}

interface TripPost {
  id: string; trip_id: string; user_id: string; caption: string | null;
  created_at: string; profile: { id: string; display_name: string; username: string; avatar_url: string | null };
  media: { media_url: string; media_type: string }[];
  likes_count: number; comments_count: number; has_liked: boolean;
  trip: {
    destination: string; country: string; start_date: string | null; end_date: string | null;
    max_participants: number | null; price_estimate: string | null;
    status: string; rsvp_count: number; my_rsvp: string | null;
  };
}

export default function ClubDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<TripPost[]>([]);
  const [me, setMe] = useState<{ role: string | null; status: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    load();
  }, [slug]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/clubs/${slug}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load club');
        setLoading(false);
        return;
      }
      setClub(data.club);
      setMembers(data.members ?? []);
      setMe(data.me);

      // Load posts
      const postsRes = await fetch(`/api/clubs/${slug}/posts`);
      const postsData = await postsRes.json();
      if (postsRes.ok) {
        setPosts(postsData.posts ?? []);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  }

  async function handleRsvp(tripId: string, status: 'interested' | 'confirmed' | 'declined') {
    setRsvpLoading((prev) => ({ ...prev, [tripId]: true }));
    try {
      const res = await fetch(`/api/trips/${tripId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.trip_id === tripId
              ? { ...p, trip: { ...p.trip, my_rsvp: status, rsvp_count: status !== 'declined' ? p.trip.rsvp_count + (p.trip.my_rsvp ? 0 : 1) : Math.max(0, p.trip.rsvp_count - 1) } }
              : p
          )
        );
      }
    } catch {
      // ignore
    }
    setRsvpLoading((prev) => ({ ...prev, [tripId]: false }));
  }

  async function handleJoin() {
    try {
      const res = await fetch(`/api/clubs/${slug}/join`, { method: 'POST' });
      if (res.ok) {
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to join');
      }
    } catch {
      setError('Network error');
    }
  }

  if (loading) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading club...</div>;
  if (error && !club) return <div className="min-h-screen pt-20 flex items-center justify-center text-red-400">{error}</div>;
  if (!club) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Club not found.</div>;

  const isMember = me?.status === 'active';
  const isOwner = me?.role === 'owner';
  const isAdmin = me?.role === 'admin' || isOwner;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/clubs" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Clubs
        </Link>

        {/* Club Header */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              {club.logo_url ? (
                <img src={club.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Anchor className="w-7 h-7 text-teal-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold text-white">{club.name}</h1>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {club.member_count} member{club.member_count !== 1 ? 's' : ''}
                    </span>
                    <span className="capitalize">{club.visibility}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isAdmin && (
                    <Link
                      href={`/clubs/${club.slug}/settings`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-teal-500/40 text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Link>
                  )}
                </div>
              </div>
              {club.description && (
                <p className="text-gray-300 text-sm mt-3 leading-relaxed">{club.description}</p>
              )}

              {/* Join/Invite status */}
              {!isMember && me?.status === 'invited' && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleJoin}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Accept Invite
                  </button>
                </div>
              )}
              {!isMember && !me && (
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400">
                  This is a private club. You need an invite to join.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-3">Members</h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <Link
                key={m.id}
                href={`/profile/${m.username}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal-500/40 transition-colors"
              >
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center text-[10px] text-teal-400 font-bold">
                    {(m.display_name || m.username)?.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-300">{m.display_name || m.username}</span>
                {m.role !== 'member' && (
                  <span className="text-[10px] uppercase tracking-wider text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                    {m.role}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Trip Posts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Trips</h2>
            {isMember && (
              <button
                onClick={() => router.push(`/feed?create=trip&club=${club.id}`)}
                className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Plan a trip
              </button>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-white/5 border border-white/10">
              <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No trips planned yet.</p>
              {isMember && (
                <p className="text-gray-600 text-xs mt-1">Create a post to plan your first trip.</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/30 transition-all">
                  {/* Post header */}
                  <div className="flex items-center gap-3 mb-3">
                    {post.profile?.avatar_url ? (
                      <img src={post.profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-xs text-teal-400 font-bold">
                        {(post.profile?.display_name || post.profile?.username)?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <Link href={`/profile/${post.profile?.username}`} className="text-sm font-medium text-white hover:text-teal-400 transition-colors">
                        {post.profile?.display_name || post.profile?.username}
                      </Link>
                      <p className="text-xs text-gray-600">{new Date(post.created_at).toLocaleDateString('en-AE')}</p>
                    </div>
                  </div>

                  {/* Trip details */}
                  <div className="mb-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-white font-semibold text-sm">
                        {post.trip.destination}
                        {post.trip.country !== 'UAE' && `, ${post.trip.country}`}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        post.trip.status === 'open' ? 'bg-green-500/10 text-green-400' :
                        post.trip.status === 'full' ? 'bg-amber-500/10 text-amber-400' :
                        post.trip.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                        'bg-white/5 text-gray-500'
                      }`}>
                        {post.trip.status}
                      </span>
                    </div>
                    {(post.trip.start_date || post.trip.end_date) && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                        <Calendar className="w-3 h-3" />
                        {post.trip.start_date && new Date(post.trip.start_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                        {post.trip.start_date && post.trip.end_date && ' — '}
                        {post.trip.end_date && new Date(post.trip.end_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {post.trip.rsvp_count} going
                        {post.trip.max_participants ? ` / ${post.trip.max_participants}` : ''}
                      </span>
                      {post.trip.price_estimate && (
                        <span>{post.trip.price_estimate}</span>
                      )}
                    </div>
                  </div>

                  {/* Caption */}
                  {post.caption && (
                    <p className="text-gray-300 text-sm mb-3">{post.caption}</p>
                  )}

                  {/* RSVP buttons */}
                  {isMember && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRsvp(post.trip_id, 'confirmed')}
                        disabled={rsvpLoading[post.trip_id] || post.trip.my_rsvp === 'confirmed'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          post.trip.my_rsvp === 'confirmed'
                            ? 'bg-teal-500 text-white'
                            : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/30'
                        }`}
                      >
                        {post.trip.my_rsvp === 'confirmed' ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        Going
                      </button>
                      <button
                        onClick={() => handleRsvp(post.trip_id, 'interested')}
                        disabled={rsvpLoading[post.trip_id] || post.trip.my_rsvp === 'interested'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          post.trip.my_rsvp === 'interested'
                            ? 'bg-blue-500 text-white'
                            : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
                        }`}
                      >
                        {post.trip.my_rsvp === 'interested' ? <CircleDot className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        Interested
                      </button>
                      <button
                        onClick={() => handleRsvp(post.trip_id, 'declined')}
                        disabled={rsvpLoading[post.trip_id] || post.trip.my_rsvp === 'declined'}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          post.trip.my_rsvp === 'declined'
                            ? 'bg-gray-500 text-white'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        }`}
                      >
                        {post.trip.my_rsvp === 'declined' ? <X className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        Can&apos;t go
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
