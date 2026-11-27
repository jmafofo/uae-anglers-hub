import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = class { constructor() { throw new Error('no realtime'); } };
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function main() {
  const email = `verify-trips-${Date.now()}@example.invalid`;
  const password = `verify-${Math.random().toString(36).slice(2)}!`;
  const { data: created, error: createErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (createErr || !created.user) throw new Error(createErr?.message);
  const uid = created.user.id;
  let eventId: string | null = null;
  try {
    const user = createClient(url, anon, { auth: { persistSession: false } });
    await user.auth.signInWithPassword({ email, password });

    const { data: lounge } = await user.from('conversations').select('id').eq('slug', 'dubai').single();
    if (!lounge) throw new Error('dubai lounge not found');

    const { data: evt, error: evtErr } = await user.from('events').insert({
      conversation_id: lounge.id,
      title: 'verification trip — delete me',
      spot_slug: 'dubai-creek',
      location_name: 'Dubai Creek',
      latitude: 25.2631, longitude: 55.3289,
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      created_by: uid,
    }).select('id').single();
    console.log(`create event: ${evtErr ? '✗ ' + evtErr.message : '✓'}`);
    if (evtErr) throw new Error('stop');
    eventId = evt.id;

    const { error: rsvpErr } = await user.from('event_rsvps').insert({ event_id: eventId, user_id: uid, status: 'going' });
    console.log(`rsvp going: ${rsvpErr ? '✗ ' + rsvpErr.message : '✓'}`);

    const { data: readBack, error: readErr } = await user.from('events').select('*, rsvps:event_rsvps(status)').eq('id', eventId).single();
    console.log(`read event + rsvps: ${readErr ? '✗ ' + readErr.message : `✓ (${(readBack?.rsvps as unknown[] | null)?.length ?? 0} rsvp)`}`);
  } finally {
    if (eventId) await admin.from('events').delete().eq('id', eventId);
    await admin.auth.admin.deleteUser(uid);
    console.log('cleanup: event + test user deleted ✓');
  }
}
main().catch((e) => { console.error('VERIFY FAILED:', e.message); process.exit(1); });
