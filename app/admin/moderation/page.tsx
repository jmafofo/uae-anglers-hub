'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield, Check, X, Flag, Loader2, ExternalLink, ChevronLeft, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ReportStatus = 'pending' | 'upheld' | 'dismissed';
type Profile = { username: string | null; display_name: string | null };

type ThreadTarget = {
  id: string;
  title: string;
  body: string;
  user_id: string;
  deleted_at: string | null;
  profiles: Profile | null;
};
type ReplyTarget = {
  id: string;
  body: string;
  thread_id: string;
  user_id: string;
  deleted_at: string | null;
  profiles: Profile | null;
};

interface Report {
  id: string;
  target_type: 'thread' | 'reply';
  target_id: string;
  category: 'spam' | 'abuse' | 'wrong_category' | 'misinformation' | 'other';
  reason: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  reporter: Profile | null;
  target: ThreadTarget | ReplyTarget | null;
}

type Gate = 'loading' | 'signed-out' | 'not-admin' | 'admin';

const CATEGORY_LABEL: Record<Report['category'], string> = {
  spam: 'Spam',
  abuse: 'Abuse',
  wrong_category: 'Wrong category',
  misinformation: 'Misinformation',
  other: 'Other',
};

export default function AdminModerationPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ReportStatus>('pending');

  const load = useCallback(async (accessToken: string, status: ReportStatus) => {
    setError(null);
    const res = await fetch(`/api/admin/moderation/reports?status=${status}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to load');
      setReports([]);
      return;
    }
    setReports(body.reports ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGate('signed-out'); return; }
      setToken(session.access_token);

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single();
      if (!profile?.is_admin) { setGate('not-admin'); return; }

      setGate('admin');
      await load(session.access_token, 'pending');
    })();
  }, [load]);

  useEffect(() => {
    if (gate === 'admin' && token) load(token, tab);
  }, [tab, gate, token, load]);

  async function resolve(id: string, action: 'uphold' | 'dismiss') {
    if (!token) return;
    const note = action === 'uphold'
      ? (window.prompt('Moderator note (optional, shown on the tombstone):') ?? null)
      : null;
    setPendingId(id);
    setError(null);
    const res = await fetch(`/api/admin/moderation/reports/${id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason: note }),
    });
    const body = await res.json();
    setPendingId(null);
    if (!res.ok) { setError(body.error ?? 'Action failed'); return; }
    setReports((cur) => cur.filter((r) => r.id !== id));
  }

  if (gate === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (gate === 'signed-out') {
    return (
      <GateMessage
        title="Sign in required"
        body="The moderation console is only available to signed-in administrators."
        cta={{ href: '/login?next=/admin/moderation', label: 'Sign in' }}
      />
    );
  }

  if (gate === 'not-admin') {
    return (
      <GateMessage
        title="Admins only"
        body="Your account does not have admin privileges."
        cta={{ href: '/', label: 'Back to home' }}
      />
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
            <Shield className="w-4 h-4" />
            Admin
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Moderation queue</h1>
          <p className="text-gray-400">Review reports on threads and replies.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['pending', 'upheld', 'dismissed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ' +
                (tab === s
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10')
              }
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {reports.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <p className="text-lg">No {tab} reports.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <ReportCard
                key={r.id}
                r={r}
                disabled={pendingId === r.id}
                onUphold={() => resolve(r.id, 'uphold')}
                onDismiss={() => resolve(r.id, 'dismiss')}
                readOnly={tab !== 'pending'}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ReportCard({
  r, onUphold, onDismiss, disabled, readOnly,
}: {
  r: Report;
  onUphold: () => void;
  onDismiss: () => void;
  disabled: boolean;
  readOnly: boolean;
}) {
  const reporter = r.reporter?.display_name ?? r.reporter?.username ?? 'Unknown';
  const targetAuthor = r.target?.profiles?.display_name ?? r.target?.profiles?.username ?? 'Unknown';
  const targetTitle = r.target_type === 'thread'
    ? (r.target as ThreadTarget | null)?.title ?? '[thread missing]'
    : 'Reply';
  const threadId = r.target_type === 'thread' ? r.target_id : (r.target as ReplyTarget | null)?.thread_id;
  const targetBody = r.target?.body ?? '';
  const alreadyHidden = Boolean(r.target?.deleted_at);

  return (
    <li className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
            <Flag className="w-3 h-3" /> {CATEGORY_LABEL[r.category]}
          </span>
          <span className="text-gray-500 capitalize">{r.target_type}</span>
          {alreadyHidden && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" /> auto-hidden
            </span>
          )}
        </div>
        {threadId && (
          <Link
            href={`/forum/thread/${threadId}`}
            target="_blank" rel="noopener noreferrer"
            
            className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-xs"
          >
            View in context <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      <h3 className="text-white font-semibold text-sm mb-1 line-clamp-1">{targetTitle}</h3>
      <p className="text-gray-400 text-xs mb-2">
        by {targetAuthor} · reported by {reporter} · {new Date(r.created_at).toLocaleString()}
      </p>

      <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-sm text-gray-300 whitespace-pre-wrap mb-3 line-clamp-6">
        {targetBody || <span className="italic text-gray-600">[content not available]</span>}
      </div>

      {r.reason && (
        <p className="text-xs text-gray-400 italic mb-3">
          Reporter note: &ldquo;{r.reason}&rdquo;
        </p>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <button
            onClick={onUphold}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {disabled ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Uphold (remove)
          </button>
          <button
            onClick={onDismiss}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-gray-300 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Dismiss
          </button>
        </div>
      )}
    </li>
  );
}

function GateMessage({
  title, body, cta,
}: { title: string; body: string; cta: { href: string; label: string } }) {
  return (
    <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
      <div className="text-center max-w-md">
        <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
        <h1 className="text-2xl font-extrabold text-white mb-2">{title}</h1>
        <p className="text-gray-400 mb-6">{body}</p>
        <Link
          href={cta.href}
          className="inline-block bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors"
        >
          {cta.label}
        </Link>
      </div>
    </div>
  );
}
