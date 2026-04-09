import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export const revalidate = 3600; // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('species_research')
    .select('*')
    .eq('species_slug', slug)
    .order('year', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ papers: data ?? [] });
}
