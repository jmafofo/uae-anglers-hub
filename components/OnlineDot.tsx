'use client';

import { useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

interface OnlineDotProps {
  userId: string;
  /** Show "Online" / "Offline" text next to the dot */
  showLabel?: boolean;
  /** Tooltip text override */
  title?: string;
  className?: string;
}

/**
 * Read-only consumer of the shared `community` presence channel.
 * Watches whether `userId` appears in the channel state.
 *
 * Subscribes to the SAME channel name as CommunityPresence so
 * multiple OnlineDot instances don't spawn wasteful extra channels.
 */
export default function OnlineDot({
  userId, showLabel = false, title, className,
}: OnlineDotProps) {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const sb = getSupabase();
    // Share the same channel as CommunityPresence — no extra websocket
    const channel = sb.channel('community');

    const check = () => {
      const state = channel.presenceState();
      setIsOnline(Boolean(state[userId]?.length));
    };

    channel
      .on('presence', { event: 'sync' },  check)
      .on('presence', { event: 'join' },  check)
      .on('presence', { event: 'leave' }, check)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [userId]);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ''}`}
      title={title ?? (isOnline ? 'Online now' : 'Offline')}
      aria-label={isOnline ? 'Online' : 'Offline'}
    >
      <span className={`relative flex h-2 w-2`}>
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          isOnline ? 'bg-emerald-500' : 'bg-gray-600'
        }`} />
      </span>
      {showLabel && (
        <span className={`text-xs ${isOnline ? 'text-emerald-400' : 'text-gray-500'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
}
