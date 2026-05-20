'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Lightbulb, ThumbsUp, Plus, Loader2, Filter, ArrowUpDown,
  CheckCircle2, Clock, Eye, ClipboardList, XCircle, Sparkles,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';

export default function SuggestionsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-14 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    }>
      <SuggestionsPage />
    </Suspense>
  );
}

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: 'feature' | 'bug' | 'improvement' | 'content' | 'other';
  status: 'pending' | 'under_review' | 'planned' | 'implemented' | 'declined';
  votes: number;
  created_at: string;
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  pending:       { label: 'Pending',       icon: <Clock className="w-3 h-3" />,       color: 'text-gray-400',     bg: 'bg-gray-500/10' },
  under_review:  { label: 'Under Review',  icon: <Eye className="w-3 h-3" />,         color: 'text-amber-400',    bg: 'bg-amber-500/10' },
  planned:       { label: 'Planned',       icon: <ClipboardList className="w-3 h-3" />, color: 'text-indigo-400',   bg: 'bg-indigo-500/10' },
  implemented:   { label: 'Implemented',   icon: <CheckCircle2 className="w-3 h-3" />,  color: 'text-emerald-400',  bg: 'bg-emerald-500/10' },
  declined:      { label: 'Declined',      icon: <XCircle className="w-3 h-3" />,       color: 'text-red-400',      bg: 'bg-red-500/10' },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  feature:     { label: 'Feature',     color: 'text-blue-400',    bg: 'bg-blue-500/10' },
  bug:         { label: 'Bug',         color: 'text-red-400',     bg: 'bg-red-500/10' },
  improvement: { label: 'Improvement', color: 'text-teal-400',    bg: 'bg-teal-500/10' },
  content:     { label: 'Content',     color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  other:       { label: 'Other',       color: 'text-gray-400',    bg: 'bg-gray-500/10' },
};

function SuggestionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [myVotes, setMyVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const activeStatus = searchParams.get('status') ?? 'all';
  const activeCategory = searchParams.get('category') ?? 'all';
  const activeSort = searchParams.get('sort') ?? 'votes';

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeStatus !== 'all') params.set('status', activeStatus);
    if (activeCategory !== 'all') params.set('category', activeCategory);
    params.set('sort', activeSort);

    const res = await fetch(`/api/suggestions?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setSuggestions(json.suggestions ?? []);
      setMyVotes(new Set(json.myVotes ?? []));
    }
    setLoading(false);
  }, [activeStatus, activeCategory, activeSort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: prof } = await sb.from('profiles').select('is_admin').eq('id', user.id).maybeSingle();
        setIsAdmin(!!prof?.is_admin);
      }
    })();
  }, []);

  async function toggleVote(id: string) {
    if (!userId) { router.push('/login?next=/suggestions'); return; }
    setVotingId(id);
    const voted = myVotes.has(id);
    const res = await fetch(`/api/suggestions/${id}/vote`, {
      method: voted ? 'DELETE' : 'POST',
      headers: await getAuthHeaders(),
    });
    setVotingId(null);
    if (res.ok) {
      setMyVotes((prev) => {
        const next = new Set(prev);
        if (voted) next.delete(id); else next.add(id);
        return next;
      });
      setSuggestions((prev) => prev.map((s) => {
        if (s.id !== id) return s;
        return { ...s, votes: voted ? s.votes - 1 : s.votes + 1 };
      }));
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, status: status as Suggestion['status'] } : s));
    }
  }

  function setFilter(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === 'all') p.delete(key); else p.set(key, value);
    router.replace(`/suggestions?${p.toString()}`);
  }

  return (
    <div className="min-h-screen pt-14">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-400" />
                Suggestions & Feedback
              </h1>
              <p className="text-gray-400 text-sm mt-1 max-w-lg">
                Have an idea to make UAE Anglers Hub better? Submit it here and vote on what matters most to the community.
              </p>
            </div>
            <Link
              href="/suggestions/new"
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit idea
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={activeStatus}
              onChange={(e) => setFilter('status', e.target.value)}
              className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-gray-500" />
            <select
              value={activeCategory}
              onChange={(e) => setFilter('category', e.target.value)}
              className="bg-transparent text-sm text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setFilter('sort', activeSort === 'votes' ? 'newest' : 'votes')}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {activeSort === 'votes' ? 'Most Popular' : 'Newest'}
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-20 text-center">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p className="text-white font-semibold text-lg">No suggestions yet</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to share an idea!</p>
            <Link
              href="/suggestions/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Submit idea
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const voted = myVotes.has(s.id);
              const statusCfg = STATUS_CONFIG[s.status];
              const catCfg = CATEGORY_CONFIG[s.category];
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-[#0d1f33]/60 border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Vote column */}
                  <button
                    onClick={() => toggleVote(s.id)}
                    disabled={votingId === s.id}
                    className={`shrink-0 flex flex-col items-center gap-1 w-14 py-2 rounded-xl border transition-colors ${
                      voted
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {votingId === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ThumbsUp className={`w-4 h-4 ${voted ? 'fill-current' : ''}`} />
                    )}
                    <span className="text-xs font-bold">{s.votes}</span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${catCfg.bg} ${catCfg.color}`}>
                        {catCfg.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${statusCfg.bg} ${statusCfg.color}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                    {s.body && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{s.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-gray-600">
                        by {s.profiles?.display_name ?? s.profiles?.username ?? 'angler'} · {timeAgo(s.created_at)}
                      </span>
                      {isAdmin && (
                        <select
                          value={s.status}
                          onChange={(e) => updateStatus(s.id, e.target.value)}
                          className="bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-[11px] text-gray-400 focus:outline-none cursor-pointer"
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
