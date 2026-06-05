/**
 * POST /api/push/deliver
 *
 * Internal webhook called by the database trigger (via pg_net)
 * whenever a notification row is inserted.
 *
 * Expects:
 *   Header: X-Push-Webhook-Secret  (must match PUSH_WEBHOOK_SECRET env var)
 *   Body:   { userId: string, title: string, body?: string, data?: object }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { sendPushNotifications } from '@/lib/push';

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get('x-push-webhook-secret');
  if (!secret || secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    userId?: string;
    title?: string;
    body?: string;
    data?: object;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { userId, title, body: pushBody, data } = body;
  if (!userId || !title) {
    return NextResponse.json(
      { error: 'userId and title are required' },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from('push_tokens')
    .select('expo_push_token')
    .eq('user_id', userId);

  if (error) {
    console.error('[push/deliver] DB error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const tokens = rows.map((r) => r.expo_push_token);
  await sendPushNotifications(tokens, title, pushBody ?? '', data);

  return NextResponse.json({ success: true, sent: tokens.length });
}
