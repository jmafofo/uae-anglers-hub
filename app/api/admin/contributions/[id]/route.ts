/**
 * POST /api/admin/contributions/[id]  — approve or reject a spot proposal
 *
 * Body (JSON):
 *   action       'approve' | 'reject'   required
 *   admin_notes? string                 optional
 *   slug?        string                 required for approve, unique — falls
 *                                        back to slugified name if omitted
 *
 * On approve:
 *   - inserts a new row in `spots` (verified=true)
 *   - marks the contribution approved and links approved_spot_id
 *
 * On reject:
 *   - marks the contribution rejected with admin_notes
 *
 * Approvals use the service-role client because the `spots`
 * table intentionally has no INSERT policy (see migration).
 * The caller is still authenticated + admin-checked via RLS.
 *
 * Auth: Bearer token required + profiles.is_admin.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getUserSupabase } from '@/lib/api-auth';
import { createClient } from '@supabase/supabase-js';

type Params = { params: Promise<{ id: string }> };

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const sb = getUserSupabase(auth.token);

  const { data: me } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();
  if (!me?.is_admin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = String(body.action ?? '');
  const adminNotes = body.admin_notes == null ? null : String(body.admin_notes).slice(0, 500);
  const slugOverride = body.slug == null ? null : String(body.slug).trim() || null;

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
  }

  const { data: proposal, error: fetchErr } = await sb
    .from('spot_contributions')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr || !proposal) {
    return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
  }
  if (proposal.status !== 'pending') {
    return NextResponse.json({ error: `Already ${proposal.status}` }, { status: 409 });
  }

  if (action === 'reject') {
    const { error } = await sb
      .from('spot_contributions')
      .update({
        status: 'rejected',
        admin_notes: adminNotes,
        reviewed_by: auth.user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: 'rejected' });
  }

  const slug = slugOverride ?? slugify(proposal.name);
  if (!slug) return NextResponse.json({ error: 'Could not derive slug' }, { status: 400 });

  const admin = adminSupabase();

  const { data: existing } = await admin
    .from('spots')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" already taken — pass a unique slug in the body` },
      { status: 409 },
    );
  }

  const { data: newSpot, error: insErr } = await admin
    .from('spots')
    .insert({
      slug,
      name: proposal.name,
      emirate: proposal.emirate,
      center_lat: proposal.latitude,
      center_lon: proposal.longitude,
      access_type: proposal.access_type,
      default_species: proposal.target_species ?? [],
      verified: true,
      created_by: proposal.user_id,
    })
    .select('id, slug')
    .single();
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { error: updErr } = await admin
    .from('spot_contributions')
    .update({
      status: 'approved',
      admin_notes: adminNotes,
      reviewed_by: auth.user.id,
      reviewed_at: new Date().toISOString(),
      approved_spot_id: newSpot.id,
    })
    .eq('id', id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, status: 'approved', spot: newSpot });
}
