/**
 * POST /api/forum/report
 *
 * File a moderation report against a thread or reply. Auto-hide
 * after 3 distinct reporters happens in a DB trigger; the route
 * just records the report.
 *
 * Body (JSON):
 *   target_type  'thread' | 'reply'                                       required
 *   target_id    uuid                                                     required
 *   category     'spam' | 'abuse' | 'wrong_category' | 'misinformation' | 'other'
 *                                                                        required
 *   reason?      string  ≤500 chars                                       optional
 *
 * Auth: Bearer token required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';

const TARGETS    = ['thread', 'reply'] as const;
const CATEGORIES = ['spam', 'abuse', 'wrong_category', 'misinformation', 'other'] as const;
const REASON_MAX = 500;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: { target_type?: unknown; target_id?: unknown; category?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (typeof body.target_type !== 'string' || !(TARGETS as readonly string[]).includes(body.target_type)) {
    return NextResponse.json({ error: `target_type must be one of ${TARGETS.join(', ')}` }, { status: 400 });
  }
  if (typeof body.target_id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.target_id)) {
    return NextResponse.json({ error: 'target_id must be a uuid' }, { status: 400 });
  }
  if (typeof body.category !== 'string' || !(CATEGORIES as readonly string[]).includes(body.category)) {
    return NextResponse.json({ error: `category must be one of ${CATEGORIES.join(', ')}` }, { status: 400 });
  }
  let reason: string | null = null;
  if (body.reason !== undefined && body.reason !== null) {
    if (typeof body.reason !== 'string') {
      return NextResponse.json({ error: 'reason must be a string' }, { status: 400 });
    }
    if (body.reason.length > REASON_MAX) {
      return NextResponse.json({ error: `reason exceeds ${REASON_MAX} chars` }, { status: 400 });
    }
    reason = body.reason.trim() || null;
  }

  const sb = getUserSupabase(auth.token);
  const { data, error } = await sb
    .from('moderation_reports')
    .insert({
      reporter_id: auth.user.id,
      target_type: body.target_type,
      target_id:   body.target_id,
      category:    body.category,
      reason,
    })
    .select('id, status')
    .single();

  if (error) {
    // Duplicate report (already reported this target)
    if (error.code === '23505') {
      return NextResponse.json({ error: "You've already reported this — thanks." }, { status: 409 });
    }
    // Throttle (BEFORE INSERT trigger raised check_violation)
    if (error.message?.includes('Daily report limit reached')) {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    console.error('[forum/report]', error);
    return NextResponse.json({ error: error.message || 'Could not file report' }, { status: 500 });
  }

  return NextResponse.json({ report: data }, { status: 201 });
}
