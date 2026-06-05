import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/clubs
 * List clubs. Returns:
 * - "my" clubs the user is a member of (if authenticated)
 * - "public" clubs anyone can browse
 */
export async function GET(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  const userId = auth.ok ? auth.user.id : null;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter'); // 'my' | 'public'

  const admin = getSupabaseAdmin();

  let query = admin
    .from('clubs')
    .select('*, profiles!inner(display_name, username, avatar_url)')
    .order('created_at', { ascending: false });

  if (filter === 'my' && userId) {
    // Clubs the user is a member of
    const { data: memberships } = await admin
      .from('club_members')
      .select('club_id')
      .eq('user_id', userId)
      .eq('status', 'active');

    const clubIds = (memberships ?? []).map((m) => m.club_id);
    if (clubIds.length === 0) {
      return NextResponse.json({ clubs: [] });
    }
    query = query.in('id', clubIds);
  } else {
    // Default: public clubs only
    query = query.eq('visibility', 'public');
  }

  const { data, error } = await query;

  if (error) {
    console.error('[clubs] list', error);
    return NextResponse.json({ error: 'Failed to load clubs' }, { status: 500 });
  }

  const clubs = (data ?? []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    logo_url: c.logo_url,
    visibility: c.visibility,
    member_count: c.member_count,
    created_at: c.created_at,
    created_by: {
      id: c.created_by,
      display_name: c.profiles?.display_name,
      username: c.profiles?.username,
      avatar_url: c.profiles?.avatar_url,
    },
  }));

  return NextResponse.json({ clubs });
}

/**
 * POST /api/clubs
 * Create a new private club. The creator becomes owner.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim();
  const description = String(body.description ?? '').trim() || null;
  const logoUrl = body.logo_url ? String(body.logo_url) : null;

  if (!name || name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: 'Club name must be 2–80 characters' }, { status: 400 });
  }

  // Generate slug from name
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const admin = getSupabaseAdmin();

  // Check for slug collision and append random suffix if needed
  let slug = baseSlug;
  let attempts = 0;
  while (attempts < 10) {
    const { data } = await admin.from('clubs').select('id').eq('slug', slug).maybeSingle();
    if (!data) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    attempts++;
  }

  // Create club
  const { data: club, error: clubErr } = await admin
    .from('clubs')
    .insert({
      slug,
      name,
      description,
      logo_url: logoUrl,
      created_by: auth.user.id,
      visibility: 'private',
    })
    .select('*')
    .single();

  if (clubErr || !club) {
    console.error('[clubs] create', clubErr);
    return NextResponse.json({ error: 'Failed to create club' }, { status: 500 });
  }

  // Add creator as owner
  const { error: memberErr } = await admin.from('club_members').insert({
    club_id: club.id,
    user_id: auth.user.id,
    role: 'owner',
    status: 'active',
    invited_by: auth.user.id,
  });

  if (memberErr) {
    console.error('[clubs] creator membership', memberErr);
    // Rollback
    await admin.from('clubs').delete().eq('id', club.id);
    return NextResponse.json({ error: 'Failed to set up club membership' }, { status: 500 });
  }

  return NextResponse.json({ club }, { status: 201 });
}
