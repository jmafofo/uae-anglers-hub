/**
 * GET /api/suggestions/debug
 *
 * Diagnostic endpoint — checks if the suggestions table exists,
 * counts rows, and shows the most recent entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(_req: NextRequest) {
  const admin = getSupabaseAdmin();

  // 1. Check if table exists
  const { data: tableInfo, error: tableErr } = await admin
    .from('suggestions')
    .select('id', { head: true })
    .limit(1);

  if (tableErr) {
    return NextResponse.json({
      tableExists: false,
      error: tableErr.message,
      code: tableErr.code,
    });
  }

  // 2. Count rows
  const { data: countData, error: countErr } = await admin
    .from('suggestions')
    .select('id', { count: 'exact', head: true });

  const count = countData?.length ?? 0;
  if (countErr) {
    return NextResponse.json({
      tableExists: true,
      countError: countErr.message,
      rows: [],
    });
  }

  // 3. Get latest 5 rows
  const { data: rows } = await admin
    .from('suggestions')
    .select('id, user_id, title, category, status, votes, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  return NextResponse.json({
    tableExists: true,
    count,
    rows: rows ?? [],
  });
}
