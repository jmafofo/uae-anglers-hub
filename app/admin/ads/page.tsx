'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { Megaphone, Shield, Loader2, Plus, Trash2, Power, ChevronLeft, BarChart3, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { emirates } from '@/lib/spots';

type Sponsor = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  whatsapp: string | null;
  emirate: string | null;
  is_active: boolean;
  created_at: string;
};

type Placement = 'identify_result' | 'spot_sidebar' | 'home_banner' | 'ban_banner';

type Campaign = {
  id: string;
  sponsor_id: string;
  placement: Placement;
  headline: string;
  body: string | null;
  image_url: string | null;
  cta_text: string;
  target_url: string;
  target_species: string[];
  target_emirates: string[];
  cpm_aed: number;
  budget_aed: number;
  spent_aed: number;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  priority: number;
  impressions_count: number;
  clicks_count: number;
  sponsor?: { id: string; name: string; logo_url: string | null; emirate: string | null } | null;
};

type Gate = 'loading' | 'signed-out' | 'not-admin' | 'admin';

const PLACEMENTS: { key: Placement; label: string }[] = [
  { key: 'identify_result', label: 'Identify result' },
  { key: 'spot_sidebar',    label: 'Spot page' },
  { key: 'home_banner',     label: 'Home banner' },
  { key: 'ban_banner',      label: 'Ban banner' },
];

