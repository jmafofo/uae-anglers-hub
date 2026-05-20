/**
 * GET /api/admin/moderation/reports
 *
 * List moderation reports for the admin triage dashboard. Joins
 * the underlying thread/reply so the admin sees what was reported
 * without N+1 lookups.
 *
 * Query params:
 *   status?  'pending' | 'upheld' | 'dismissed'   default 'pending'
 *   limit?   number  default 50, max 200
 *   offset?  number  default 0
 *
 * Auth: Bearer token + profiles.is_admin must be true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

const STATUSES = ['pending', 'upheld', 'dismissed'] as const;

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const sb = getUserSupabase(auth.token);
  const { data: me } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? 'pending';
  if (!(STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 });
  }
  const limit  = Math.min(200, Math.max(1, Number(searchParams.get('limit')  ?? 50)));
  const offset = Math.max(0, Number(searchParams.get('offset') ?? 0));

  // Two passes — one for thread targets, one for reply targets — so
  // we can return the underlying body alongside each report. RLS
  // already restricts visibility (admin sees all); the foreign-table
  // join uses the same RLS path.
  const { data: reports, error } = await sb
    .from('moderation_reports')
    .select(`
      id, target_type, target_id, category, reason, status, created_at, resolved_at,
      reporter:profiles!moderation_reports_reporter_id_fkey(username, display_name)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[admin/moderation/reports GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch the target bodies in two batched queries.
  const threadIds = (reports ?? []).filter((r) => r.target_type === 'thread').map((r) => r.target_id);
  const replyIds  = (reports ?? []).filter((r) => r.target_type === 'reply').map((r) => r.target_id);

  const [threadsRes, repliesRes] = await Promise.all([
    threadIds.length
      ? sb.from('forum_threads')
          .select('id, title, body, user_id, deleted_at, profiles(username, display_name)')
          .in('id', threadIds)
      : Promise.resolve({ data: [], error: null }),
    replyIds.length
      ? sb.from('forum_replies')
          .select('id, body, thread_id, user_id, deleted_at, profiles(username, display_name)')
          .in('id', replyIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (threadsRes.error) console.error('[admin/moderation/reports threads]', threadsRes.error);
  if (repliesRes.error) console.error('[admin/moderation/reports replies]', repliesRes.error);

  type ThreadRow = { id: string };
  type ReplyRow  = { id: string };
  const threadMap = new Map((threadsRes.data ?? []).map((t) => [(t as ThreadRow).id, t]));
  const replyMap  = new Map((repliesRes.data ?? []).map((r) => [(r as ReplyRow).id, r]));

  const enriched = (reports ?? []).map((r) => ({
    ...r,
    target: r.target_type === 'thread' ? threadMap.get(r.target_id) ?? null : replyMap.get(r.target_id) ?? null,
  }));

  return NextResponse.json({ reports: enriched });
}
