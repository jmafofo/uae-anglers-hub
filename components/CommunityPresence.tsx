'use client';

import { useState, useEffect } from 'react';
import { useCommunityPresence, useCommunityPresenceState, getOnlineCount } from '@/lib/useCommunityPresence';

type Status = 'connecting' | 'online' | 'unavailable';

const CONNECT_TIMEOUT_MS = 5000;

/**
 * Shows how many anglers are online using the shared community
 * presence channel. The channel lifecycle is managed by
 * useCommunityPresence (singleton with reference counting).
 */
export default function CommunityPresence() {
  const [status, setStatus] = useState<Status>('connecting');
  const state = useCommunityPresenceState();
  const onlineCount = getOnlineCount();

  // Acquire shared channel reference
  useCommunityPresence();

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus((s) => (s === 'connecting' ? 'online' : s));
    }, CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (Object.keys(state).length > 0) {
      setStatus('online');
    }
  }, [state]);

  if (status === 'unavailable') return null;

  if (status === 'connecting') {
    return (
      <div
        className="flex items-center justify-center gap-2 py-3 text-xs text-gray-600"
        aria-live="polite"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-gray-500 opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500" />
        </span>
        <span>Connecting…</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-3">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
      </span>
      <span className="text-xs text-emerald-400 font-medium">
        {onlineCount} {onlineCount === 1 ? 'angler' : 'anglers'} online
      </span>
    </div>
  );
}
