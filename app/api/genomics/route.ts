/**
 * GET /api/genomics
 *
 * Returns published genome assemblies and approved DNA barcodes for the
 * Earth BioGenome browser page.
 *
 * Query params:
 *   type?     'assemblies' | 'barcodes' | 'all'  default 'all'
 *   habitat?  Reef | Pelagic | Demersal | Coastal | Open Ocean
 *   coast?    Persian Gulf | Gulf of Oman | Both
 *   search?   partial species name
 *
 * No auth required — public data only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !svcKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const sb = createClient(url, svcKey);
  const { searchParams } = new URL(req.url);

  const type    = searchParams.get('type')    ?? 'all';
  const habitat = searchParams.get('habitat');
  const coast   = searchParams.get('coast');
  const search  = searchParams.get('search');

  const results: Record<string, unknown> = {};

  // ── Genome assemblies ────────────────────────────────────────
  if (type === 'all' || type === 'assemblies') {
    let q = sb
      .from('genome_assemblies')
      .select('*')
      .eq('status', 'published')
      .order('species_name');

    if (habitat) q = q.eq('habitat_category', habitat);
    if (coast)   q = q.or(`coast.eq.${coast},coast.eq.Both`);
    if (search)  q = q.ilike('species_name', `%${search}%`);

    const { data, error } = await q;
    if (error) console.error('[genomics] assemblies error:', error);
    results.assemblies = data ?? [];
  }

  // ── DNA barcodes ─────────────────────────────────────────────
  if (type === 'all' || type === 'barcodes') {
    let q = sb
      .from('dna_barcodes')
      .select('id, species_name, scientific_name, family, habitat_category, coast, marker_type, sequence_length, genbank_accession, collection_location, collection_date, source, status')
      .in('status', ['approved', 'published'])
      .order('species_name');

    if (habitat) q = q.eq('habitat_category', habitat);
    if (search)  q = q.ilike('species_name', `%${search}%`);

    const { data, error } = await q;
    if (error) console.error('[genomics] barcodes error:', error);
    results.barcodes = data ?? [];
  }

  // ── Summary stats ─────────────────────────────────────────────
  if (type === 'all') {
    const [{ count: assemblyCount }, { count: barcodeCount }] = await Promise.all([
      sb.from('genome_assemblies').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      sb.from('dna_barcodes').select('*', { count: 'exact', head: true }).in('status', ['approved', 'published']),
    ]);
    results.stats = {
      assemblies:  assemblyCount  ?? 0,
      barcodes:    barcodeCount   ?? 0,
    };
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
  });
}
