'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/supabase';

interface FollowButtonProps {
  userId: string;
  username: string;
  initialIsFollowing?: boolean;
  className?: string;
}

export default function FollowButton({
  userId,
  username,
  initialIsFollowing = false,
  className = '',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  // On mount, check follow status from API
  useEffect(() => {
    if (initialIsFollowing) {
      setChecked(true);
      return;
    }
    (async () => {
      try {
        const headers = await getAuthHeaders();
        if (!headers.Authorization) return;
        const res = await fetch(`/api/follows?user_id=${userId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setIsFollowing(data.is_following);
        }
      } catch {
        // ignore
      } finally {
        setChecked(true);
      }
    })();
  }, [userId, initialIsFollowing]);

  const toggle = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
      if (isFollowing) {
        const res = await fetch('/api/follows', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setIsFollowing(false);
      } else {
        const res = await fetch('/api/follows', {
          method: 'POST',
          headers,
          body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setIsFollowing(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isFollowing, userId]);

  if (!checked) {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-500 text-xs font-semibold cursor-wait ${className}`}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        …
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        isFollowing
          ? 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
          : 'bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20'
      } ${className}`}
      title={isFollowing ? 'Unfollow' : 'Follow'}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="w-3.5 h-3.5" />
          <span className="group-hover:hidden">Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3.5 h-3.5" />
          Follow
        </>
      )}
    </button>
  );
}
