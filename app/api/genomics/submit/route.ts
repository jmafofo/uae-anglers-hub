/**
 * POST /api/genomics/submit
 *
 * Accept a community genomic sample submission.
 * Saves to genomics_submissions for curator review.
 * Auth optional — email is collected for follow-up.
 *
 * Body (JSON):
 *   submitter_name   string   required
 *   submitter_email  string   required
 *   institution?     string
 *   species_name     string   required
 *   scientific_name? string
 *   sample_type      string   required (tissue|eDNA|blood|scale|fin_clip|water)
 *   tissue_type?     string
 *   preservation?    string
 *   collection_location? string
 *   latitude?        number
 *   longitude?       number
 *   collection_date? string   ISO date
 *   depth_m?         number
 *   habitat_description? string
 *   data_type        string[] required  (whole_genome|barcode|SNP_panel|transcriptome)
 *   sequencing_platform? string
 *   coverage_depth?  string
 *   sequence?        string   (for direct barcode paste)
 *   marker_type?     string   (COI|16S|12S|cytb)
 *   notes?           string
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !svcKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Required field validation
  const required = ['submitter_name', 'submitter_email', 'species_name', 'sample_type', 'data_type'];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(body.submitter_email as string)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const sb = createClient(url, svcKey);

  // If a barcode sequence was pasted, insert directly into dna_barcodes (pending review)
  if (body.sequence && body.marker_type) {
    const seq = (body.sequence as string).replace(/\s+/g, '').toUpperCase();
    if (!/^[ATCGNRYWSKMBDHV]+$/i.test(seq)) {
      return NextResponse.json({ error: 'Sequence contains invalid characters' }, { status: 400 });
    }

    await sb.from('dna_barcodes').insert({
      species_name:        body.species_name,
      scientific_name:     body.scientific_name ?? null,
      marker_type:         body.marker_type,
      sequence:            seq,
      collection_location: body.collection_location ?? null,
      latitude:            body.latitude ?? null,
      longitude:           body.longitude ?? null,
      collection_date:     body.collection_date ?? null,
      depth_m:             body.depth_m ?? null,
      source:              'community',
      status:              'pending',
    });
  }

  // Always create a submission record for curator review
  const { data, error } = await sb
    .from('genomics_submissions')
    .insert({
      submitter_name:       body.submitter_name,
      submitter_email:      body.submitter_email,
      institution:          body.institution ?? null,
      species_name:         body.species_name,
      scientific_name:      body.scientific_name ?? null,
      sample_type:          body.sample_type,
      tissue_type:          body.tissue_type ?? null,
      preservation:         body.preservation ?? null,
      collection_location:  body.collection_location ?? null,
      latitude:             body.latitude ?? null,
      longitude:            body.longitude ?? null,
      collection_date:      body.collection_date ?? null,
      depth_m:              body.depth_m ?? null,
      habitat_description:  body.habitat_description ?? null,
      data_type:            body.data_type,
      sequencing_platform:  body.sequencing_platform ?? null,
      coverage_depth:       body.coverage_depth ?? null,
      metadata:             body.notes ? { notes: body.notes } : {},
      status:               'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[genomics/submit]', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, submission_id: data.id },
    { status: 201 },
  );
}
