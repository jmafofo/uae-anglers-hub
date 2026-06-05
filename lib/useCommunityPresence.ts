'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { getSupabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Shared community presence channel with reference counting.
 *
 * CommunityPresence and OnlineDot both subscribe to the same
 * `community` channel. The channel is created once, and only
 * unsubscribed when the LAST consumer unmounts. This prevents
 * one component's unmount from tearing down the channel for
 * everyone else.
 */

interface PresenceEntry {
  user_id: string;
  online_at: string;
}

type PresenceState = Record<string, PresenceEntry[]>;

let _channel: RealtimeChannel | null = null;
let _refCount = 0;
let _state: PresenceState = {};
const _listeners = new Set<() => void>();

function _notify() {
  _listeners.forEach((cb) => cb());
}

function _ensureChannel() {
  if (_channel) return;

  const sb = getSupabase();
  _channel = sb.channel('community');

  const recount = () => {
    _state = _channel!.presenceState() as PresenceState;
    _notify();
  };

  _channel
    .on('presence', { event: 'sync' }, recount)
    .on('presence', { event: 'join' }, recount)
    .on('presence', { event: 'leave' }, recount)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track this client so others see us
        const { data: { user } } = await sb.auth.getUser();
        if (user) {
          const { data: prof } = await sb
            .from('profiles')
            .select('appear_offline')
            .eq('id', user.id)
            .maybeSingle();
          if (!prof?.appear_offline) {
            await _channel!.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        } else {
          // Guest — track with random key so they count in the total
          await _channel!.track({ user_id: crypto.randomUUID(), online_at: new Date().toISOString() });
        }
      }
    });
}

function _acquire() {
  _refCount++;
  _ensureChannel();
  return () => {
    _refCount--;
    if (_refCount <= 0 && _channel) {
      _channel.unsubscribe();
      _channel = null;
      _state = {};
    }
  };
}

function _getSnapshot() {
  return _state;
}

function _subscribe(callback: () => void) {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}

/** Hook: returns live presence state (shared across all consumers). */
export function useCommunityPresenceState() {
  return useSyncExternalStore(_subscribe, _getSnapshot, _getSnapshot);
}

/** Hook: acquires a reference to the shared channel. Call in useEffect. */
export function useCommunityPresence() {
  useEffect(() => {
    return _acquire();
  }, []);
}

/** Read-only: is a specific user currently in the presence state? */
export function isUserOnline(userId: string): boolean {
  return Boolean(_state[userId]?.length);
}

/** Read-only: total number of unique online users. */
export function getOnlineCount(): number {
  return Object.keys(_state).length;
}
