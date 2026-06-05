'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon, User, Bell, ShieldOff,
  Save, Loader2, Check, Plus, X, ChevronLeft,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';
import { EMIRATES } from '@/lib/emirates';

type Tab = 'profile' | 'notifications' | 'blocks';
type Gate = 'loading' | 'signed-out' | 'ready';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  emirate: string | null;
  appear_offline: boolean | null;
  dm_policy: 'open' | 'followers_only' | 'closed' | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_channel: string | null;
  facebook_page: string | null;
}

interface Subscription {
  category_id: string;
  notify_new_threads: boolean;
  forum_categories: { name: string; slug: string; icon: string };
}

interface BlockedUser {
  blocked_id: string;
  created_at: string;
  blocked: { username: string; display_name: string | null; avatar_url: string | null } | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [gate, setGate] = useState<Gate>('loading');
  const [tab, setTab] = useState<Tab>('profile');

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        // Round-trip through /login to bring them back here after sign-in
        router.replace('/login?next=/settings');
        return;
      }
      setGate('ready');
    })();
  }, [router]);

  if (gate === 'loading') {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (gate === 'signed-out') return null;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4">
          <ChevronLeft className="w-4 h-4" /> Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-teal-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Settings</h1>
        </div>

        <div className="flex gap-2 mb-6 border-b border-white/10" role="tablist">
          <TabButton current={tab} value="profile"       onSet={setTab} icon={<User className="w-3.5 h-3.5" />}     label="Profile" />
          <TabButton current={tab} value="notifications" onSet={setTab} icon={<Bell className="w-3.5 h-3.5" />}     label="Notifications" />
          <TabButton current={tab} value="blocks"        onSet={setTab} icon={<ShieldOff className="w-3.5 h-3.5" />} label="Blocked users" />
        </div>

        {tab === 'profile'       && <ProfileTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'blocks'        && <BlocksTab />}
      </div>
    </div>
  );
}

