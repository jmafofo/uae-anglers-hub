import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const LIMIT = 12;

/**
 * GET /api/posts?user_id=...&feed=following&cursor=...&limit=12
 *
 * Returns posts with media, like counts, comment counts, and whether
 * the current user has liked each post.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  const userId = auth.ok ? auth.user.id : null;

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('user_id');
  const feed = searchParams.get('feed');
  const cursor = searchParams.get('cursor');
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || LIMIT));

  const admin = getSupabaseAdmin();

  let query = admin
    .from('posts')
    .select(`
      id, user_id, caption, created_at,
      profiles!inner(id, username, display_name, avatar_url),
      post_media(id, media_url, media_type, sort_order),
      post_likes(count),
      post_comments!inner(count)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (targetUserId) {
    query = query.eq('user_id', targetUserId);
  } else if (feed === 'following' && userId) {
    // Posts from users the current user follows + own posts
    const { data: follows } = await admin
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);
    const followingIds = (follows ?? []).map((f) => f.following_id);
    followingIds.push(userId);
    query = query.in('user_id', followingIds);
  }

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[posts] list', error);
    return NextResponse.json({ error: 'Failed to load posts' }, { status: 500 });
  }

  // Check which posts the current user has liked
  let likedPostIds = new Set<string>();
  if (userId && data && data.length > 0) {
    const postIds = data.map((p: any) => p.id);
    const { data: likes } = await admin
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);
    likedPostIds = new Set((likes ?? []).map((l) => l.post_id));
  }

  const posts = (data ?? []).map((p: any) => ({
    id: p.id,
    user_id: p.user_id,
    caption: p.caption,
    created_at: p.created_at,
    profile: p.profiles,
    media: (p.post_media ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    likes_count: p.post_likes?.[0]?.count ?? 0,
    comments_count: p.post_comments?.[0]?.count ?? 0,
    has_liked: likedPostIds.has(p.id),
  }));

  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  return NextResponse.json({ posts, nextCursor });
}

/**
 * POST /api/posts
 * Create a new post with optional media URLs.
 * If trip metadata is provided, also creates a trip_post linked to a club.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  const body = await req.json().catch(() => ({}));
  const { caption, media, trip } = body;

  if (!media || !Array.isArray(media) || media.length === 0) {
    return NextResponse.json({ error: 'At least one media item is required' }, { status: 400 });
  }
  if (media.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 media items per post' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Validate trip metadata if provided
  let clubId: string | null = null;
  if (trip) {
    if (!trip.club_id || !trip.destination) {
      return NextResponse.json({ error: 'Trip posts require club_id and destination' }, { status: 400 });
    }
    clubId = String(trip.club_id);

    // Verify user is an active member of the club
    const { data: membership } = await admin
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', auth.user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'You must be a club member to post trips' }, { status: 403 });
    }
  }

  // Create post
  const { data: post, error: postErr } = await admin
    .from('posts')
    .insert({ user_id: auth.user.id, caption: caption?.trim() || null })
    .select('id')
    .single();

  if (postErr || !post) {
    console.error('[posts] create', postErr);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }

  // Insert media
  const mediaRows = media.map((m: { url: string; type?: string }, i: number) => ({
    post_id: post.id,
    media_url: m.url,
    media_type: m.type === 'video' ? 'video' : 'image',
    sort_order: i,
  }));

  const { error: mediaErr } = await admin.from('post_media').insert(mediaRows);

  if (mediaErr) {
    console.error('[posts] media insert', mediaErr);
    // Rollback
    await admin.from('posts').delete().eq('id', post.id);
    return NextResponse.json({ error: 'Failed to save media' }, { status: 500 });
  }

  // Create trip_post if trip metadata was provided
  if (clubId && trip) {
    const { error: tripErr } = await admin.from('trip_posts').insert({
      post_id: post.id,
      club_id: clubId,
      destination: String(trip.destination).trim(),
      country: String(trip.country ?? 'UAE').trim(),
      start_date: trip.start_date || null,
      end_date: trip.end_date || null,
      max_participants: trip.max_participants ? Number(trip.max_participants) : null,
      price_estimate: trip.price_estimate ? String(trip.price_estimate) : null,
    });

    if (tripErr) {
      console.error('[posts] trip insert', tripErr);
      // Rollback everything
      await admin.from('post_media').delete().eq('post_id', post.id);
      await admin.from('posts').delete().eq('id', post.id);
      return NextResponse.json({ error: 'Failed to create trip post' }, { status: 500 });
    }
  }

  return NextResponse.json({ post: { id: post.id } }, { status: 201 });
}
