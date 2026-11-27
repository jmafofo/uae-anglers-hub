import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { requireAuthUniversal } from '../lib/api-auth';
import { redactMessage } from '../lib/message-privacy';

// Node 20 has no native WebSocket, and constructing a Supabase client
// (via createServerClient) eagerly initializes the realtime client, which
// requires a WebSocket constructor. The tests below never open a realtime
// connection, so a stub is sufficient. Remove once tests run on Node 22+.
if (typeof globalThis.WebSocket === 'undefined') {
  class WebSocketStub {
    constructor() {
      throw new Error('WebSocket is not available in the test environment');
    }
  }
  (globalThis as Record<string, unknown>).WebSocket = WebSocketStub;
}

test('cookie authentication returns the JWT for encoded and chunked sessions', async () => {
  const originalFetch = globalThis.fetch;
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://review-test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  const user = { id: '00000000-0000-0000-0000-000000000001', aud: 'authenticated', role: 'authenticated' };
  const token = 'header.payload.signature';
  const session = { access_token: token, refresh_token: 'refresh', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, user };
  globalThis.fetch = async () => new Response(JSON.stringify(user), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const encoded = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
    const key = 'sb-review-test-auth-token';
    for (const cookie of [`${key}=${encoded}`, `${key}.0=${encoded.slice(0, 100)}; ${key}.1=${encoded.slice(100)}`]) {
      const result = await requireAuthUniversal(new NextRequest('https://example.test/api/profile/me', { headers: { cookie } }));
      assert.equal(result.ok, true);
      if (result.ok) assert.equal(result.token, token);
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = oldKey;
  }
});

test('message tombstones preserve metadata but never return hidden bodies', () => {
  const message = { id: 'message-1', body: 'private content', deleted_at: null as string | null, moderation_status: 'approved' };
  assert.equal(redactMessage(message).body, message.body);
  for (const hidden of [
    { ...message, deleted_at: '2026-11-26T00:00:00Z' },
    { ...message, moderation_status: 'flagged' },
    { ...message, moderation_status: 'removed' },
  ]) {
    assert.deepEqual(redactMessage(hidden), { ...hidden, body: '' });
    assert.equal(hidden.body, 'private content');
  }
});
