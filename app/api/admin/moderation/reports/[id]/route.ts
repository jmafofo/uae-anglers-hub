/**
 * POST /api/admin/moderation/reports/[id]
 *
 * Admin resolves a moderation report:
 *   action: 'uphold'   — soft-delete the target (sets deleted_at) and
 *                        mark the report (and all sibling reports on
 *                        the same target) as `upheld`.
 *   action: 'dismiss'  — leave target alone; if it was auto-hidden,
 *                        restore it. Marks the report as `dismissed`.
 *
 * Body (JSON):
 *   action  'uphold' | 'dismiss'   required
 *   reason? string                  optional moderator note
 *
 * Auth: Bearer token + profiles.is_admin must be true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

const ACTIONS = ['uphold', 'dismiss'] as const;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const { id: reportId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(reportId)) {
    return NextResponse.json({ error: 'invalid report id' }, { status: 400 });
  }

  let body: { action?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (typeof body.action !== 'string' || !(ACTIONS as readonly string[]).includes(body.action)) {
    return NextResponse.json({ error: `action must be one of ${ACTIONS.join(', ')}` }, { status: 400 });
  }
  const reasonText = typeof body.reason === 'string' ? body.reason.slice(0, 500) : null;

  // Use the admin client for cross-user writes (soft-deleting someone
  // else's content, marking sibling reports).
  const admin = getSupabaseAdmin();

  const { data: report, error: fetchErr } = await admin
    .from('moderation_reports')
    .select('id, target_type, target_id, status')
    .eq('id', reportId)
    .single();
  if (fetchErr || !report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  if (report.status !== 'pending') {
    return NextResponse.json({ error: `Report already ${report.status}` }, { status: 409 });
  }

  const now = new Date().toISOString();
  const table = report.target_type === 'thread' ? 'forum_threads' : 'forum_replies';

  if (body.action === 'uphold') {
    // Soft-delete the target
    const { error: delErr } = await admin
      .from(table)
      .update({
        deleted_at:     now,
        deleted_by:     auth.user.id,
        deleted_reason: reasonText ?? 'Removed by moderator',
      })
      .eq('id', report.target_id);
    if (delErr) {
      console.error('[admin/moderation resolve uphold]', delErr);
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    // Mark all sibling pending reports as upheld too
    const { error: siblingErr } = await admin
      .from('moderation_reports')
      .update({ status: 'upheld', resolved_by: auth.user.id, resolved_at: now })
      .eq('target_type', report.target_type)
      .eq('target_id',   report.target_id)
      .eq('status',      'pending');
    if (siblingErr) {
      console.warn('[admin/moderation resolve uphold siblings]', siblingErr);
    }
  } else {
    // Dismiss: restore target if it was auto-hidden, mark this report dismissed.
    const { data: target } = await admin
      .from(table)
      .select('deleted_at, deleted_reason')
      .eq('id', report.target_id)
      .single();
    const wasAutoHidden = target?.deleted_reason?.startsWith('Auto-hidden after');
    if (wasAutoHidden) {
      const { error: restoreErr } = await admin
        .from(table)
        .update({ deleted_at: null, deleted_by: null, deleted_reason: null })
        .eq('id', report.target_id);
      if (restoreErr) {
        console.warn('[admin/moderation resolve dismiss restore]', restoreErr);
      }
    }
    const { error: updErr } = await admin
      .from('moderation_reports')
      .update({ status: 'dismissed', resolved_by: auth.user.id, resolved_at: now })
      .eq('id', reportId);
    if (updErr) {
      console.error('[admin/moderation resolve dismiss]', updErr);
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
