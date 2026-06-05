/**
 * POST /api/push/register
 *   Body: { expoPushToken: string, platform?: string }
 *   Saves (or re-assigns) an Expo push token for the authenticated user.
 *
 * DELETE /api/push/register
 *   Body: { expoPushToken?: string }
 *   Deletes the caller's push token. If expoPushToken is omitted,
 *   all tokens for the user are removed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { expoPushToken?: unknown; platform?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const expoPushToken =
    typeof body.expoPushToken === 'string' ? body.expoPushToken.trim() : '';
  const platform =
    typeof body.platform === 'string' ? body.platform.trim().toLowerCase() : null;

  if (!expoPushToken || !expoPushToken.startsWith('ExponentPushToken')) {
    return NextResponse.json(
      { error: 'Valid expoPushToken is required' },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // Upsert with service role so we can re-assign a token that previously
  // belonged to a different user (e.g. after logout / login).
  const { error } = await admin.from('push_tokens').upsert(
    {
      user_id: auth.user.id,
      expo_push_token: expoPushToken,
      platform,
    },
    { onConflict: 'expo_push_token' }
  );

  if (error) {
    console.error('[push/register POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthUniversal(req);
  if (!auth.ok) return auth.response;

  let body: { expoPushToken?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional for DELETE
  }

  const expoPushToken =
    typeof body.expoPushToken === 'string' ? body.expoPushToken.trim() : null;

  const admin = getSupabaseAdmin();

  let query = admin.from('push_tokens').delete().eq('user_id', auth.user.id);
  if (expoPushToken) {
    query = query.eq('expo_push_token', expoPushToken);
  }

  const { error } = await query;

  if (error) {
    console.error('[push/register DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
