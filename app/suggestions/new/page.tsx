'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lightbulb, Loader2, Send, Sparkles } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

const CATEGORIES = [
  { value: 'feature', label: 'New Feature', desc: 'A brand-new capability for the platform' },
  { value: 'improvement', label: 'Improvement', desc: 'Make something existing work better' },
  { value: 'bug', label: 'Bug Report', desc: 'Something is broken or not working right' },
  { value: 'content', label: 'Content', desc: 'New species, spots, research, articles…' },
  { value: 'other', label: 'Other', desc: 'Anything else on your mind' },
];

export default function NewSuggestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('feature');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = title.trim();
    if (!t || t.length < 5) { setError('Title must be at least 5 characters.'); return; }
    if (t.length > 200) { setError('Title max 200 characters.'); return; }
    if (body.trim().length > 2000) { setError('Description max 2000 characters.'); return; }

    setSubmitting(true);
    const res = await fetch('/api/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ title: t, body: body.trim() || null, category }),
    });
    const rawText = await res.text();
    setSubmitting(false);

    // Parse JSON safely
    let json: Record<string, unknown> = {};
    try { json = JSON.parse(rawText); } catch (_) { /* not JSON */ }

    if (res.ok) {
      router.push('/suggestions?sort=newest');
    } else {
      const fallback = rawText.slice(0, 200) || 'Could not submit. Try again.';
      const msg = String(json.error ?? json.message ?? fallback);
      const detail = json.code ? ` (${json.code})` : '';
      setError(msg + detail);
    }
  }

  return (
    <div className="min-h-screen pt-14">
      <div className="border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Link href="/suggestions" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to suggestions
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Submit an idea
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">Category</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    category === c.value
                      ? 'bg-teal-500/10 border-teal-500/30'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <p className={`text-sm font-semibold ${category === c.value ? 'text-teal-400' : 'text-white'}`}>
                    {c.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-xs font-medium text-gray-400 mb-1">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              placeholder="e.g. Add a photo wall to user profiles"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40"
            />
            <p className="text-[11px] text-gray-600 mt-1">{title.length}/200</p>
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="block text-xs font-medium text-gray-400 mb-1">Description</label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 2000))}
              placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40 resize-none"
            />
            <p className="text-[11px] text-gray-600 mt-1">{body.length}/2000</p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/suggestions"
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white text-sm font-semibold transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
