'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageCircle, Search, ArrowLeft, Users, Lock,
  Plus, Send, ChevronRight,
} from 'lucide-react';

// Placeholder conversation data — will be replaced with Supabase realtime
const DEMO_CONVERSATIONS = [
  { id: '1', type: 'dm', name: 'Ahmed Al Mansoori', initials: 'AA', lastMsg: 'What bait are you using at Khor Fakkan?', time: '2m', unread: 2 },
  { id: '2', type: 'group', name: 'Dubai Shore Fishing', initials: 'DS', lastMsg: 'Session tomorrow 5am at La Mer 🎣', time: '14m', unread: 5 },
  { id: '3', type: 'dm', name: 'Khalid Hamdan', initials: 'KH', lastMsg: 'Nice Hammour bro!', time: '1h', unread: 0 },
  { id: '4', type: 'group', name: 'RAK Anglers Group', initials: 'RA', lastMsg: 'Water is clear today, great vis', time: '3h', unread: 0 },
  { id: '5', type: 'dm', name: 'Sara F.', initials: 'SF', lastMsg: 'Thanks for the spot tip!', time: 'Yesterday', unread: 0 },
];

export default function MessagesPage() {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');

  const filtered = DEMO_CONVERSATIONS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeConv = DEMO_CONVERSATIONS.find((c) => c.id === activeId);

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
            <button className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 hover:bg-teal-500/20 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40"
            />
          </div>

          {/* List */}
          <div className="flex-1 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-sm text-gray-600">No conversations yet</p>
                <p className="text-xs text-gray-700 mt-1">Start chatting from an angler&apos;s profile</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    activeId === conv.id
                      ? 'bg-teal-500/10 border border-teal-500/20'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    conv.type === 'group'
                      ? 'bg-indigo-500/20 text-indigo-400'
                      : 'bg-teal-500/20 text-teal-400'
                  }`}>
                    {conv.type === 'group' ? <Users className="w-4 h-4" /> : conv.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white truncate">{conv.name}</p>
                      <span className="text-xs text-gray-600 shrink-0 ml-2">{conv.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conv.lastMsg}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        {activeId ? (
          <div className="flex flex-col flex-1 rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
              <button
                onClick={() => setActiveId(null)}
                className="sm:hidden text-gray-400 hover:text-white mr-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                activeConv?.type === 'group' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-teal-500/20 text-teal-400'
              }`}>
                {activeConv?.type === 'group' ? <Users className="w-4 h-4" /> : activeConv?.initials}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{activeConv?.name}</p>
                <p className="text-xs text-gray-500">{activeConv?.type === 'group' ? 'Group chat' : 'Direct message'}</p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-white font-semibold mb-1">End-to-end chat</p>
              <p className="text-gray-500 text-sm max-w-xs">
                Realtime messaging is coming soon. You&apos;ll be able to DM any angler or create group chats for your crew.
              </p>
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-teal-500/40"
                />
                <button className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 hover:bg-teal-500/30 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-center py-20 px-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <MessageCircle className="w-7 h-7 text-indigo-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">Select a conversation</p>
            <p className="text-gray-500 text-sm max-w-xs">
              Choose a DM or group chat from the left, or start a new conversation with the{' '}
              <span className="text-teal-400">+</span> button.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
