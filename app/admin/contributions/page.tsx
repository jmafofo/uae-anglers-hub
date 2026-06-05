'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Shield, Check, X, MapPin, Loader2, ExternalLink, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Contribution = {
  id: string;
  user_id: string;
  name: string;
  emirate: string | null;
  latitude: number;
  longitude: number;
  access_type: string | null;
  description: string | null;
  photo_url: string | null;
  target_species: string[] | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  submitter?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type Gate = 'loading' | 'signed-out' | 'not-admin' | 'admin';

export default function AdminContributionsPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<Contribution[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const load = useCallback(async (accessToken: string, status: typeof tab) => {
    setError(null);
    const res = await fetch(`/api/admin/contributions?status=${status}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Failed to load');
      setItems([]);
      return;
    }
    setItems(body.contributions ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGate('signed-out'); return; }
      setToken(session.access_token);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!profile?.is_admin) { setGate('not-admin'); return; }

      setGate('admin');
      await load(session.access_token, 'pending');
    })();
  }, [load]);

  useEffect(() => {
    if (gate === 'admin' && token) load(token, tab);
  }, [tab, gate, token, load]);

  async function review(id: string, action: 'approve' | 'reject') {
    if (!token) return;
    const notes = action === 'reject'
      ? (window.prompt('Reason for rejection (optional, shown to submitter):') ?? null)
      : null;

    setPendingId(id);
    setError(null);
    const res = await fetch(`/api/admin/contributions/${id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, admin_notes: notes }),
    });
    const body = await res.json();
    setPendingId(null);
    if (!res.ok) { setError(body.error ?? 'Review failed'); return; }
    setItems(cur => cur.filter(c => c.id !== id));
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
        body="The admin console is only available to signed-in administrators."
        cta={{ href: '/login?next=/admin/contributions', label: 'Sign in' }}
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
          <h1 className="text-3xl font-extrabold text-white mb-1">Spot contributions</h1>
          <p className="text-gray-400">Review and approve community-suggested fishing spots.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map(s => (
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

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <p className="text-lg">No {tab} contributions.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map(c => (
              <ContributionCard
                key={c.id}
                c={c}
                disabled={pendingId === c.id}
                onApprove={() => review(c.id, 'approve')}
                onReject={() => review(c.id, 'reject')}
                readOnly={tab !== 'pending'}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ContributionCard({
  c, onApprove, onReject, disabled, readOnly,
}: {
  c: Contribution;
  onApprove: () => void;
  onReject: () => void;
  disabled: boolean;
  readOnly: boolean;
}) {
  const submitter = c.submitter?.display_name ?? c.submitter?.username ?? 'Unknown angler';
  const mapsUrl = `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;

  return (
    <li className="p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex gap-4">
        {c.photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={c.photo_url}
            alt={c.name}
            className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg border border-white/10 shrink-0"
          />
        ) : (
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 text-xs shrink-0">
            No photo
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="text-white font-bold text-lg">{c.name}</h3>
              <div className="text-gray-400 text-sm">
                by {submitter}
                {c.emirate && <> · <span className="text-gray-300">{c.emirate}</span></>}
                {c.access_type && <> · <span className="text-gray-500">{c.access_type}</span></>}
              </div>
            </div>
            <a
              href={mapsUrl}
              target="_blank" rel="noopener noreferrer"
              
              className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 text-sm"
            >
              <MapPin className="w-3.5 h-3.5" />
              {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {c.description && (
            <p className="text-gray-300 text-sm mt-2 line-clamp-3">{c.description}</p>
          )}

          {c.target_species && c.target_species.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {c.target_species.map(s => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {s}
                </span>
              ))}
            </div>
          )}

          {c.admin_notes && (
            <p className="text-xs text-gray-500 mt-2 italic">Admin note: {c.admin_notes}</p>
          )}

          {!readOnly && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={onApprove}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                {disabled ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
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