export default function AdminAdsPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'campaigns' | 'sponsors'>('campaigns');

  const load = useCallback(async (accessToken: string) => {
    setError(null);
    const [s, c] = await Promise.all([
      fetch('/api/admin/sponsors', { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch('/api/admin/ads',      { headers: { Authorization: `Bearer ${accessToken}` } }),
    ]);
    const sb = await s.json();
    const cb = await c.json();
    if (!s.ok) { setError(sb.error ?? 'Failed to load sponsors'); return; }
    if (!c.ok) { setError(cb.error ?? 'Failed to load campaigns'); return; }
    setSponsors(sb.sponsors ?? []);
    setCampaigns(cb.campaigns ?? []);
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

  if (gate === 'loading') {
    return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }
  if (gate !== 'admin') {
    return (
      <div className="min-h-screen pt-20 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl font-extrabold text-white mb-2">{gate === 'signed-out' ? 'Sign in required' : 'Admins only'}</h1>
          <Link href={gate === 'signed-out' ? '/login?next=/admin/ads' : '/'}
            className="inline-block bg-teal-500 hover:bg-teal-400 text-white px-5 py-2.5 rounded-lg font-semibold">
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
          <h1 className="text-3xl font-extrabold text-white mb-1">Sponsorships</h1>
          <p className="text-gray-400">
            Native sponsor placements that offset Ocean Sentinel costs. Premium subscribers see no ads.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {(['campaigns', 'sponsors'] as const).map(t => (
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
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {tab === 'sponsors' && (
          <SponsorsTab
            sponsors={sponsors}
            token={token!}
            onChanged={() => load(token!)}
            busyId={busyId}
            setBusyId={setBusyId}
            setError={setError}
          />
        )}

        {tab === 'campaigns' && (
          <CampaignsTab
            campaigns={campaigns}
            sponsors={sponsors}
            token={token!}
            onChanged={() => load(token!)}
            busyId={busyId}
            setBusyId={setBusyId}
            setError={setError}
          />
        )}
      </div>
    </div>
  );
}

// ── Sponsors tab ─────────────────────────────────────────────
function SponsorsTab({
  sponsors, token, onChanged, busyId, setBusyId, setError,
}: {
  sponsors: Sponsor[];
  token: string;
  onChanged: () => Promise<void> | void;
  busyId: string | null;
  setBusyId: (s: string | null) => void;
  setError: (e: string | null) => void;
}) {
  const [name, setName] = useState('');
  const [emirate, setEmirate] = useState<string>(emirates[0]);
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const r = await fetch('/api/admin/sponsors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(), emirate, description: description.trim() || null,
        logo_url: logoUrl.trim() || null, website: website.trim() || null,
        whatsapp: whatsapp.trim() || null,
      }),
    });
    const b = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(b.error ?? 'Create failed'); return; }
    setName(''); setDescription(''); setLogoUrl(''); setWebsite(''); setWhatsapp('');
    await onChanged();
  }

  async function toggle(s: Sponsor) {
    setBusyId(s.id);
    const r = await fetch(`/api/admin/sponsors/${s.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    setBusyId(null);
    if (!r.ok) { setError('Toggle failed'); return; }
    await onChanged();
  }

  async function remove(s: Sponsor) {
    if (!window.confirm(`Delete sponsor "${s.name}"? Their campaigns will be removed.`)) return;
    setBusyId(s.id);
    const r = await fetch(`/api/admin/sponsors/${s.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    if (!r.ok) { setError('Delete failed'); return; }
    await onChanged();
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-400" /> New sponsor
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} required maxLength={80} placeholder="Sponsor name *" className={inputClass} />
          <select value={emirate} onChange={e => setEmirate(e.target.value)} className={inputClass}>
            {emirates.map(em => <option key={em} value={em}>{em}</option>)}
          </select>
        </div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={400} placeholder="Description (≤ 400 chars)" className={inputClass} />
        <div className="grid grid-cols-3 gap-3">
          <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} type="url" placeholder="Logo URL" className={inputClass} />
          <input value={website} onChange={e => setWebsite(e.target.value)} type="url" placeholder="Website" className={inputClass} />
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="WhatsApp" className={inputClass} />
        </div>
        <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-semibold">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add sponsor
        </button>
      </form>

      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Existing</h2>
      {sponsors.length === 0 ? (
        <p className="text-gray-500 text-sm">No sponsors yet.</p>
      ) : (
        <ul className="space-y-2">
          {sponsors.map(s => (
            <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/10">
              {s.logo_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={s.logo_url} alt={s.name} className="w-12 h-12 rounded-lg object-cover bg-white/5 shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 text-xs shrink-0">Logo</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold truncate">{s.name}</h3>
                  {!s.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Inactive</span>}
                </div>
                {s.description && <p className="text-gray-400 text-sm line-clamp-2">{s.description}</p>}
                <div className="text-xs text-gray-500 flex flex-wrap gap-2 mt-0.5">
                  {s.emirate && <span>{s.emirate}</span>}
                  {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="text-teal-400 hover:text-teal-300">website</a>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => toggle(s)} disabled={busyId === s.id}
                  className={`p-1.5 rounded-lg border text-xs ${s.is_active ? 'border-teal-500/40 text-teal-300 bg-teal-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
                  title={s.is_active ? 'Pause' : 'Resume'}>
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(s)} disabled={busyId === s.id}
                  className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// ── Campaigns tab ────────────────────────────────────────────
function CampaignsTab({
  campaigns, sponsors, token, onChanged, busyId, setBusyId, setError,
}: {
  campaigns: Campaign[];
  sponsors: Sponsor[];
  token: string;
  onChanged: () => Promise<void> | void;
  busyId: string | null;
  setBusyId: (s: string | null) => void;
  setError: (e: string | null) => void;
}) {
  const [sponsorId, setSponsorId] = useState('');
  const [placement, setPlacement] = useState<Placement>('spot_sidebar');
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('Learn more');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetSpecies, setTargetSpecies] = useState('');
  const [targetEmirates, setTargetEmirates] = useState<string[]>([]);
  const [cpm, setCpm] = useState('40');
  const [budget, setBudget] = useState('500');
  const [endsAt, setEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sponsorId && sponsors.length > 0) setSponsorId(sponsors[0].id);
  }, [sponsors, sponsorId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const r = await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sponsor_id: sponsorId,
        placement,
        headline: headline.trim(),
        body: bodyText.trim() || null,
        image_url: imageUrl.trim() || null,
        cta_text: ctaText.trim() || 'Learn more',
        target_url: targetUrl.trim(),
        target_species: targetSpecies.split(',').map(s => s.trim()).filter(Boolean),
        target_emirates: targetEmirates,
        cpm_aed: Number(cpm),
        budget_aed: Number(budget),
        ends_at: endsAt || null,
      }),
    });
    const b = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(b.error ?? 'Create failed'); return; }
    setHeadline(''); setBodyText(''); setImageUrl(''); setTargetUrl('');
    setTargetSpecies(''); setTargetEmirates([]); setEndsAt('');
    await onChanged();
  }

  async function toggle(c: Campaign) {
    setBusyId(c.id);
    const r = await fetch(`/api/admin/ads/${c.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    setBusyId(null);
    if (!r.ok) { setError('Toggle failed'); return; }
    await onChanged();
  }

  async function remove(c: Campaign) {
    if (!window.confirm('Delete this campaign? Impressions and clicks will also be removed.')) return;
    setBusyId(c.id);
    const r = await fetch(`/api/admin/ads/${c.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setBusyId(null);
    if (!r.ok) { setError('Delete failed'); return; }
    await onChanged();
  }

  if (sponsors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 border border-dashed border-white/10 rounded-2xl">
        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>Add a sponsor first — campaigns must belong to one.</p>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl p-5 mb-8">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-teal-400" /> New campaign
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <select value={sponsorId} onChange={e => setSponsorId(e.target.value)} required className={inputClass}>
            {sponsors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={placement} onChange={e => setPlacement(e.target.value as Placement)} className={inputClass}>
            {PLACEMENTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>
        <input value={headline} onChange={e => setHeadline(e.target.value)} required maxLength={120} placeholder="Headline *" className={inputClass} />
        <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={2} maxLength={280} placeholder="Body (≤ 280 chars)" className={inputClass} />
        <div className="grid grid-cols-3 gap-3">
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} type="url" placeholder="Image URL" className={inputClass} />
          <input value={ctaText} onChange={e => setCtaText(e.target.value)} maxLength={30} placeholder="CTA (e.g. Shop)" className={inputClass} />
          <input value={targetUrl} onChange={e => setTargetUrl(e.target.value)} required type="url" placeholder="Target URL *" className={inputClass} />
        </div>
        <input value={targetSpecies} onChange={e => setTargetSpecies(e.target.value)}
          placeholder="Target species (comma separated, e.g. hammour, kingfish)" className={inputClass} />
        <div>
          <p className="text-xs text-gray-400 mb-1.5">Target emirates (leave empty for UAE-wide)</p>
          <div className="flex flex-wrap gap-1.5">
            {emirates.map(em => {
              const on = targetEmirates.includes(em);
              return (
                <button
                  type="button"
                  key={em}
                  onClick={() => setTargetEmirates(on ? targetEmirates.filter(x => x !== em) : [...targetEmirates, em])}
                  className={
                    'text-xs px-2.5 py-1 rounded-full border transition-colors ' +
                    (on
                      ? 'bg-teal-500 border-teal-500 text-white'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-teal-500/40')
                  }
                >
                  {em}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="block">
            <span className="block text-xs text-gray-400 mb-1">CPM (AED per 1000)</span>
            <input value={cpm} onChange={e => setCpm(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-400 mb-1">Total budget (AED)</span>
            <input value={budget} onChange={e => setBudget(e.target.value)} type="number" step="0.01" min="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="block text-xs text-gray-400 mb-1">Ends (optional)</span>
            <input value={endsAt} onChange={e => setEndsAt(e.target.value)} type="datetime-local" className={inputClass} />
          </label>
        </div>
        <button type="submit" disabled={submitting || !sponsorId} className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-white px-4 py-2 rounded-lg font-semibold">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Launch campaign
        </button>
      </form>

      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Active</h2>
      {campaigns.length === 0 ? (
        <p className="text-gray-500 text-sm">No campaigns yet.</p>
      ) : (
        <ul className="space-y-3">
          {campaigns.map(c => <CampaignCard key={c.id} c={c} onToggle={() => toggle(c)} onDelete={() => remove(c)} disabled={busyId === c.id} />)}
        </ul>
      )}
    </>
  );
}

function CampaignCard({ c, onToggle, onDelete, disabled }: { c: Campaign; onToggle: () => void; onDelete: () => void; disabled: boolean }) {
  const used = c.budget_aed > 0 ? Math.min(100, Math.round((c.spent_aed / c.budget_aed) * 100)) : 0;
  return (
    <li className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 capitalize">
              {(PLACEMENTS.find(p => p.key === c.placement)?.label) ?? c.placement}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
              {c.sponsor?.name ?? 'unknown sponsor'}
            </span>
            {!c.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Paused</span>}
          </div>
          <h3 className="text-white font-bold mt-1.5">{c.headline}</h3>
          {c.body && <p className="text-gray-400 text-sm line-clamp-2">{c.body}</p>}
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={onToggle} disabled={disabled}
            className={`p-1.5 rounded-lg border text-xs ${c.is_active ? 'border-teal-500/40 text-teal-300 bg-teal-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
            title={c.is_active ? 'Pause' : 'Resume'}>
            <Power className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} disabled={disabled}
            className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px]">Impressions</p>
          <p className="text-white font-bold">{c.impressions_count.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px]">Clicks</p>
          <p className="text-white font-bold">{c.clicks_count.toLocaleString()}{' '}
            <span className="text-gray-500 text-[10px] font-normal">
              ({c.impressions_count > 0 ? ((c.clicks_count / c.impressions_count) * 100).toFixed(2) : '0.00'}% CTR)
            </span>
          </p>
        </div>
        <div>
          <p className="text-gray-500 uppercase tracking-wider text-[10px]">Spent</p>
          <p className="text-white font-bold">AED {c.spent_aed.toFixed(2)}{' '}
            <span className="text-gray-500 text-[10px] font-normal">/ {c.budget_aed.toFixed(0)}</span>
          </p>
        </div>
      </div>

      <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500" style={{ width: `${used}%` }} />
      </div>

      {(c.target_species.length > 0 || c.target_emirates.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
          {c.target_species.map(s => <span key={s} className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">🐟 {s}</span>)}
          {c.target_emirates.map(em => <span key={em} className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">📍 {em}</span>)}
        </div>
      )}
    </li>
  );
}

const inputClass = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-teal-400';
