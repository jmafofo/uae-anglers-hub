'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, Loader2, Lock, Send } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { redactMessage } from '@/lib/message-privacy';
import PlanTripModal from './PlanTripModal';
import EventStrip from './EventStrip';

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
  const [connState, setConnState] = useState<'live' | 'reconnecting'>('live');
  const [showPlanTrip, setShowPlanTrip] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const profileCache = useRef(new Map<string, { name: string; initial: string }>());
  const latestRef = useRef<string | null>(null);
  const retryRef = useRef<{ attempts: number; timer: ReturnType<typeof setTimeout> | null }>({ attempts: 0, timer: null });

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
    const retry = retryRef.current;

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
      latestRef.current = hydrated.length ? hydrated[hydrated.length - 1].created_at : new Date().toISOString();
      const convId = conv.id;

      interface IncomingRow {
        id: string; body: string; created_at: string; sender_id: string;
        deleted_at: string | null; moderation_status: string;
      }

      const handleInsert = (row: IncomingRow) => {
        if (row.created_at > (latestRef.current ?? '')) latestRef.current = row.created_at;
        void profileFor(row.sender_id).then((profile) => {
          if (cancelled) return;
          const redacted = redactMessage(row);
          setMessages((prev) => {
            // Settle the optimistic twin of this real row, if present.
            const settled = prev.filter(
              (m) => !(m.id.startsWith('temp-') && m.sender_id === row.sender_id && m.body === row.body),
            );
            if (settled.some((m) => m.id === row.id)) return settled;
            return [...settled, {
              id: row.id,
              body: redacted.body,
              created_at: row.created_at,
              sender_id: row.sender_id,
              senderName: profile.name,
              senderInitial: profile.initial,
            }];
          });
        });
      };

      // Fetch anything missed while the socket was down.
      async function catchUp() {
        const since = latestRef.current;
        if (!since) return;
        const { data: missed } = await sb
          .from('messages')
          .select('id, body, created_at, sender_id, deleted_at, moderation_status')
          .eq('conversation_id', convId)
          .gt('created_at', since)
          .order('created_at', { ascending: true });
        for (const row of missed ?? []) handleInsert(row as IncomingRow);
      }

      function subscribe() {
        if (cancelled) return;
        const ch = sb
          .channel(`lounge:${convId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
            (payload) => handleInsert(payload.new as IncomingRow),
          )
          .subscribe((status) => {
            if (cancelled) return;
            if (status === 'SUBSCRIBED') {
              retryRef.current.attempts = 0;
              setConnState('live');
              void catchUp();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
              setConnState('reconnecting');
              const attempts = ++retryRef.current.attempts;
              const delay = Math.min(30000, 1000 * 2 ** attempts);
              retryRef.current.timer = setTimeout(() => {
                void sb.removeChannel(ch);
                subscribe();
              }, delay);
            }
          });
        channel = ch;
        if (cancelled) void sb.removeChannel(ch);
      }

      subscribe();
    })();

    return () => {
      cancelled = true;
      if (retry.timer) clearTimeout(retry.timer);
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
    const myName =
      profileCache.current.get(user.id)?.name ??
      (user.user_metadata?.display_name as string | undefined) ??
      (user.user_metadata?.username as string | undefined) ??
      'You';
    const tempId = `temp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tempId,
      body,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      senderName: myName,
      senderInitial: initialOf(myName),
    }]);
    setDraft('');
    setSending(true);
    setSendError(null);
    const { error } = await getSupabase().from('messages').insert({
      conversation_id: lounge.id,
      sender_id: user.id,
      body,
    });
    setSending(false);
    if (error) {
      // Roll back the optimistic bubble and restore the draft.
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError(error.message);
      setDraft(body);
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
          <button
            type="button"
            onClick={() => setShowPlanTrip(true)}
            className="ms-auto inline-flex items-center gap-1.5 rounded-full border border-[#23675e] bg-[#23675e] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#174e47]"
          >
            <CalendarPlus size={13} />
            <span className="hidden sm:inline">Plan a trip</span>
          </button>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            connState === 'live' ? 'bg-[#e7f2ee] text-[#205b52]' : 'bg-[#faf3e3] text-[#8a651c]'
          }`}>
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${connState === 'live' ? 'bg-[#23675e]' : 'bg-[#b8892d]'}`} />
            {connState === 'live' ? 'Live' : 'Reconnecting…'}
          </span>
        </div>
      </div>

      {/* Upcoming expeditions */}
      {lounge && user && <EventStrip conversationId={lounge.id} userId={user.id} />}

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
              const pending = m.id.startsWith('temp-');
              return (
                <div key={m.id} className={`flex gap-2.5 ${mine ? 'flex-row-reverse' : ''} ${pending ? 'opacity-60' : ''}`}>
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
                      {mine ? 'You' : m.senderName} · {pending ? 'Sending…' : timeLabel(m.created_at)}
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

      {showPlanTrip && lounge && user && (
        <PlanTripModal
          conversationId={lounge.id}
          userId={user.id}
          onClose={() => setShowPlanTrip(false)}
        />
      )}
    </div>
  );
}
