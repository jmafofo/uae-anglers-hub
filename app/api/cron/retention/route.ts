/**
 * GET /api/cron/retention — Vercel Cron (every 30 min)
 *
 * Retention triggers:
 *   A. Expedition reminders — push to RSVPed anglers + organizer ~24 h and
 *      ~1 h before a trip starts (deduped via notification_log).
 *   B. Crown watch — detects when the weekly Hall of Fame king changes and
 *      notifies the new king (crowned) and the previous one (dethroned).
 *
 * Notifications are inserted into public.notifications; the existing DB
 * trigger → /api/push/deliver pipeline turns them into Expo pushes.
 *
 * Auth: Authorization: Bearer $CRON_SECRET (Vercel sends it automatically
 * when CRON_SECRET is set in env).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { getWeeklyKings } from '@/lib/crowns';
import { eventDateLabel } from '@/lib/events';

export const dynamic = 'force-dynamic';

interface EventRow {
  id: string;
  title: string;
  starts_at: string;
  created_by: string;
  location_name: string | null;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const results = { reminders24h: 0, reminders1h: 0, crownEvents: 0, errors: [] as string[] };

  /** Insert a notification if this exact trigger hasn't been sent before. */
  async function notifyOnce(
    kind: string,
    refId: string,
    userId: string,
    type: string,
    title: string,
    body: string | null,
    link: string | null,
  ) {
    const { error: logErr } = await admin
      .from('notification_log')
      .insert({ kind, ref_id: refId, user_id: userId });
    if (logErr) return; // unique violation = already sent
    const { error } = await admin
      .from('notifications')
      .insert({ user_id: userId, type, title, body, link });
    if (error) results.errors.push(`notify ${kind}/${userId}: ${error.message}`);
  }

  // ── A. Expedition reminders ────────────────────────────────────────────
  try {
    const now = Date.now();
    const windows: Array<{ kind: string; label: string; minMs: number; maxMs: number }> = [
      { kind: 'event_reminder_24h', label: 'tomorrow', minMs: 23.5 * 3600e3, maxMs: 24.5 * 3600e3 },
      { kind: 'event_reminder_1h', label: 'in about an hour', minMs: 45 * 60e3, maxMs: 75 * 60e3 },
    ];

    const { data: upcoming } = await admin
      .from('events')
      .select('id, title, starts_at, created_by, location_name')
      .is('cancelled_at', null)
      .gt('starts_at', new Date(now + 45 * 60e3).toISOString())
      .lt('starts_at', new Date(now + 25 * 3600e3).toISOString())
      .limit(100);

    for (const event of (upcoming ?? []) as EventRow[]) {
      const startMs = Date.parse(event.starts_at);
      for (const w of windows) {
        const delta = startMs - now;
        if (delta < w.minMs || delta >= w.maxMs) continue;

        const { data: rsvps } = await admin
          .from('event_rsvps')
          .select('user_id, status')
          .eq('event_id', event.id)
          .in('status', ['going', 'maybe']);
        const recipients = new Set<string>((rsvps ?? []).map((r) => r.user_id));
        recipients.add(event.created_by);

        const where = event.location_name ? ` at ${event.location_name}` : '';
        for (const userId of recipients) {
          await notifyOnce(
            w.kind,
            event.id,
            userId,
            'event_reminder',
            `Expedition ${w.label}: ${event.title}`,
            `Starts ${eventDateLabel(event.starts_at)}${where}. Tight lines!`,
            `/trips/${event.id}`,
          );
          if (w.kind === 'event_reminder_24h') results.reminders24h++;
          else results.reminders1h++;
        }
      }
    }
  } catch (e) {
    results.errors.push(`reminders: ${(e as Error).message}`);
  }

  // ── A2. Expire boosts whose boosted_until has passed ───────────────────
  try {
    const { error } = await admin.rpc('expire_boosts');
    if (error) results.errors.push(`expire_boosts: ${error.message}`);
  } catch (e) {
    results.errors.push(`expire_boosts: ${(e as Error).message}`);
  }

  // ── B. Crown watch ─────────────────────────────────────────────────────
  try {
    const [reign] = await getWeeklyKings(1);
    if (reign) {
      const { data: stateRow } = await admin
        .from('app_state')
        .select('value')
        .eq('key', 'current_king')
        .maybeSingle();
      const previous = stateRow?.value as { userId?: string; name?: string; weekStart?: string } | undefined;

      if (previous?.userId && previous.userId !== reign.userId && previous.weekStart === reign.weekStart) {
        // Dethroned mid-week — someone just passed the king
        await notifyOnce(
          'crown_dethroned',
          `${reign.weekStart}:${previous.userId}`,
          previous.userId,
          'crown_dethroned',
          'Your crown is under attack! 👑',
          `${reign.name} just passed you with a ${reign.weightKg} kg ${reign.species ?? 'catch'}. Reclaim the Hall of Fame!`,
          '/hall-of-fame',
        );
        results.crownEvents++;
      }
      if (previous?.userId !== reign.userId) {
        await notifyOnce(
          'crown_crowned',
          `${reign.weekStart}:${reign.userId}`,
          reign.userId,
          'crown_crowned',
          'You wear the crown! 👑',
          `Your ${reign.weightKg} kg ${reign.species ?? 'catch'} is the biggest of the week in the UAE.`,
          '/hall-of-fame',
        );
        results.crownEvents++;
      }
      await admin
        .from('app_state')
        .upsert({ key: 'current_king', value: { userId: reign.userId, name: reign.name, weekStart: reign.weekStart }, updated_at: new Date().toISOString() });
    }
  } catch (e) {
    results.errors.push(`crown: ${(e as Error).message}`);
  }

  return NextResponse.json({ ok: results.errors.length === 0, ...results });
}
