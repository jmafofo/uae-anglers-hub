'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';

function NewThreadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preCategory = searchParams.get('category') ?? '';

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', body: '', category_id: preCategory, tags: '' });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const [{ data: { user } }, { data: cats }] = await Promise.all([
        sb.auth.getUser(),
        sb.from('forum_categories').select('id, name').order('created_at'),
      ]);
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setCategories(cats ?? []);
      if (!preCategory && cats?.[0]) setForm((f) => ({ ...f, category_id: cats[0].id }));
    }
    load();
  }, [router, preCategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.category_id || !userId) return;
    setPosting(true);
    const tags = form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
    const { data, error } = await getSupabase()
      .from('forum_threads')
      .insert({ user_id: userId, category_id: form.category_id, title: form.title.trim(), body: form.body.trim(), tags })
      .select('id, forum_categories(slug)')
      .single();
    if (!error && data) {
      const cats = data.forum_categories as unknown as { slug: string }[] | { slug: string } | null;
      const slug = Array.isArray(cats) ? cats[0]?.slug : cats?.slug;
      router.push(slug ? `/forum/${slug}` : '/forum');
    }
    setPosting(false);
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>
        <h1 className="text-2xl font-extrabold text-white mb-8">Start a New Thread</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Category *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              required
              className="w-full bg-[#0a0f1a] border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white outline-none text-sm"
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="What's your thread about?"
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Body *</label>
            <textarea
              required
              rows={8}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Share your knowledge, question or experience..."
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="e.g. kingfish, dubai, night fishing"
              className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={posting || !form.title.trim() || !form.body.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed text-white font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
            {posting ? 'Posting...' : 'Post Thread'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Loading...</div>}>
      <NewThreadForm />
    </Suspense>
  );
}
