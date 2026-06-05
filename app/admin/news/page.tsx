'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Newspaper, Shield, Loader2, Plus, Trash2, Star, ChevronLeft, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Category = 'fishing' | 'marine_life' | 'regulation' | 'tournament' | 'conservation';
type NewsItem = {
  id: string;
  slug: string;
  category: Category;
  headline: string;
  excerpt: string | null;
  body: string | null;
  hero_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  is_featured: boolean;
  published_at: string;
};

type Gate = 'loading' | 'signed-out' | 'not-admin' | 'admin';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'fishing',      label: 'Fishing' },
  { key: 'marine_life',  label: 'Marine life' },
  { key: 'regulation',   label: 'Regulation' },
  { key: 'tournament',   label: 'Tournament' },
  { key: 'conservation', label: 'Conservation' },
];

export default function AdminNewsPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState<Category>('fishing');
  const [headline, setHeadline] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  async function load(accessToken: string) {
    setError(null);
    const r = await fetch('/api/admin/news', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const b = await r.json();
    if (!r.ok) { setError(b.error ?? 'Failed to load'); return; }
    setItems(b.items ?? []);
  }

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGate('signed-out'); return; }
      setToken(session.access_token);
      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single();
      if (!profile?.is_admin) { setGate('not-admin'); return; }
      setGate('admin');
      await load(session.access_token);
    })();
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    const r = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category,
        headline: headline.trim(),
        excerpt: excerpt.trim() || null,
        body: articleBody.trim() || null,
        hero_image_url: heroImageUrl.trim() || null,
        source_url: sourceUrl.trim() || null,
        source_name: sourceName.trim() || null,
        is_featured: isFeatured,
      }),
    });
    const b = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(b.error ?? 'Create failed'); return; }
    setItems(cur => [b.item, ...cur]);
    setHeadline(''); setExcerpt(''); setArticleBody('');
    setHeroImageUrl(''); setSourceUrl(''); setSourceName('');
    setIsFeatured(false);
  }

  async function remove(id: string) {
    if (!token) return;
    if (!window.confirm('Delete this news item?')) return;
    setBusyId(id);
    const r = await fetch(`/api/admin/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    if (!r.ok) { setError('Delete failed'); return; }
    setItems(cur => cur.filter(i => i.id !== id));
  }

  async function toggleFeatured(item: NewsItem) {
    if (!token) return;
    setBusyId(item.id);
    const r = await fetch(`/api/admin/news/${item.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: !item.is_featured }),
    });
    setBusyId(null);
    if (!r.ok) { setError('Update failed'); return; }
    const b = await r.json();
    setItems(cur => cur.map(i => i.id === item.id ? b.item : i));
  }

  if (gate === 'loading') {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }
  if (gate !== 'admin') {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-white mb-2">
            {gate === 'signed-out' ? 'Sign in required' : 'Admins only'}
          </h1>
          <Link href={gate === 'signed-out' ? '/login?next=/admin/news' : '/'}
            className="inline-block bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold">
            {gate === 'signed-out' ? 'Sign in' : 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Home
        </Link>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-1">
            <Newspaper className="w-4 h-4" /> Admin
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Trending news</h1>
          <p className="text-gray-400">Post updates that appear on the landing page.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">New item</h2>
            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-teal-500" />
              Featured
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category" required>
              <select value={category} onChange={e => setCategory(e.target.value as Category)} className={inputClass}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Source name">
              <input value={sourceName} onChange={e => setSourceName(e.target.value)} placeholder="The National, MOCCAE…" className={inputClass} />
            </Field>
          </div>
          <Field label="Headline" required>
            <input value={headline} onChange={e => setHeadline(e.target.value)} required maxLength={160} className={inputClass} />
          </Field>
          <Field label="Excerpt">
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} rows={2} maxLength={400} className={inputClass} />
          </Field>
          <Field label="Body">
            <textarea value={articleBody} onChange={e => setArticleBody(e.target.value)} rows={5} maxLength={20000} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hero image URL">
              <input value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} type="url" placeholder="https://…" className={inputClass} />
            </Field>
            <Field label="Source URL">
              <input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} type="url" placeholder="https://…" className={inputClass} />
            </Field>
          </div>
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
          <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-semibold">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Publish
          </button>
        </form>

        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Published</h2>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No items yet.</p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <li key={item.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
                {item.hero_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={item.hero_image_url} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-white/5 border border-white/10 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 capitalize">
                      {item.category.replace('_', ' ')}
                    </span>
                    {item.is_featured && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Featured
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(item.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold mt-0.5 truncate">{item.headline}</h3>
                  {item.excerpt && <p className="text-gray-400 text-sm line-clamp-2">{item.excerpt}</p>}
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 mt-1">
                      {item.source_name ?? 'Source'} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => toggleFeatured(item)} disabled={busyId === item.id}
                    className={`p-1.5 rounded-lg border text-xs ${item.is_featured ? 'border-amber-500/40 text-amber-300 bg-amber-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
                    title={item.is_featured ? 'Unfeature' : 'Feature'}>
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(item.id)} disabled={busyId === item.id}
                    className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const inputClass = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-400';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-300 mb-1.5">{label}{required && <span className="text-teal-400 ml-0.5">*</span>}</span>
      {children}
    </label>
  );
}
