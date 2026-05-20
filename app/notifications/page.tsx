'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bell, ArrowLeft, CheckCheck, MessageSquare, Reply, AtSign, Fish,
  MessageCircle, Trash2, Loader2,
} from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

interface Notification {
  id: string;
  type: 'new_thread' | 'new_reply' | 'mention' | 'catch_comment' | 'new_message';
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  forum_threads?: { title: string; category_id: string; forum_categories?: { name: string; slug: string } } | null;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_thread:    <MessageSquare className="w-5 h-5 text-teal-400" />,
  new_reply:     <Reply         className="w-5 h-5 text-blue-400" />,
  mention:       <AtSign        className="w-5 h-5 text-amber-400" />,
  catch_comment: <Fish          className="w-5 h-5 text-teal-400" />,
  new_message:   <MessageCircle className="w-5 h-5 text-emerald-400" />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  async function fetchNotifications() {
    setLoading(true);
    const unreadOnly = filter === 'unread';
    const res = await fetch(`/api/notifications?unread_only=${unreadOnly}&limit=100`, {
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      setNotifications(json.notifications ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  async function markAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  }

  async function markRead(id: string) {
    const res = await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/community" className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Community
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              <p className="text-xs text-gray-500">
                {unreadCount} unread · {notifications.length} total
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
            }`}
          >
            Unread
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-12 text-center text-gray-500">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500 text-sm">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const href = n.link ?? '/forum';
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    n.is_read
                      ? 'bg-white/[0.02] border-white/5 opacity-60'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={href}
                      onClick={() => {
                        if (!n.is_read) markRead(n.id);
                      }}
                      className="block"
                    >
                      <p className="text-sm font-medium text-white hover:text-teal-400 transition-colors">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                      )}
                    </Link>
                    <p className="text-[10px] text-gray-600 mt-1.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="shrink-0 text-xs text-teal-400 hover:text-teal-300 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
