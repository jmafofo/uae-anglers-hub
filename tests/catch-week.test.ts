import assert from 'node:assert/strict';
import test from 'node:test';
import { catchWeek } from '../lib/catch-week';

test('weekly leaderboard rolls over Monday midnight in Dubai, before UTC Monday', () => {
  assert.equal(catchWeek(new Date('2026-11-29T19:59:59Z')).start, '2026-11-22T20:00:00.000Z');
  assert.equal(catchWeek(new Date('2026-11-29T20:00:00Z')).start, '2026-11-29T20:00:00.000Z');
  assert.equal(catchWeek(new Date('2026-11-29T20:00:00Z')).end, '2026-12-06T20:00:00.000Z');
});
test('week is stable across year boundary and has a human readable date range', () => {
  const week = catchWeek(new Date('2027-01-01T00:00:00Z'));
  assert.equal(week.start, '2026-12-27T20:00:00.000Z');
  assert.equal(week.end, '2027-01-03T20:00:00.000Z');
  assert.equal(week.label, '28 Dec – 3 Jan');
});
