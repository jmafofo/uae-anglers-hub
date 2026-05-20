'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  MessageCircle, Search, ArrowLeft, Users, Plus, Send,
  ChevronRight, Loader2, X, Trash2, LogOut, Pencil, Check, MoreVertical,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';

interface ConversationRow {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  last_message_at: string;
}

interface MemberRow {
  conversation_id: string;
  user_id: string;
  last_read_at: string;
  profile: { username: string; display_name: string | null } | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  moderation_status: 'approved' | 'flagged' | 'removed';
}

// "Conversation view" combines the conversation row + the other
// member's profile (DM) or the member roster (group).
interface ConversationView {
  id: string;
  type: 'dm' | 'group';
  display_name: string;
  last_message_at: string;
  my_last_read_at: string;
  other_user_id: string | null;
  created_by: string | null;
  my_role: string;
}

export default function MessagesPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-14 flex items-center justify-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin" /></div>}>
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
  const [memberMap, setMemberMap] = useState<Map<string, { username: string; display_name: string | null }>>(new Map());
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  /* ── Delete / leave confirmation ────────────────────────── */
  const [confirmDelete, setConfirmDelete] = useState<ConversationView | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Message edit state ─────────────────────────────────── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [messageMenuOpen, setMessageMenuOpen] = useState<string | null>(null);

  /* ── Group creation modal state ─────────────────────────── */
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupError, setGroupError] = useState<string | null>(null);

  // Predictive member search
  interface SearchedUser {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  }
  const [selectedMembers, setSelectedMembers] = useState<SearchedUser[]>([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberSuggestions, setMemberSuggestions] = useState<SearchedUser[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const memberInputRef = useRef<HTMLInputElement>(null);

  /* ── Initial session check + conversation list ─────────── */
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

  /* ── Auto-create DM from ?to=<username> ────────────────── */
  // Profile pages link here with ?to=ahmed-shore to start a chat.
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
      // Strip ?to= from URL but keep ?c=<convId>
      router.replace(`/community/messages?c=${convId}`);
      setActiveId(convId as string);
      await loadConversations();
    })();
  }, [searchParams, userId, router, loadConversations]);

  /* ── Active conversation: messages + realtime ──────────── */
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
        // Bump last_read_at for this conversation
        await sb.from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', activeId).eq('user_id', userId);
        // Reflect locally so the unread badge clears
        setConversations((cs) => cs.map((c) => c.id === activeId ? { ...c, my_last_read_at: new Date().toISOString() } : c));
      }
      setLoadingMessages(false);
    })();

    // Realtime: new messages on this conversation
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    if (!draft.trim() || !activeId || !userId) return;
    setSending(true);
    const trimmed = draft.trim();
    setDraft('');
    const res = await fetch(`/api/conversations/${activeId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ body: trimmed }),
    });
    setSending(false);
    if (res.ok) {
      const json = await res.json();
      const msg = json.message as MessageRow;
      if (msg) {
        setMessages((cur) => cur.some((x) => x.id === msg.id) ? cur : [...cur, msg]);
      }
    } else {
      const json = await res.json().catch(() => ({}));
      setSendError(friendlyMessageError(json) ?? json.error ?? 'Failed to send');
      setDraft(trimmed);
    }
  }

  async function startEditMessage(m: MessageRow) {
    setEditingId(m.id);
    setEditDraft(m.body);
    setMessageMenuOpen(null);
  }

  async function saveEditMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !activeId || !editDraft.trim()) return;
    setEditSaving(true);
    const res = await fetch(`/api/conversations/${activeId}/messages/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({ body: editDraft.trim() }),
    });
    setEditSaving(false);
    if (res.ok) {
      const json = await res.json();
      const updated = json.message as MessageRow;
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      setEditingId(null);
      setEditDraft('');
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Could not edit message.');
    }
  }

  async function deleteMessage(m: MessageRow) {
    if (!activeId) return;
    setMessageMenuOpen(null);
    const res = await fetch(`/api/conversations/${activeId}/messages/${m.id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted_at: new Date().toISOString() } : x)));
    } else {
      const json = await res.json().catch(() => ({}));
      alert(json.error || 'Could not delete message.');
    }
  }

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

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    setGroupError(null);
    const name = groupName.trim();
    if (!name) { setGroupError('Enter a group name.'); return; }
    if (selectedMembers.length === 0) { setGroupError('Add at least one member.'); return; }
    setCreatingGroup(true);
    const res = await fetch('/api/conversations/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({
        name,
        member_ids: selectedMembers.map((m) => m.id),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setCreatingGroup(false);
    if (!res.ok) {
      setGroupError(body.error || 'Could not create group.');
      return;
    }
    // Close modal and open the new conversation
    setShowGroupModal(false);
    setGroupName('');
    setSelectedMembers([]);
    setMemberQuery('');
    if (body.conversation_id) {
      setActiveId(body.conversation_id);
      if (userId) await loadConversations();
    }
  }

  // Debounced member search
  useEffect(() => {
    const q = memberQuery.trim();
    if (q.length < 2) { setMemberSuggestions([]); return; }
    const t = setTimeout(async () => {
      setSearchingMembers(true);
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}&limit=8`);
      setSearchingMembers(false);
      if (res.ok) {
        const json = await res.json();
        const users: SearchedUser[] = json.users ?? [];
        // Exclude already-selected members and current user
        const exclude = new Set([userId ?? '', ...selectedMembers.map((m) => m.id)]);
        setMemberSuggestions(users.filter((u) => !exclude.has(u.id)));
        setSuggestionsOpen(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [memberQuery, selectedMembers, userId]);

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
  const filtered = conversations.filter((c) =>
    c.display_name.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className={`${activeId ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 shrink-0`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-white">Messages</h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowGroupModal(true)}
                aria-label="New group"
                title="Start a group chat"
                className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              >
                <Users className="w-4 h-4" />
              </button>
              <Link
                href="/community"
                aria-label="Find anglers"
                title="Start a new conversation from a profile"
                className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 hover:bg-teal-500/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40"
            />
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                <Loader2 className="w-4 h-4 inline animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-sm text-gray-600">No conversations yet</p>
                <p className="text-xs text-gray-700 mt-1">Start chatting from an angler&apos;s profile</p>
              </div>
            ) : (
              filtered.map((conv) => {
                const unread = conv.last_message_at > conv.my_last_read_at;
                const canDelete = conv.type === 'group' && (conv.created_by === userId || conv.my_role === 'admin');
                return (
                  <div
                    key={conv.id}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all ${
                      activeId === conv.id
                        ? 'bg-teal-500/10 border border-teal-500/20'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <button
                      onClick={() => setActiveId(conv.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        conv.type === 'group' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'
                      }`}>
                        {conv.type === 'group' ? <Users className="w-4 h-4" /> : conv.display_name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white truncate">{conv.display_name}</p>
                          <span className="text-xs text-gray-600 shrink-0 ml-2">{timeAgo(conv.last_message_at)}</span>
                        </div>
                      </div>
                      {unread && <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(conv); }}
                      disabled={deletingId === conv.id}
                      aria-label={canDelete ? 'Delete group' : 'Leave conversation'}
                      title={canDelete ? 'Delete group' : 'Leave conversation'}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                    >
                      {deletingId === conv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : canDelete ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat panel */}
        {activeConv ? (
          <div className="flex flex-col flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
              <button onClick={() => setActiveId(null)} className="sm:hidden text-gray-400 hover:text-white mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                activeConv.type === 'group' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'
              }`}>
                {activeConv.type === 'group' ? <Users className="w-4 h-4" /> : activeConv.display_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{activeConv.display_name}</p>
                <p className="text-xs text-gray-500">{activeConv.type === 'group' ? 'Group chat' : 'Direct message'}</p>
              </div>
              <button
                onClick={() => setConfirmDelete(activeConv)}
                disabled={deletingId === activeConv.id}
                aria-label={activeConv.type === 'group' && (activeConv.created_by === userId || activeConv.my_role === 'admin') ? 'Delete group' : 'Leave conversation'}
                title={activeConv.type === 'group' && (activeConv.created_by === userId || activeConv.my_role === 'admin') ? 'Delete group' : 'Leave conversation'}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
              >
                {deletingId === activeConv.id ? <Loader2 className="w-4 h-4 animate-spin" /> : activeConv.type === 'group' && (activeConv.created_by === userId || activeConv.my_role === 'admin') ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
              </button>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
              role="log" aria-live="polite" aria-label="Messages"
            >
              {loadingMessages ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  <Loader2 className="w-4 h-4 inline animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm italic">No messages yet — say hi 👋</div>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === userId;
                  const senderName = memberMap.get(m.sender_id)?.display_name
                    ?? memberMap.get(m.sender_id)?.username
                    ?? 'angler';
                  const isEditing = editingId === m.id;
                  const isFlagged = m.moderation_status === 'flagged' || m.moderation_status === 'removed';
                  const showActions = mine && !m.deleted_at && !isFlagged && !isEditing;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className="relative group/message max-w-[75%]">
                        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          mine ? 'bg-teal-500 text-white rounded-br-sm' : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm'
                        }`}>
                          {activeConv.type === 'group' && !mine && (
                            <p className="text-[10px] font-semibold text-teal-300 mb-0.5">{senderName}</p>
                          )}
                          {isEditing ? (
                            <form onSubmit={saveEditMessage} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editDraft}
                                onChange={(e) => setEditDraft(e.target.value.slice(0, 4000))}
                                maxLength={4000}
                                autoFocus
                                className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 min-w-0"
                              />
                              <button
                                type="submit"
                                disabled={editSaving || !editDraft.trim()}
                                className="w-7 h-7 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                              >
                                {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingId(null); setEditDraft(''); }}
                                className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : m.deleted_at ? (
                            <span className="italic opacity-60">[deleted]</span>
                          ) : isFlagged ? (
                            <span className="italic opacity-60">[This message was removed]</span>
                          ) : (
                            m.body
                          )}
                          <p className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-gray-500'}`}>
                            {new Date(m.created_at).toLocaleTimeString('en-AE', { hour: 'numeric', minute: '2-digit' })}
                            {m.edited_at && !m.deleted_at && !isFlagged && ' · edited'}
                          </p>
                        </div>
                        {/* Message actions */}
                        {showActions && (
                          <div className="absolute -top-2 right-0 opacity-0 group-hover/message:opacity-100 focus-within:opacity-100 transition-opacity">
                            <div className="relative">
                              <button
                                onClick={() => setMessageMenuOpen(messageMenuOpen === m.id ? null : m.id)}
                                className="w-6 h-6 rounded-full bg-[#0f1724] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white"
                              >
                                <MoreVertical className="w-3 h-3" />
                              </button>
                              {messageMenuOpen === m.id && (
                                <>
                                  <div className="absolute right-0 mt-1 w-24 rounded-lg border border-white/10 bg-[#0f1724] shadow-xl overflow-hidden z-10">
                                    <button
                                      onClick={() => startEditMessage(m)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                                    >
                                      <Pencil className="w-3 h-3" /> Edit
                                    </button>
                                    <button
                                      onClick={() => deleteMessage(m)}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="w-3 h-3" /> Delete
                                    </button>
                                  </div>
                                  <button
                                    className="fixed inset-0 z-0"
                                    aria-hidden="true"
                                    onClick={() => setMessageMenuOpen(null)}
                                  />
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="px-4 py-3 border-t border-white/10">
              {sendError && (
                <div className="mb-2 p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                  {sendError}
                </div>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 4000))}
                  placeholder="Type a message…"
                  maxLength={4000}
                  aria-label="Message body"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:bg-teal-700 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>
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

      {/* ── Delete / Leave Confirmation Modal ───────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-white font-bold text-base mb-2">
              {confirmDelete.type === 'group' && (confirmDelete.created_by === userId || confirmDelete.my_role === 'admin')
                ? 'Delete group?'
                : 'Leave conversation?'}
            </h2>
            <p className="text-gray-400 text-sm mb-5">
              {confirmDelete.type === 'group' && (confirmDelete.created_by === userId || confirmDelete.my_role === 'admin')
                ? `This will permanently delete "${confirmDelete.display_name}" and all its messages for everyone.`
                : `You will be removed from "${confirmDelete.display_name}". This cannot be undone.`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrLeave(confirmDelete)}
                disabled={deletingId === confirmDelete.id}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 disabled:bg-red-800 text-white text-sm font-semibold transition-colors"
              >
                {deletingId === confirmDelete.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : confirmDelete.type === 'group' && (confirmDelete.created_by === userId || confirmDelete.my_role === 'admin') ? <Trash2 className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                {confirmDelete.type === 'group' && (confirmDelete.created_by === userId || confirmDelete.my_role === 'admin') ? 'Delete' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Group Modal ─────────────────────────────── */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="group-modal-title"
          onClick={() => setShowGroupModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#0a0f1a] border border-white/10 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 id="group-modal-title" className="text-white font-bold text-base">Start a group</h2>
              <button
                onClick={() => setShowGroupModal(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={createGroup} className="space-y-4">
              {groupError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {groupError}
                </div>
              )}

              <div>
                <label htmlFor="group-name" className="block text-xs font-medium text-gray-400 mb-1">Group name</label>
                <input
                  id="group-name"
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value.slice(0, 80))}
                  placeholder="e.g. Friday Al Aryam Trip"
                  maxLength={80}
                  className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-lg px-3 py-2 text-white placeholder-gray-600 outline-none text-sm"
                />
              </div>

              {/* Member search with autocomplete */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Members</label>
                {/* Selected member tags */}
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedMembers.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs"
                      >
                        {m.display_name ?? m.username}
                        <button
                          type="button"
                          onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.id !== m.id))}
                          className="hover:text-white"
                          aria-label={`Remove ${m.display_name ?? m.username}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <input
                    ref={memberInputRef}
                    type="text"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    onFocus={() => { if (memberSuggestions.length) setSuggestionsOpen(true); }}
                    placeholder="Search anglers by name…"
                    className="w-full bg-white/5 border border-white/10 focus:border-teal-500 rounded-lg px-3 py-2 text-white placeholder-gray-600 outline-none text-sm"
                  />
                  {searchingMembers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 animate-spin" />
                  )}

                  {/* Suggestions dropdown */}
                  {suggestionsOpen && memberSuggestions.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/10 bg-[#0f1724] shadow-xl">
                      {memberSuggestions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSelectedMembers((prev) => [...prev, u]);
                            setMemberQuery('');
                            setSuggestionsOpen(false);
                            memberInputRef.current?.focus();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/5 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center text-[10px] font-bold text-teal-400 shrink-0">
                            {(u.display_name ?? u.username)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{u.display_name ?? u.username}</p>
                            <p className="text-[10px] text-gray-500">@{u.username}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {suggestionsOpen && memberQuery.trim().length >= 2 && !searchingMembers && memberSuggestions.length === 0 && (
                    <div className="absolute z-10 left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#0f1724] shadow-xl px-3 py-2 text-xs text-gray-500">
                      No anglers found
                    </div>
                  )}
                </div>

                {/* Click outside to close suggestions */}
                {suggestionsOpen && (
                  <button
                    type="button"
                    className="fixed inset-0 z-0"
                    aria-hidden="true"
                    onClick={() => setSuggestionsOpen(false)}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowGroupModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-indigo-700 text-white text-sm font-semibold transition-colors"
                >
                  {creatingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  Create group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function friendlyMessageError(err: { message?: string } | null | undefined): string | null {
  if (!err?.message) return null;
  if (err.message.includes('Hourly message limit reached')) return err.message;
  return null;
}
