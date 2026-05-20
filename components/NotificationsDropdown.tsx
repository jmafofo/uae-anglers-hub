'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  MessageSquare,
  Reply,
  AtSign,
  CheckCheck,
  Fish,
  MessageCircle,
} from 'lucide-react';
import { getSupabase, getAuthHeaders } from '@/lib/supabase';

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
  new_thread:    <MessageSquare className="w-4 h-4 text-teal-400" />,
  new_reply:     <Reply         className="w-4 h-4 text-blue-400" />,
  mention:       <AtSign        className="w-4 h-4 text-amber-400" />,
  catch_comment: <Fish          className="w-4 h-4 text-teal-400" />,
  new_message:   <MessageCircle className="w-4 h-4 text-emerald-400" />,
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

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const sb = getSupabase();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const res = await fetch('/api/notifications?unread_only=true&limit=20', {
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      setNotifications(json.notifications ?? []);
      setUnreadCount(json.unreadCount ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime: subscribe to inserts/updates on this user's notifications
  // row, so new pings appear instantly instead of waiting for a 30s
  // poll. Falls back gracefully if the channel can't connect — the
  // component still works (just no live updates) and you'll see the
  // counter on next page load.
  useEffect(() => {
    if (!userId) return;
    const sb = getSupabase();
    const channel = sb
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT for new, UPDATE for read-state changes
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => { fetchNotifications(); },
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [userId, fetchNotifications]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function markAllRead() {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
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
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  }

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0f1724] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-gray-500 text-sm">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-700" />
                <p className="text-sm text-gray-500">No new notifications</p>
              </div>
            ) : (
              notifications.map((n) => {
                const href = n.link ?? '/forum';
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => {
                      if (!n.is_read) markRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 ${
                      n.is_read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 bg-teal-400 rounded-full shrink-0 mt-1.5" />
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t border-white/10 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
