'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search, MessageCircle, Users, Plus, Trash2, LogOut, Loader2,
} from 'lucide-react';
import type { ConversationView } from './types';

interface ConversationListProps {
  conversations: ConversationView[];
  activeId: string | null;
  userId: string;
  loading: boolean;
  onSelect: (id: string) => void;
  onDeleteOrLeave: (conv: ConversationView) => void;
  onNewGroup: () => void;
  deletingId: string | null;
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

export default function ConversationList({
  conversations,
  activeId,
  userId,
  loading,
  onSelect,
  onDeleteOrLeave,
  onNewGroup,
  deletingId,
}: ConversationListProps) {
  const [search, setSearch] = useState('');
  const filtered = conversations.filter((c) =>
    c.display_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full sm:w-72 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-white">Messages</h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNewGroup}
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
        {loading ? (
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
                  onClick={() => onSelect(conv.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      conv.type === 'group' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'
                    }`}
                  >
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
                  onClick={(e) => { e.stopPropagation(); onDeleteOrLeave(conv); }}
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
  );
}
