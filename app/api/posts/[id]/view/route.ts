import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUniversal } from '@/lib/api-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { createHash } from 'crypto';

/**
 * POST /api/posts/:id/view
 * Track a view. Debounced: one per user per post per day.
 * For anonymous viewers, uses a hashed IP.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthUniversal(req);
  const userId = auth.ok ? auth.user.id : null;
  const { id } = await params;

  const admin = getSupabaseAdmin();

  if (userId) {
    // Check if already viewed today by this user
    const { data: existing } = await admin
      .from('post_views')
      .select('created_at')
      .eq('post_id', id)
      .eq('viewer_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ tracked: false });
    }

    const { error } = await admin
      .from('post_views')
      .insert({ post_id: id, viewer_id: userId });

    if (error) {
      return NextResponse.json({ tracked: false });
    }
  } else {
    // Anonymous: hash the IP
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex');

    const { data: existing } = await admin
      .from('post_views')
      .select('created_at')
      .eq('post_id', id)
      .eq('ip_hash', ipHash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ tracked: false });
    }

    const { error } = await admin
      .from('post_views')
      .insert({ post_id: id, ip_hash: ipHash });

    if (error) {
      return NextResponse.json({ tracked: false });
    }
  }

  return NextResponse.json({ tracked: true });
}