function TabButton({
  current, value, onSet, icon, label,
}: { current: Tab; value: Tab; onSet: (t: Tab) => void; icon: React.ReactNode; label: string }) {
  const active = current === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => onSet(value)}
      className={`-mb-px flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-teal-500 text-teal-400'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      {icon} {label}
    </button>
  );
}

/* ─── Profile tab ──────────────────────────────────────────── */

function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
    emirate: '',
    appear_offline: false,
    dm_policy: 'open' as 'open' | 'followers_only' | 'closed',
    instagram_handle: '',
    tiktok_handle: '',
    youtube_channel: '',
    facebook_page: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/profile/me', { headers: await getAuthHeaders() });
      if (res.ok) {
        const json = await res.json();
        const p: Profile = json.profile;
        setProfile(p);
        setForm({
          display_name:     p.display_name ?? '',
          bio:              p.bio ?? '',
          avatar_url:       p.avatar_url ?? '',
          emirate:          p.emirate ?? '',
          appear_offline:   Boolean(p.appear_offline),
          dm_policy:        (p.dm_policy ?? 'open') as 'open' | 'followers_only' | 'closed',
          instagram_handle: p.instagram_handle ?? '',
          tiktok_handle:    p.tiktok_handle ?? '',
          youtube_channel:  p.youtube_channel ?? '',
          facebook_page:    p.facebook_page ?? '',
        });
      }
      setLoading(false);
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setSaved(false);
    const res = await fetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(form),
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(body.error || 'Could not save.');
      return;
    }
    setProfile(body.profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="py-10 text-center text-gray-500 text-sm"><Loader2 className="w-4 h-4 inline animate-spin" /></div>;
  if (!profile) return <div className="py-10 text-center text-gray-500 text-sm">Could not load profile.</div>;

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-xs text-gray-500">
        Signed in as <span className="text-gray-300">@{profile.username}</span> · Username can&apos;t be changed here.
      </p>

      <Field label="Display name" hint="Shown on your posts and profile.">
        <input
          type="text"
          maxLength={80}
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          placeholder={profile.username}
          className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
        />
      </Field>

      <Field label="Bio" hint={`${form.bio.length}/500`}>
        <textarea
          maxLength={500}
          rows={4}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell other anglers about yourself…"
          className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm resize-none"
        />
      </Field>

      <Field label="Avatar URL" hint="Paste a public image URL. Hosted avatars coming later.">
        <input
          type="url"
          maxLength={500}
          value={form.avatar_url}
          onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
          placeholder="https://…"
          className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
        />
      </Field>

      <Field label="Home emirate">
        <select
          value={form.emirate}
          onChange={(e) => setForm({ ...form, emirate: e.target.value })}
          className="w-full bg-[#0a0f1a] border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
        >
          <option value="">Prefer not to say</option>
          {EMIRATES.map((em) => (
            <option key={em.slug} value={em.name}>{em.name}</option>
          ))}
        </select>
      </Field>

      <div className="pt-2 pb-1 border-t border-white/5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Social links</p>

        <Field label="Instagram" hint="@username">
          <input
            type="text"
            maxLength={80}
            value={form.instagram_handle}
            onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
            placeholder="your_handle"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        <Field label="TikTok" hint="@username">
          <input
            type="text"
            maxLength={80}
            value={form.tiktok_handle}
            onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })}
            placeholder="your_handle"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        <Field label="YouTube" hint="@channel or full URL">
          <input
            type="text"
            maxLength={200}
            value={form.youtube_channel}
            onChange={(e) => setForm({ ...form, youtube_channel: e.target.value })}
            placeholder="@your_channel"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>

        <Field label="Facebook" hint="page name or full URL">
          <input
            type="text"
            maxLength={200}
            value={form.facebook_page}
            onChange={(e) => setForm({ ...form, facebook_page: e.target.value })}
            placeholder="your.page"
            className="w-full bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white outline-none text-sm"
          />
        </Field>
      </div>

      <div className="pt-2 pb-1 border-t border-white/5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Privacy</p>

        <div className="flex items-start justify-between gap-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">Appear offline</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Other anglers won&apos;t see you in the online count or as &ldquo;Online&rdquo; on your profile. You can still see who&apos;s online.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.appear_offline}
            onClick={() => setForm({ ...form, appear_offline: !form.appear_offline })}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              form.appear_offline ? 'bg-teal-500' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                form.appear_offline ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
            <span className="sr-only">Toggle appear offline</span>
          </button>
        </div>

        <Field label="Who can message me?" hint="Direct messages can be limited or turned off entirely.">
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'open',           label: 'Anyone',     desc: 'Any signed-in angler' },
              { value: 'followers_only', label: 'Followed',   desc: 'Only people you follow' },
              { value: 'closed',         label: 'Off',        desc: 'No DMs at all' },
            ] as const).map((opt) => {
              const active = form.dm_policy === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, dm_policy: opt.value })}
                  className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                    active
                      ? 'border-teal-500 bg-teal-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  }`}
                >
                  <span className={`text-sm font-semibold ${active ? 'text-teal-400' : 'text-white'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-gray-500">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        {saved
          ? <span className="inline-flex items-center gap-1 text-teal-400 text-xs"><Check className="w-3.5 h-3.5" /> Saved</span>
          : <span />}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm text-gray-300">{label}</label>
        {hint && <span className="text-[10px] text-gray-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── Notifications tab ────────────────────────────────────── */

function NotificationsTab() {
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [cats, setCats] = useState<{ id: string; name: string; slug: string; icon: string }[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const sb = getSupabase();
    const [subsRes, catsRes] = await Promise.all([
      fetch('/api/notifications/subscribe', { headers: await getAuthHeaders() }),
      sb.from('forum_categories').select('id, name, slug, icon').order('created_at'),
    ]);
    if (subsRes.ok) {
      const json = await subsRes.json();
      setSubs(json.subscriptions ?? []);
    } else {
      setError('Could not load subscriptions.');
    }
    if (catsRes.data) setCats(catsRes.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(catId: string, currentlySubscribed: boolean) {
    setBusyId(catId);
    setError(null);
    const res = await fetch('/api/notifications/subscribe', {
      method: currentlySubscribed ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ category_id: catId, notify_new_threads: true }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Could not update subscription.');
    } else {
      await load();
    }
    setBusyId(null);
  }

  if (!subs) return <div className="py-10 text-center text-gray-500 text-sm"><Loader2 className="w-4 h-4 inline animate-spin" /></div>;

  const subbedSet = new Set(subs.map((s) => s.category_id));

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Pick which forum categories notify you about new threads. Replies on your own threads and @mentions always notify you.
      </p>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      <ul className="space-y-2">
        {cats.map((c) => {
          const on = subbedSet.has(c.id);
          return (
            <li
              key={c.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                on ? 'border-teal-500/30 bg-teal-500/5' : 'border-white/10 bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{c.icon}</span>
                <span className="text-sm text-white font-medium">{c.name}</span>
              </div>
              <button
                onClick={() => toggle(c.id, on)}
                disabled={busyId === c.id}
                aria-pressed={on}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  on ? 'bg-teal-500' : 'bg-white/10'
                } disabled:opacity-50`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    on ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
                <span className="sr-only">{on ? 'Unsubscribe' : 'Subscribe'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Blocks tab ───────────────────────────────────────────── */

function BlocksTab() {
  const [blocks, setBlocks] = useState<BlockedUser[] | null>(null);
  const [username, setUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch('/api/blocks', { headers: await getAuthHeaders() });
    if (res.ok) {
      const json = await res.json();
      setBlocks(json.blocks ?? []);
    } else {
      setError('Could not load block list.');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;
    setAdding(true);
    setError(null);
    const res = await fetch('/api/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ username: username.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setAdding(false);
    if (!res.ok) {
      setError(body.error || 'Could not block.');
      return;
    }
    setUsername('');
    await load();
  }

  async function removeBlock(userId: string) {
    setError(null);
    const res = await fetch(`/api/blocks?user_id=${userId}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Could not unblock.');
      return;
    }
    setBlocks((cur) => (cur ?? []).filter((b) => b.blocked_id !== userId));
  }

  if (!blocks) return <div className="py-10 text-center text-gray-500 text-sm"><Loader2 className="w-4 h-4 inline animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Blocked users&rsquo; replies are hidden from you in threads. They can still see your posts. Block lists are private.
      </p>

      <form onSubmit={addBlock} className="flex gap-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Block by username (e.g. ahmed-shore)"
          className="flex-1 bg-white/5 border border-white/20 focus:border-teal-500 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={adding || !username.trim()}
          className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-400 disabled:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Block
        </button>
      </form>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {blocks.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-white/10 rounded-xl">
          You haven&rsquo;t blocked anyone.
        </div>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b) => (
            <li
              key={b.blocked_id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs text-gray-400">
                  {b.blocked?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <p className="text-sm text-white">{b.blocked?.display_name ?? b.blocked?.username ?? 'Unknown'}</p>
                  <p className="text-[10px] text-gray-600">@{b.blocked?.username ?? '???'} · blocked {new Date(b.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button
                onClick={() => removeBlock(b.blocked_id)}
                aria-label={`Unblock ${b.blocked?.username ?? 'user'}`}
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/5"
              >
                <X className="w-3 h-3" /> Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
