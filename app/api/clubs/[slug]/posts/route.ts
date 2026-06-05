import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const LIMIT = 12;

/**
 * GET /api/clubs/:slug/posts
 * List trip posts for a club. Requires active membership.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || LIMIT));

  const admin = getSupabaseAdmin();

  // Get club
  const { data: club } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle();
  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 });
  }

  // Verify membership
  const { data: me } = await admin
    .from('club_members')
    .select('status')
    .eq('club_id', club.id)
    .eq('user_id', auth.user.id)
    .maybeSingle();

  if (!me || me.status !== 'active') {
    return NextResponse.json({ error: 'Not a member of this club' }, { status: 403 });
  }

  let query = admin
    .from('trip_posts')
    .select(`
      id, destination, country, start_date, end_date, max_participants, price_estimate, status, rsvp_count, created_at,
      posts!inner(id, user_id, caption, created_at, profiles!inner(id, username, display_name, avatar_url)),
      post_media(post_id, media_url, media_type, sort_order)
    `)
    .eq('club_id', club.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[clubs] posts', error);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }

  // Check which posts the user has liked
  const postIds = (data ?? []).map((tp: any) => tp.posts?.id).filter(Boolean);
  let likedPostIds = new Set<string>();
  if (postIds.length > 0) {
    const { data: likes } = await admin
      .from('post_likes')
      .select('post_id')
      .eq('user_id', auth.user.id)
      .in('post_id', postIds);
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
  }

  // Get user's RSVP status for each trip
  const tripIds = (data ?? []).map((tp: any) => tp.id);
  let userRsvps: Record<string, string> = {};
  if (tripIds.length > 0) {
    const { data: rsvps } = await admin
      .from('trip_rsvps')
      .select('trip_post_id, status')
      .eq('user_id', auth.user.id)
      .in('trip_post_id', tripIds);
    userRsvps = Object.fromEntries((rsvps ?? []).map((r) => [r.trip_post_id, r.status]));
  }

  const posts = (data ?? []).map((tp: any) => ({
    id: tp.posts?.id,
    trip_id: tp.id,
    user_id: tp.posts?.user_id,
    caption: tp.posts?.caption,
    created_at: tp.posts?.created_at,
    profile: tp.posts?.profiles,
    media: (tp.post_media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    likes_count: 0, // fetched separately if needed
    comments_count: 0,
    has_liked: likedPostIds.has(tp.posts?.id),
    trip: {
      destination: tp.destination,
      country: tp.country,
      start_date: tp.start_date,
      end_date: tp.end_date,
      max_participants: tp.max_participants,
      price_estimate: tp.price_estimate,
      status: tp.status,
      rsvp_count: tp.rsvp_count,
      my_rsvp: userRsvps[tp.id] || null,
    },
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  return NextResponse.json({ posts, nextCursor });
}
