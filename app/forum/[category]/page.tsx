import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, MessageSquare, ThumbsUp, Clock, Eye, Lock, UserCheck, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import CategorySubscribeButton from '@/components/CategorySubscribeButton';

const PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  return {
    title: `UAE Fishing Forum — ${category.replace(/-/g, ' ')}`,
  };
}

// Force fresh render on every request — otherwise a user who just
// posted a thread would land on a cached snapshot that predates
// their insert and think the thread vanished.
export const dynamic = 'force-dynamic';

const VISIBILITY_ICON: Record<string, React.ReactNode> = {
  public: <Eye className="w-3 h-3 text-gray-500" />,
  followers: <UserCheck className="w-3 h-3 text-amber-400" />,
  private: <Lock className="w-3 h-3 text-rose-400" />,
};

async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { category: slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await getSupabaseServer();

  const { data: cat } = await supabase
    .from('forum_categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!cat) notFound();

  // Auth-aware thread fetch — RLS handles visibility filtering automatically.
  // We fetch one extra row to detect whether there's a next page without
  // a separate COUNT query.
  const { data: threadsRaw, error: threadsError } = await supabase
    .from('forum_threads')
    .select('*')
    .eq('category_id', cat.id)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE);

  if (threadsError) {
    console.error('Category thread fetch error:', threadsError);
  }

  const threads = (threadsRaw ?? []).slice(0, PAGE_SIZE);
  const hasNext = (threadsRaw ?? []).length > PAGE_SIZE;
  const hasPrev = page > 1;

  // Fetch author profiles separately so a join failure doesn't hide threads
  const authorIds = [...new Set(threads.map((t) => t.user_id))];
  const { data: profilesData } = authorIds.length
    ? await supabase.from('profiles').select('id, display_name, username').in('id', authorIds)
    : { data: [] };
  const profileMap = new Map(
    (profilesData ?? []).map((p) => [p.id, p as { display_name: string; username: string }])
  );

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
          <div className="flex items-center gap-2">
            <CategorySubscribeButton categoryId={cat.id} />
            <Link
              href={`/forum/new?category=${cat.id}`}
              className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Thread
            </Link>
          </div>
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
                  <span>by {profileMap.get(t.user_id)?.display_name ?? 'Angler'}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(t.updated_at).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
                  </span>
                  {t.visibility !== 'public' && (
                    <span className="flex items-center gap-1 capitalize">
                      {VISIBILITY_ICON[t.visibility]}
                      {t.visibility}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> {t.reply_count}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> {t.upvotes}
                </span>
                <span className="flex items-center gap-1 text-teal-400 group-hover:text-teal-300 transition-colors mt-1">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}

          {(!threads || threads.length === 0) && (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-4">{page > 1 ? 'No more threads on this page.' : 'No threads yet. Start the conversation!'}</p>
              {page === 1 && (
                <Link href={`/forum/new?category=${cat.id}`} className="text-teal-400 hover:underline text-sm">
                  Post the first thread
                </Link>
              )}
            </div>
          )}
        </div>

        {(hasPrev || hasNext) && (
          <nav className="flex items-center justify-between mt-8" aria-label="Pagination">
            <Link
              href={hasPrev ? `/forum/${slug}?page=${page - 1}` : '#'}
              aria-disabled={!hasPrev}
              tabIndex={hasPrev ? 0 : -1}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                hasPrev
                  ? 'border-white/10 text-gray-300 hover:border-teal-500/40 hover:text-white'
                  : 'border-white/5 text-gray-700 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Link>
            <span className="text-xs text-gray-500">Page {page}</span>
            <Link
              href={hasNext ? `/forum/${slug}?page=${page + 1}` : '#'}
              aria-disabled={!hasNext}
              tabIndex={hasNext ? 0 : -1}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${
                hasNext
                  ? 'border-white/10 text-gray-300 hover:border-teal-500/40 hover:text-white'
                  : 'border-white/5 text-gray-700 cursor-not-allowed'
              }`}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
