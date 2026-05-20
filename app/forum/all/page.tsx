import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageSquare, Plus, ArrowLeft, Flame, Clock, ThumbsUp,
  Filter, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: 'All Threads — UAE Fishing Forum',
  description:
    'Browse all discussion threads across every category on the UAE Anglers Hub forum.',
};

// Force fresh render — new threads must appear instantly on this
// listing rather than waiting up to 30s for revalidation.
export const dynamic = 'force-dynamic';

const SORT_OPTIONS = [
  { label: 'Most Active', value: 'active', icon: Flame },
  { label: 'Newest', value: 'newest', icon: Clock },
  { label: 'Top Rated', value: 'top', icon: ThumbsUp },
];

export default async function AllThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string; page?: string }>;
}) {
  const { sort = 'active', category, page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch categories for filter
  const { data: categories } = await supabase
    .from('forum_categories')
    .select('id, name, slug, icon, thread_count')
    .order('created_at');

  // Build thread query
  let query = supabase
    .from('forum_threads')
    .select('*, profiles(display_name, username), forum_categories(name, slug, icon)')
    .eq('visibility', 'public'); // Only public threads on the all-threads wall

  if (category) {
    const cat = categories?.find((c) => c.slug === category);
    if (cat) query = query.eq('category_id', cat.id);
  }

  if (sort === 'newest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'top') {
    query = query.order('upvotes', { ascending: false });
  } else {
    // active = combination of recency and engagement
    query = query.order('updated_at', { ascending: false });
  }

  const { data: threadsRaw } = await query.range(offset, offset + PAGE_SIZE);
  const threads = (threadsRaw ?? []).slice(0, PAGE_SIZE);
  const hasNext = (threadsRaw ?? []).length > PAGE_SIZE;
  const hasPrev = page > 1;

  const activeSort = SORT_OPTIONS.find((s) => s.value === sort) ?? SORT_OPTIONS[0];

  // Helper to keep sort + category in the page nav URLs
  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (category) params.set('category', category);
    if (p > 1) params.set('page', String(p));
    return `/forum/all?${params.toString()}`;
  };

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white mb-1">All Threads</h1>
            <p className="text-gray-400 text-sm">
              {threads?.length ?? 0} active discussions across all categories
            </p>
          </div>
          <Link
            href="/forum/new"
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Sort:</span>
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm text-white font-medium">
                <activeSort.icon className="w-3.5 h-3.5 text-teal-400" />
                {activeSort.label}
                <ChevronDown className="w-3 h-3 text-gray-500" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-40 bg-[#0f1724] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {SORT_OPTIONS.map((opt) => (
                  <Link
                    key={opt.value}
                    href={`/forum/all?sort=${opt.value}${category ? `&category=${category}` : ''}`}
                    className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                      sort === opt.value ? 'text-teal-400' : 'text-gray-300'
                    }`}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Link
              href={`/forum/all?sort=${sort}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                !category
                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
              }`}
            >
              All Categories
            </Link>
            {(categories ?? []).map((cat) => (
              <Link
                key={cat.id}
                href={`/forum/all?sort=${sort}&category=${cat.slug}`}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                  category === cat.slug
                    ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
                <span className="ml-1 text-gray-600">{cat.thread_count}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Thread list */}
        <div className="space-y-3">
          {(threads ?? []).map((t) => {
            const profile = t.profiles as unknown as { display_name: string; username: string } | null;
            const cat = t.forum_categories as unknown as { name: string; slug: string; icon: string } | null;
            return (
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
                    <span className="text-xs text-gray-600 flex items-center gap-1">
                      {cat?.icon} {cat?.name}
                    </span>
                  </div>
                  <h2 className="font-semibold text-white group-hover:text-teal-400 transition-colors truncate">
                    {t.title}
                  </h2>
                  <p className="text-gray-500 text-sm truncate mt-0.5">{t.body.slice(0, 120)}...</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <span>by {profile?.display_name ?? 'Angler'}</span>
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
            );
          })}

          {(!threads || threads.length === 0) && (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="mb-4">{page > 1 ? 'No more threads on this page.' : 'No threads found.'}</p>
              {page === 1 && (
                <Link href="/forum/new" className="text-teal-400 hover:underline text-sm">
                  Start the first discussion
                </Link>
              )}
            </div>
          )}
        </div>

        {(hasPrev || hasNext) && (
          <nav className="flex items-center justify-between mt-8" aria-label="Pagination">
            <Link
              href={hasPrev ? pageHref(page - 1) : '#'}
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
              href={hasNext ? pageHref(page + 1) : '#'}
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
