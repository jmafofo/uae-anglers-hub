import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = class { constructor() { throw new Error('no realtime'); } };
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
async function main() {
  const probes: Array<[string, Record<string, unknown>]> = [
    ['fulfill_stripe_event', { p_event_id: 'probe', p_event_type: 'probe', p_object: {} }],
    ['fulfill_commerce_payment', { p_event: 'probe', p_type: 'probe', p_session: {} }],
    ['assistant_count_today', { p_user_id: '00000000-0000-0000-0000-000000000000' }],
    ['identify_count_today', { p_user_id: '00000000-0000-0000-0000-000000000000' }],
    ['get_or_create_dm', { p_other_user_id: '00000000-0000-0000-0000-000000000000' }],
  ];
  for (const [fn, params] of probes) {
    const { error } = await admin.rpc(fn, params);
    const missing = error?.message.includes('schema cache') || error?.code === 'PGRST202' && error?.message.includes('Could not find');
    console.log(`${missing ? '✗ MISSING' : '✓ exists'} ${fn}${missing ? '' : ` (responded: ${error ? error.message.slice(0, 60) : 'ok'})`}`);
  }
}
main();
