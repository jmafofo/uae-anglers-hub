'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

export default function CategorySubscribeButton({ categoryId }: { categoryId: string }) {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function check() {
      const res = await fetch('/api/notifications/subscribe', {
        headers: await getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        const found = json.subscriptions?.find(
          (s: { category_id: string }) => s.category_id === categoryId
        );
        setSubscribed(!!found);
      }
      setLoading(false);
    }
    check();
  }, [categoryId]);

  async function toggle() {
    setActionLoading(true);
    if (subscribed) {
      const res = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ category_id: categoryId }),
      });
      if (res.ok) {
        setSubscribed(false);
      } else if (res.status === 401) {
        alert('Please sign in to manage subscriptions.');
      }
    } else {
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
        body: JSON.stringify({ category_id: categoryId, notify_new_threads: true }),
      });
      if (res.ok) {
        setSubscribed(true);
      } else if (res.status === 401) {
        alert('Please sign in to subscribe.');
      }
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <button disabled className="flex items-center gap-2 bg-white/5 text-gray-500 px-4 py-2.5 rounded-lg text-sm transition-colors">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading…
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={actionLoading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        subscribed
          ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30 hover:bg-teal-500/20'
          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
      }`}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : subscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      {subscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}
