import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
if (typeof globalThis.WebSocket === 'undefined') {
  (globalThis as Record<string, unknown>).WebSocket = class { constructor() { throw new Error('no realtime'); } };
}
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const tables = ['ad_banner_bids', 'ad_banner_slots', 'film_brand_placements', 'stripe_events', 'commerce_merchants', 'commerce_orders', 'listings', 'conversations', 'messages', 'events', 'event_rsvps', 'assistant_usage', 'identify_audits'];
async function main() {
  for (const t of tables) {
    const { error } = await admin.from(t).select('*').limit(1);
    const missing = error?.message.includes('schema cache') || error?.message.includes('does not exist');
    console.log(`${missing ? '✗ MISSING' : error ? `? ${t} — ${error.message}` : '✓'} ${t === 'events' || t === 'event_rsvps' ? '' : ''}${missing ? '' : ' '}${t}`);
  }
}
main();
