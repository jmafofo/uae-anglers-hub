'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageCircle, ArrowLeft, ChevronRight, Loader2,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';
import type { ConversationView, MessageRow, MemberProfile } from '@/components/messages/types';
import ConversationList from '@/components/messages/ConversationList';
import ChatPanel from '@/components/messages/ChatPanel';
import GroupCreationModal from '@/components/messages/GroupCreationModal';
import DeleteConfirmModal from '@/components/messages/DeleteConfirmModal';

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-14 flex items-center justify-center text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    }>
      <MessagesPage />
    </Suspense>
  );
}

function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConv = searchParams.get('c');

  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialConv);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [memberMap, setMemberMap] = useState<Map<string, MemberProfile>>(new Map());
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  /* ── Delete / leave ─────────────────────────────────────── */
  const [confirmDelete, setConfirmDelete] = useState<ConversationView | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Group creation ─────────────────────────────────────── */
  const [showGroupModal, setShowGroupModal] = useState(false);

  /* ── Load conversations ─────────────────────────────────── */
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    const res = await fetch('/api/conversations/list', { headers: await getAuthHeaders() });
    if (!res.ok) {
      console.error('[messages] list fetch failed', res.status);
      setLoadingConvs(false);
      return;
    }
    const json = await res.json();
    const views: ConversationView[] = (json.conversations ?? []).sort(
      (a: ConversationView, b: ConversationView) => b.last_message_at.localeCompare(a.last_message_at)
    );
    setConversations(views);
    if (json.profiles) {
      setMemberMap(new Map(Object.entries(json.profiles)));
    }
    setLoadingConvs(false);
  }, []);

  useEffect(() => {
    (async () => {
      const sb = getSupabase();
      const { data: { user } } = await sb.auth.getUser();
      setUserId(user?.id ?? null);
      setAuthChecked(true);
      if (user) await loadConversations();
    })();
  }, [loadConversations]);

  /* ── Auto-create DM from ?to=<username> ─────────────────── */
  useEffect(() => {
    const to = searchParams.get('to');
    if (!to || !userId) return;
    (async () => {
      const sb = getSupabase();
      const { data: target } = await sb
        .from('profiles').select('id').eq('username', to.replace(/^@/, '').toLowerCase()).maybeSingle();
      if (!target) return;
      const { data: convId, error } = await sb.rpc('get_or_create_dm', { p_other_user_id: target.id });
      if (error) { console.warn('[messages] rpc', error); return; }
      router.replace(`/community/messages?c=${convId}`);
      setActiveId(convId as string);
      await loadConversations();
    })();
  }, [searchParams, userId, router, loadConversations]);

  /* ── Active conversation: messages + realtime ───────────── */
  useEffect(() => {
    if (!activeId || !userId) { setMessages([]); return; }
    let cancelled = false;
    setLoadingMessages(true);
    const sb = getSupabase();

    (async () => {
      const res = await fetch(`/api/conversations/${activeId}/messages`, {
        headers: await getAuthHeaders(),
      });
      if (cancelled) return;
      if (!res.ok) {
        console.error('[messages] load failed', res.status);
        setMessages([]);
      } else {
        const json = await res.json();
        setMessages((json.messages ?? []) as MessageRow[]);
        // Bump last_read_at
        await sb.from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', activeId).eq('user_id', userId);
        setConversations((cs) => cs.map((c) => c.id === activeId ? { ...c, my_last_read_at: new Date().toISOString() } : c));
      }
      setLoadingMessages(false);
    })();

    // Realtime
    const channel = sb
      .channel(`messages:${activeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        (payload) => {
          const m = payload.new as MessageRow;
          setMessages((cur) => cur.some((x) => x.id === m.id) ? cur : [...cur, m]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      sb.removeChannel(channel);
    };
  }, [activeId, userId]);

  /* ── Message actions ────────────────────────────────────── */
  async function sendMessage(body: string) {
    if (!activeId || !userId) throw new Error('Not active');
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Failed to send');
    }
    const json = await res.json();
    const msg = json.message as MessageRow;
    if (msg) {
      setMessages((cur) => cur.some((x) => x.id === msg.id) ? cur : [...cur, msg]);
    }
  }

  async function editMessage(id: string, body: string) {
    if (!activeId) throw new Error('Not active');
    const res = await fetch(`/api/conversations/${activeId}/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Failed to edit');
    }
    const json = await res.json();
    const updated = json.message as MessageRow;
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function deleteMessage(id: string) {
    if (!activeId) return;
    const res = await fetch(`/api/conversations/${activeId}/messages/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, deleted_at: new Date().toISOString() } : x)));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Could not delete message.');
    }
  }

  /* ── Delete / leave conversation ────────────────────────── */
  async function handleDeleteOrLeave(conv: ConversationView) {
    setDeletingId(conv.id);
    const res = await fetch(`/api/conversations/${conv.id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    setDeletingId(null);
    setConfirmDelete(null);
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
      if (activeId === conv.id) setActiveId(null);
    } else {
      const body = await res.json().catch(() => ({}));
      alert(body.error || 'Could not delete conversation.');
    }
  }

  /* ── Group creation ─────────────────────────────────────── */
  async function handleGroupCreated(convId: string) {
    setShowGroupModal(false);
    setActiveId(convId);
    if (userId) await loadConversations();
  }

  /* ── Render ─────────────────────────────────────────────── */
  if (!authChecked) return (
    <div className="min-h-screen pt-14 flex items-center justify-center text-gray-500">
      <Loader2 className="w-5 h-5 animate-spin" />
    </div>
  );

  if (!userId) {
    return (
      <div className="min-h-screen pt-14 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white/5 border border-white/10 rounded-2xl p-8">
          <MessageCircle className="w-10 h-10 text-teal-400 mx-auto mb-3" />
          <h1 className="text-white font-bold text-lg mb-2">Sign in to message</h1>
          <p className="text-gray-400 text-sm mb-5">Direct messages are for signed-in anglers.</p>
          <Link href="/login?next=/community/messages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeId);

  return (
    <div className="min-h-screen pt-14 flex flex-col">
      {/* Sub-nav breadcrumb */}
      <div className="border-b border-white/10 bg-[#0a0f1a]/90 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/community" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Community
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
          <span className="text-sm text-white font-semibold">Messages</span>
        </div>
      </div>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-4 py-6 gap-5">
        {/* Conversation list */}
        <div className={`${activeId ? 'hidden sm:flex' : 'flex'} flex-col`}>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            userId={userId}
            loading={loadingConvs}
            onSelect={setActiveId}
            onDeleteOrLeave={setConfirmDelete}
            onNewGroup={() => setShowGroupModal(true)}
            deletingId={deletingId}
          />
        </div>

        {/* Chat panel */}
        {activeConv ? (
          <ChatPanel
            conversation={activeConv}
            messages={messages}
            memberMap={memberMap}
            userId={userId}
            loadingMessages={loadingMessages}
            activeId={activeId}
            onBack={() => setActiveId(null)}
            onDeleteOrLeave={setConfirmDelete}
            onSend={sendMessage}
            onEditMessage={editMessage}
            onDeleteMessage={deleteMessage}
            deletingId={deletingId}
          />
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center py-20 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">Select a conversation</p>
            <p className="text-gray-500 text-sm max-w-xs">
              Pick a thread on the left, or start a new one from any angler&apos;s profile.
            </p>
          </div>
        )}
      </div>

      {/* Delete / Leave Confirmation */}
      {confirmDelete && (
        <DeleteConfirmModal
          conversation={confirmDelete}
          userId={userId}
          deletingId={deletingId}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDeleteOrLeave}
        />
      )}

      {/* New Group Modal */}
      {showGroupModal && (
        <GroupCreationModal
          onClose={() => setShowGroupModal(false)}
          onCreated={handleGroupCreated}
          userId={userId}
        />
      )}
    </div>
  );
}
