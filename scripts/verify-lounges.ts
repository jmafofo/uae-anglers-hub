/**
 * Throwaway verification for the community lounges migration.
 * Run: npx tsx scripts/verify-lounges.ts  (delete after use)
 * Prints only verification results — never any env values.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Node 20 has no native WebSocket; the Supabase client requires a
// constructor at init. We never open realtime connections here.
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = class {
    constructor() { throw new Error('no realtime in this script'); }
  };
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const EXPECTED = [
  'todays-conditions', 'catch-and-brag', 'abu-dhabi', 'dubai', 'sharjah',
  'ajman', 'umm-al-quwain', 'ras-al-khaimah', 'fujairah',
];

async function main() {
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1. Lounges seeded?
  const { data, error } = await admin
    .from('conversations')
    .select('slug, name, type, description')
    .eq('type', 'lounge');
  if (error) throw new Error(`lounge query failed: ${error.message}`);
  const slugs = (data ?? []).map((r) => r.slug).sort();
  const missing = EXPECTED.filter((s) => !slugs.includes(s));
  console.log(`lounges in DB: ${slugs.length}/9 ${missing.length ? `— MISSING: ${missing.join(', ')}` : '— all present ✓'}`);
  for (const row of data ?? []) {
    console.log(`  · ${row.slug} — "${row.name}"${row.description ? '' : ' (no description!)'}`);
  }

  // 2. Constraint allows 'lounge'? (seed existing proves it, but try a no-op
  //    insert+delete to be certain the CHECK constraint was updated)
  const probe = await admin
    .from('conversations')
    .insert({ type: 'lounge', name: 'probe', slug: 'probe-delete-me' })
    .select('id')
    .single();
  if (probe.error) {
    console.log(`type constraint: ✗ insert of a lounge failed — ${probe.error.message}`);
  } else {
    await admin.from('conversations').delete().eq('id', probe.data.id);
    console.log('type constraint: ✓ lounges insertable');
  }

  // 3. RLS: anonymous (no session) must NOT see lounges
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: anonRows, error: anonErr } = await anon
    .from('conversations')
    .select('id')
    .eq('type', 'lounge');
  if (anonErr) {
    console.log(`anon RLS: ✓ blocked (error: ${anonErr.code ?? anonErr.message})`);
  } else {
    console.log(`anon RLS: ${anonRows.length === 0 ? '✓ anonymous users see 0 lounges (sign-in required, as designed)' : `✗ anonymous users can see ${anonRows.length} lounges!`}`);
  }

  // 4. End-to-end as a real authenticated user: create a throwaway account,
  //    browse lounges, post to one, read it back, delete it, then clean up.
  const email = `verify-lounges-${Date.now()}@example.invalid`;
  const password = `verify-${Math.random().toString(36).slice(2)}!`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (createErr || !created.user) throw new Error(`could not create test user: ${createErr?.message}`);
  const uid = created.user.id;
  console.log('test user: created (temporary, will be deleted)');

  try {
    const userClient = createClient(url, anonKey, { auth: { persistSession: false } });
    const { error: signInErr } = await userClient.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(`test user sign-in failed: ${signInErr.message}`);

    const { data: userLounges, error: loungeErr } = await userClient
      .from('conversations')
      .select('id, slug')
      .eq('type', 'lounge');
    console.log(`user read lounges: ${loungeErr ? `✗ ${loungeErr.code ?? ''} ${loungeErr.message}` : `✓ sees ${userLounges?.length ?? 0}/9`}`);
    const dubai = (userLounges ?? []).find((l) => l.slug === 'dubai');

    if (dubai) {
      const { data: msg, error: sendErr } = await userClient
        .from('messages')
        .insert({ conversation_id: dubai.id, sender_id: uid, body: 'verification ping — delete me' })
        .select('id')
        .single();
      console.log(`user post message: ${sendErr ? `✗ ${sendErr.code ?? ''} ${sendErr.message}` : '✓ sent'}`);

      const { data: history, error: readErr } = await userClient
        .from('messages')
        .select('id')
        .eq('conversation_id', dubai.id);
      console.log(`user read messages: ${readErr ? `✗ ${readErr.code ?? ''} ${readErr.message}` : `✓ reads lounge history (${history?.length ?? 0} msgs)`}`);

      if (msg) {
        const { error: delErr } = await userClient.from('messages').delete().eq('id', msg.id);
        console.log(`user delete own message: ${delErr ? `✗ ${delErr.message}` : '✓ deleted'}`);
      }
    }
  } finally {
    await admin.auth.admin.deleteUser(uid);
    console.log('test user: deleted ✓');
  }
}

main().catch((e) => { console.error('VERIFY FAILED:', e.message); process.exit(1); });
