import test from 'node:test';
import assert from 'node:assert/strict';
import { isCurrentPaidBooking, isHttpsUrl, type PaidBooking } from '../lib/home-advertising';
const now = Date.parse('2026-11-27T12:00:00Z');
const booking: PaidBooking = { user_id: 'dealer', business_name: 'Dealer', status: 'active', stripe_capture_status: 'captured', stripe_payment_intent_id: 'pi_test', start_date: '2026-11-27', ends_at: '2026-11-28T12:00:00Z' };
test('only current captured approved bookings are eligible', () => {
  assert.equal(isCurrentPaidBooking(booking, now), true);
  for (const change of [{ status: 'pending_approval' }, { stripe_capture_status: 'authorized' }, { stripe_capture_status: 'refunded' }, { stripe_payment_intent_id: null }, { start_date: '2026-11-28' }, { start_date: null }, { ends_at: '2026-11-27T12:00:00Z' }, { ends_at: null }, { ends_at: 'invalid' }]) assert.equal(isCurrentPaidBooking({ ...booking, ...change }, now), false);
});
test('booking starts at UAE midnight and ad links require HTTPS', () => {
  assert.equal(isCurrentPaidBooking(booking, Date.parse('2026-11-26T20:00:00Z')), true);
  assert.equal(isCurrentPaidBooking(booking, Date.parse('2026-11-26T19:59:59Z')), false);
  assert.equal(isHttpsUrl('https://example.com/gear'), true);
  for (const url of ['javascript:alert(1)', 'http://example.com', '/local', 'bad']) assert.equal(isHttpsUrl(url), false);
});
