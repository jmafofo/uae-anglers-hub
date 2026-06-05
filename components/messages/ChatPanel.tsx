'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft, Users, Trash2, LogOut, Send, Loader2,
} from 'lucide-react';
import type { ConversationView, MessageRow, MemberProfile } from './types';
import MessageBubble from './MessageBubble';
import AddMembersModal from './AddMembersModal';
import { getAuthHeaders } from '@/lib/supabase';

interface ChatPanelProps {
  conversation: ConversationView;
  messages: MessageRow[];
  memberMap: Map<string, MemberProfile>;
  userId: string;
  loadingMessages: boolean;
  activeId: string | null;
  onBack: () => void;
  onDeleteOrLeave: (conv: ConversationView) => void;
  onSend: (body: string) => Promise<void>;
  onEditMessage: (id: string, body: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  deletingId: string | null;
}

export default function ChatPanel({
  conversation,
  messages,
  memberMap,
  userId,
  loadingMessages,
  activeId,
  onBack,
  onDeleteOrLeave,
  onSend,
  onEditMessage,
  onDeleteMessage,
  deletingId,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Array<{ user_id: string; role: string }>>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const isAdmin = conversation.type === 'group' && conversation.my_role === 'admin';
  const isGroup = conversation.type === 'group';

  // Fetch group members for add-members modal
  useEffect(() => {
    if (!isGroup || !activeId) return;
    (async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/conversations/${activeId}/members`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGroupMembers((data.members ?? []).map((m: { user_id: string; role: string }) => ({ user_id: m.user_id, role: m.role })));
      }
    })();
  }, [isGroup, activeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSendError(null);
    if (!draft.trim()) return;
    const trimmed = draft.trim();
    setDraft('');
    setSending(true);
    try {
      await onSend(trimmed);
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send');
      setDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
        <button onClick={onBack} className="sm:hidden text-gray-400 hover:text-white mr-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
            isGroup ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'
          }`}
        >
          {isGroup ? <Users className="w-4 h-4" /> : conversation.display_name[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{conversation.display_name}</p>
          <p className="text-xs text-gray-500">
            {isGroup
              ? `${groupMembers.length > 0 ? groupMembers.length : ''} Group chat`
              : 'Direct message'}
          </p>
        </div>

        {/* Add members button for group admins */}
        {isAdmin && (
          <button
            onClick={() => setShowAddMembers(true)}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 text-xs font-semibold transition-colors"
          >
            + Add
          </button>
        )}

        <button
          onClick={() => onDeleteOrLeave(conversation)}
          disabled={deletingId === conversation.id}
          aria-label={isAdmin ? 'Delete group' : 'Leave conversation'}
          title={isAdmin ? 'Delete group' : 'Leave conversation'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
        >
          {deletingId === conversation.id ? <Loader2 className="w-4 h-4 animate-spin" /> : isAdmin ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
        role="log"
        aria-live="polite"
        aria-label="Messages"
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
            return (
              <MessageBubble
                key={m.id}
                message={m}
                isMine={mine}
                senderName={senderName}
                isGroup={isGroup}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="px-4 py-3 border-t border-white/10">
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

      {/* Add members modal */}
      {showAddMembers && (
        <AddMembersModal
          conversationId={conversation.id}
          existingMemberIds={groupMembers.map((m) => m.user_id)}
          onClose={() => setShowAddMembers(false)}
          onAdded={() => {
            // Refresh members list
            (async () => {
              const headers = await getAuthHeaders();
              const res = await fetch(`/api/conversations/${conversation.id}/members`, { headers });
              if (res.ok) {
                const data = await res.json();
                setGroupMembers((data.members ?? []).map((m: { user_id: string; role: string }) => ({ user_id: m.user_id, role: m.role })));
              }
            })();
          }}
        />
      )}
    </div>
  );
}
