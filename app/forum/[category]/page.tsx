import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `UAE Fishing Forum — ${category.replace(/-/g, ' ')}`,
  };
}

export const revalidate = 30;

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: cat } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!cat) notFound();

  const { data: threads } = await supabase
    .from('forum_threads')
    .select('*, profiles(display_name, username)')
    .eq('category_id', cat.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{cat.icon}</span>
            <div>
              <h1 className="text-2xl font-extrabold text-white">{cat.name}</h1>
              <p className="text-gray-400 text-sm">{cat.description}</p>
            </div>
          </div>
          <Link
            href={`/forum/new?category=${cat.id}`}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        </div>

        <div className="space-y-3">
          {(threads ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/forum/thread/${t.id}`}
              className="group flex items-start gap-4 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {t.is_pinned && (
                    <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full">
                      Pinned
                    </span>
                  )}
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                    {t.title}
                  </h2>
                </div>
                <p className="text-gray-500 text-sm truncate">{t.body.slice(0, 100)}...</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                  <span>by {(t.profiles as { display_name: string })?.display_name}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.updated_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {t.reply_count}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> {t.upvotes}
                </span>
              </div>
            </Link>
          ))}

          {(!threads || threads.length === 0) && (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-4">No threads yet. Start the conversation!</p>
              <Link href={`/forum/new?category=${cat.id}`} className="text-teal-400 hover:underline text-sm">
                Post the first thread
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
