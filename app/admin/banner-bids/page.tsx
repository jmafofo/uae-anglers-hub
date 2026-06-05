'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Megaphone,
  ExternalLink,
  Calendar,
  Clock,
  Image as ImageIcon,
  DollarSign,
  Mail,
  Building2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

 type Bid = {
  id: string;
  slot_id: string;
  user_id: string;
  business_name: string;
  business_email: string;
  image_url: string;
  target_url: string;
  duration_days: number;
  start_date: string | null;
  total_amount_aed: number;
  stripe_payment_intent_id: string | null;
  stripe_capture_status: string;
  status: string;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  ends_at: string | null;
  slot: {
    id: string;
    position: string;
    label: string;
    width_px: number;
    height_px: number;
    base_price_per_day: number;
  } | null;
};

type Gate = 'loading' | 'signed-out' | 'not-admin' | 'admin';

const TABS = ['pending_approval', 'active', 'rejected', 'all'] as const;

export default function AdminBannerBidsPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [tab, setTab] = useState<(typeof TABS)[number]>('pending_approval');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async (accessToken: string) => {
    setError(null);
    const r = await fetch('/api/banner-bids', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const body = await r.json();
    if (!r.ok) {
      setError(body.error ?? 'Failed to load bids');
      return;
    }
    setBids(body.bids ?? []);
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
      await load(session.access_token);
    })();
  }, [load]);

  async function approve(bid: Bid) {
    setBusyId(bid.id);
    setError(null);
    const r = await fetch(`/api/banner-bids/${bid.id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token!}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_date: startDate || undefined,
        admin_notes: adminNote.trim() || null,
      }),
    });
    setBusyId(null);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      setError(body.error ?? 'Approval failed');
      return;
    }
    setAdminNote('');
    setStartDate('');
    setExpandedId(null);
    await load(token!);
  }

  async function reject(bid: Bid) {
    setBusyId(bid.id);
    setError(null);
    const r = await fetch(`/api/banner-bids/${bid.id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token!}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_notes: adminNote.trim() || null,
      }),
    });
    setBusyId(null);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      setError(body.error ?? 'Rejection failed');
      return;
    }
    setAdminNote('');
    setExpandedId(null);
    await load(token!);
  }

  const filtered = bids.filter((b) => {
    if (tab === 'all') return true;
    return b.status === tab;
  });

  if (gate === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (gate !== 'admin') {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-white mb-2">
            {gate === 'signed-out' ? 'Sign in required' : 'Admins only'}
          </h1>
          <Link
            href={gate === 'signed-out' ? '/login?next=/admin/banner-bids' : '/'}
            className="inline-block bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold"
          >
            {gate === 'signed-out' ? 'Sign in' : 'Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Home
        </Link>
        <div className="mb-8">
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-1">
            <Megaphone className="w-4 h-4" /> Admin
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Banner Bids</h1>
          <p className="text-gray-400">
            Review and approve banner ad bids. Payment is authorized on checkout and captured on approval.
          </p>
          <Link
            href="/admin/ads"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            ← Manage native sponsorships
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors capitalize ' +
                (tab === t
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10')
              }
            >
              {t.replace('_', ' ')}
              <span className="ml-1.5 text-xs opacity-70">
                ({bids.filter((b) => t === 'all' ? true : b.status === t).length})
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No {tab.replace('_', ' ')} bids.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {filtered.map((bid) => (
              <li
                key={bid.id}
                className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <StatusBadge status={bid.status} />
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 capitalize">
                          {(bid.slot?.label) ?? 'Unknown slot'}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {bid.duration_days} days
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-teal-400" />
                        {bid.business_name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {bid.business_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> AED {Number(bid.total_amount_aed).toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(bid.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {bid.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => setExpandedId(expandedId === bid.id ? null : bid.id)}
                            className="px-3 py-1.5 rounded-lg border border-teal-500/40 text-teal-300 bg-teal-500/10 text-xs font-medium hover:bg-teal-500/20 transition-colors"
                          >
                            {expandedId === bid.id ? 'Close' : 'Review'}
                          </button>
                        </>
                      )}
                      {bid.status === 'active' && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Live
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Banner preview */}
                  <div className="mt-3">
                    <a
                      href={bid.target_url}
                      target="_blank" rel="noopener noreferrer"
                      
                      className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 mb-2"
                    >
                      <ExternalLink className="w-3 h-3" /> {bid.target_url}
                    </a>
                    <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20 max-w-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={bid.image_url}
                        alt={`Banner by ${bid.business_name}`}
                        className="w-full object-cover"
                        style={{
                          aspectRatio: bid.slot
                            ? `${bid.slot.width_px} / ${bid.slot.height_px}`
                            : '300 / 600',
                          maxHeight: 200,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded approval / rejection panel */}
                {expandedId === bid.id && bid.status === 'pending_approval' && (
                  <div className="border-t border-white/10 p-4 bg-white/[0.01]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <label className="block">
                        <span className="block text-xs text-gray-400 mb-1">Start date (optional)</span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs text-gray-400 mb-1">Admin notes (optional)</span>
                        <input
                          type="text"
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Reason or note to business"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(bid)}
                        disabled={busyId === bid.id}
                        className="inline-flex items-center gap-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        {busyId === bid.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Approve & Capture
                      </button>
                      <button
                        onClick={() => reject(bid)}
                        disabled={busyId === bid.id}
                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                      >
                        {busyId === bid.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Reject & Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    pending_approval: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    active: 'bg-green-500/10 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/10 text-red-300 border-red-500/30',
    expired: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border capitalize ${styles[status] ?? styles.draft}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
