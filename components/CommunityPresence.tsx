'use client';

import { useEffect, useRef, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

type Status = 'connecting' | 'online' | 'unavailable';

const CONNECT_TIMEOUT_MS = 5000;

/**
 * Tracks the viewer in the shared `community` presence channel and
 * shows how many anglers are online. The channel is keyed by the
 * signed-in user_id (so OnlineDot can look up specific users), or
 * by a random per-session UUID for guests (counted in the total
 * but not addressable).
 *
 * If `profiles.appear_offline = true` the viewer is NOT tracked —
 * they still get the live count but stay invisible to others.
 */
export default function CommunityPresence() {
  const [status, setStatus] = useState<Status>('connecting');
  const [onlineCount, setOnlineCount] = useState(0);
  const sessionKeyRef = useRef<string>('');

  useEffect(() => {
    const sb = getSupabase();
    let cancelled = false;

    (async () => {
      // Decide the presence key + whether to track.
      const { data: { user } } = await sb.auth.getUser();
      let appearOffline = false;
      if (user) {
        sessionKeyRef.current = user.id;
        const { data: prof } = await sb
          .from('profiles')
          .select('appear_offline')
          .eq('id', user.id)
          .maybeSingle();
        appearOffline = Boolean(prof?.appear_offline);
      } else {
        sessionKeyRef.current = crypto.randomUUID();
      }

      const channel = sb.channel('community', {
        config: { presence: { key: sessionKeyRef.current } },
      });

      const recount = () => {
        const state = channel.presenceState();
        let count = 0;
        Object.values(state).forEach((presences) => { count += presences.length; });
        if (!cancelled) {
          setOnlineCount(count);
          setStatus('online');
        }
      };

      channel
        .on('presence', { event: 'sync' },  recount)
        .on('presence', { event: 'join' },  recount)
        .on('presence', { event: 'leave' }, recount)
        .subscribe(async (subStatus) => {
          if (cancelled) return;
          if (subStatus === 'SUBSCRIBED' && !appearOffline) {
            await channel.track({ online_at: new Date().toISOString() });
          } else if (
            subStatus === 'CLOSED' ||
            subStatus === 'CHANNEL_ERROR' ||
            subStatus === 'TIMED_OUT'
          ) {
            setStatus('unavailable');
          }
        });

      const timer = setTimeout(() => {
        if (!cancelled) {
          setStatus((s) => (s === 'connecting' ? 'unavailable' : s));
        }
      }, CONNECT_TIMEOUT_MS);

      return () => {
        cancelled = true;
        clearTimeout(timer);
        channel.unsubscribe();
      };
    })();
  }, []);

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
