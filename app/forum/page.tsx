import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageSquare, Plus, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export const metadata: Metadata = {
  title: 'UAE Fishing Forum — Tips, Spots & Community Discussion',
  description:
    'Join the UAE Anglers Hub forum. Discuss fishing spots, share catch reports, gear reviews, tournament news and UAE fishing regulations.',
};

export const revalidate = 60;

export default async function ForumPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: categories } = await supabase
    .from('forum_categories')
    .select('*')
    .order('created_at');

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Community Forum</h1>
            <p className="text-gray-400">Discuss spots, share catches, ask questions</p>
          </div>
          <Link
            href="/forum/new"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        </div>

        <div className="space-y-3">
          {(categories ?? []).map((cat) => (
            <Link
              key={cat.id}
              href={`/forum/${cat.slug}`}
              className="group flex items-center gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
            >
              <div className="text-3xl w-12 text-center shrink-0">{cat.icon}</div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors">
                  {cat.name}
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">{cat.description}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-white font-semibold">{cat.thread_count}</div>
                <div className="text-gray-600 text-xs">threads</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>

        {(!categories || categories.length === 0) && (
          <div className="text-center py-16 text-gray-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Forum is being set up. Run the schema in Supabase first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
