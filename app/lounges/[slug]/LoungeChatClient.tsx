'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Send } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { redactMessage } from '@/lib/message-privacy';

interface Lounge {
  id: string;
  name: string;
  description: string | null;
}

interface LoungeMessage {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
  senderName: string;
  senderInitial: string;
}

type LoadState = 'loading' | 'ready' | 'not-found';

function nameOf(profile: { display_name: string | null; username: string | null } | null | undefined): string {
  return profile?.display_name ?? profile?.username ?? 'Angler';
}

function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function timeLabel(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function LoungeChatClient({ slug }: { slug: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [lounge, setLounge] = useState<Lounge | null>(null);
  const [messages, setMessages] = useState<LoungeMessage[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef(new Map<string, { name: string; initial: string }>());

  const profileFor = useCallback(async (senderId: string) => {
    const cached = profileCache.current.get(senderId);
    if (cached) return cached;
    const { data } = await getSupabase()
      .from('profiles')
      .select('display_name, username')
      .eq('id', senderId)
      .maybeSingle();
    const name = nameOf(data);
    const entry = { name, initial: initialOf(name) };
    profileCache.current.set(senderId, entry);
    return entry;
  }, []);

  // Auth
  useEffect(() => {
    getSupabase().auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setAuthChecked(true);
    });
  }, []);

  // Load lounge + history, then subscribe to realtime inserts
  useEffect(() => {
    if (!authChecked || !user) return;
    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null;
    const sb = getSupabase();

    (async () => {
      const { data: conv } = await sb
        .from('conversations')
        .select('id, name, description')
        .eq('type', 'lounge')
        .eq('slug', slug)
        .maybeSingle();
      if (cancelled) return;
      if (!conv) {
        setState('not-found');
        return;
      }
      setLounge(conv);

      const { data: rows } = await sb
        .from('messages')
        .select('id, body, created_at, sender_id, deleted_at, moderation_status, sender:profiles(display_name, username)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (cancelled) return;

      const hydrated: LoungeMessage[] = [];
      for (const row of rows ?? []) {
        const redacted = redactMessage(row);
        const senderJoin = Array.isArray(row.sender) ? row.sender[0] : row.sender;
        const name = nameOf(senderJoin as { display_name: string | null; username: string | null } | null);
        const entry = { name, initial: initialOf(name) };
        profileCache.current.set(row.sender_id, entry);
        hydrated.push({
          id: row.id,
          body: redacted.body,
          created_at: row.created_at,
          sender_id: row.sender_id,
          senderName: entry.name,
          senderInitial: entry.initial,
        });
      }
      setMessages(hydrated);
      setState('ready');

      const ch = sb
        .channel(`lounge:${conv.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
          (payload) => {
            const row = payload.new as {
              id: string; body: string; created_at: string; sender_id: string;
              deleted_at: string | null; moderation_status: string;
            };
            void profileFor(row.sender_id).then((profile) => {
              if (cancelled) return;
              const redacted = redactMessage(row);
              setMessages((prev) =>
                prev.some((m) => m.id === row.id)
                  ? prev
                  : [...prev, {
                      id: row.id,
                      body: redacted.body,
                      created_at: row.created_at,
                      sender_id: row.sender_id,
                      senderName: profile.name,
                      senderInitial: profile.initial,
                    }],
              );
            });
          },
        )
        .subscribe();
      channel = ch;
      if (cancelled) void sb.removeChannel(ch);
    })();

    return () => {
      cancelled = true;
      if (channel) void sb.removeChannel(channel);
    };
  }, [authChecked, user, slug, profileFor]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || !lounge || !user || sending) return;
    setSending(true);
    setSendError(null);
    const { error } = await getSupabase().from('messages').insert({
      conversation_id: lounge.id,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      setSendError(error.message);
    } else {
      setDraft('');
    }
  }

  if (authChecked && !user) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f7f9fa] px-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f2ee] text-[#23675e]">
          <Lock size={24} />
        </div>
        <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#18333f]">Sign in to join the lounge</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5b6b77]">
          Lounges are live conversations between UAE anglers — free accounts are welcome.
        </p>
        <Link
          href={`/login?next=/lounges/${slug}`}
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-[#23675e] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#174e47]"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (state === 'not-found') {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#f7f9fa] px-6 text-center">
        <h1 className="font-serif text-3xl tracking-[-0.02em] text-[#18333f]">Lounge not found</h1>
        <Link href="/lounges" className="mt-4 text-sm font-semibold text-[#23675e] underline underline-offset-4">
          Browse all lounges
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-[#f7f9fa]">
      {/* Header */}
      <div className="border-b border-[#e1e7eb] bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Link
            href="/lounges"
            aria-label="Back to lounges"
            className="rounded-full p-2 text-[#5b6b77] transition-colors hover:bg-[#f0f4f5]"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-serif text-xl leading-tight tracking-[-0.02em] text-[#18333f]">
              {lounge?.name ?? '…'}
            </h1>
            {lounge?.description && (
              <p className="line-clamp-1 text-xs text-[#5b6b77]">{lounge.description}</p>
            )}
          </div>
          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-[#e7f2ee] px-2.5 py-1 text-xs font-semibold text-[#205b52]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#23675e]" />
            Live
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {state === 'loading' && (
            <div className="flex justify-center py-16 text-[#5b6b77]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          )}
          {state === 'ready' && messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#cbd5dc] bg-white/60 px-6 py-12 text-center">
              <p className="font-serif text-xl text-[#18333f]">Quiet water — for now</p>
              <p className="mt-1 text-sm text-[#5b6b77]">Be the first to say what&apos;s biting.</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {messages.map((m) => {
              const mine = m.sender_id === user?.id;
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''}`}>
                  <div
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      mine ? 'bg-[#23675e] text-white' : 'bg-[#dce4e8] text-[#4a5d68]'
                    }`}
                  >
                    {m.senderInitial}
                  </div>
                  <div className={`max-w-[75%] ${mine ? 'text-right' : ''}`}>
                    <p className="mb-0.5 text-[11px] font-medium text-[#7a8891]">
                      {mine ? 'You' : m.senderName} · {timeLabel(m.created_at)}
                    </p>
                    <div
                      className={`inline-block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-left text-sm leading-relaxed ${
                        mine
                          ? 'rounded-br-sm bg-[#23675e] text-white'
                          : 'rounded-bl-sm border border-[#e1e7eb] bg-white text-[#182e3c]'
                      }`}
                    >
                      {m.body}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-[#e1e7eb] bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          {sendError && <p className="mb-2 text-xs font-medium text-red-600">{sendError}</p>}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={user ? `Message ${lounge?.name ?? 'the lounge'}…` : 'Sign in to chat'}
              disabled={!user || sending}
              rows={1}
              maxLength={4000}
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-[#d4dfe4] bg-white px-3.5 py-2.5 text-sm text-[#18333f] placeholder:text-[#7a8891] focus:border-[#45a99b] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={!user || sending || !draft.trim()}
              aria-label="Send message"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#23675e] text-white transition-colors hover:bg-[#174e47] disabled:opacity-50"
            >
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
