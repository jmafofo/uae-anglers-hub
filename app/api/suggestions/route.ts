/**
 * GET  /api/suggestions?status=&category=&sort=&limit=
 * POST /api/suggestions
 *
 * Public feedback board.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const VALID_STATUS = ['pending', 'under_review', 'planned', 'implemented', 'declined'];
const VALID_CATEGORY = ['feature', 'bug', 'improvement', 'content', 'other'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') ?? 'votes'; // votes | newest
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

  const admin = getSupabaseAdmin();
  let q = admin
    .from('suggestions')
    .select('id, user_id, title, body, category, status, votes, created_at, profiles(id, username, display_name, avatar_url)')
    .limit(limit);

  if (status && VALID_STATUS.includes(status)) {
    q = q.eq('status', status);
  }
  if (category && VALID_CATEGORY.includes(category)) {
    q = q.eq('category', category);
  }
  if (sort === 'newest') {
    q = q.order('created_at', { ascending: false });
  } else {
    q = q.order('votes', { ascending: false });
  }

  const { data, error } = await q;
  if (error) {
    console.error('[suggestions] list', error);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }

  // Get current user's votes if authenticated (so UI can show "you voted")
  let myVotes: string[] = [];
  const auth = await requireAuthUniversal(req);
  if (auth.ok && auth.user) {
    const { data: votes } = await admin
      .from('suggestion_votes')
      .select('suggestion_id')
      .eq('user_id', auth.user.id);
    myVotes = (votes ?? []).map((v: { suggestion_id: string }) => v.suggestion_id);
  }

  return NextResponse.json({ suggestions: data ?? [], myVotes });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) {
    console.error('[suggestions] auth failed', auth);
    return auth.response;
  }

  const payload = await req.json().catch(() => ({}));
  const title = String(payload.title ?? '').trim();
  const text = String(payload.body ?? '').trim() || null;
  const category = VALID_CATEGORY.includes(payload.category) ? payload.category : 'feature';

  if (!title || title.length < 5 || title.length > 200) {
    return NextResponse.json({ error: 'Title must be 5–200 characters' }, { status: 400 });
  }
  if (text && text.length > 2000) {
    return NextResponse.json({ error: 'Description max 2000 characters' }, { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();

    // Verify table exists first
    const { error: probeErr } = await admin.from('suggestions').select('id', { head: true }).limit(1);
    if (probeErr && probeErr.message.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Database table "suggestions" does not exist. Please run the SQL migration in Supabase Dashboard → SQL Editor.' },
        { status: 500 }
      );
    }

    const { error } = await admin
      .from('suggestions')
      .insert({ user_id: auth.user.id, title, body: text, category });

    if (error) {
      console.error('[suggestions] create', JSON.stringify(error));
      return NextResponse.json(
        { error: error.message, code: error.code, hint: error.hint, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[suggestions] create exception', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error', raw: String(err) },
      { status: 500 }
    );
  }
}
