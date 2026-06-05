'use client';

import { useCommunityPresence, useCommunityPresenceState, isUserOnline } from '@/lib/useCommunityPresence';

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
 * Uses the same singleton channel as CommunityPresence — no extra
 * websocket connections, and safe unmounting via reference counting.
 */
export default function OnlineDot({
  userId, showLabel = false, title, className,
}: OnlineDotProps) {
  // Acquire shared channel reference (ref-counted)
  useCommunityPresence();
  // Subscribe to state updates
  useCommunityPresenceState();
  const online = isUserOnline(userId);

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className ?? ''}`}
      title={title ?? (online ? 'Online now' : 'Offline')}
      aria-label={online ? 'Online' : 'Offline'}
    >
      <span className={`relative flex h-2 w-2`}>
        {online && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          online ? 'bg-emerald-500' : 'bg-gray-600'
        }`} />
      </span>
      {showLabel && (
        <span className={`text-xs ${online ? 'text-emerald-400' : 'text-gray-500'}`}>
          {online ? 'Online' : 'Offline'}
        </span>
      )}
    </span>
  );
}
