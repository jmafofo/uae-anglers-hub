import { createClient } from '@supabase/supabase-js';
import { catchWeek } from './catch-week';

/**
 * Weekly kings — who wore the crown each week.
 * A week's king is the heaviest eligible catch in hall_of_fame_entries
 * for that week (same rule as the hall-of-fame leaderboard).
 */

export interface CrownReign {
  weekStart: string;
  weekLabel: string;
  userId: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  species: string | null;
  weightKg: number | null;
  catchId: string;
}

interface EntryRow {
  catch_id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  species: string | null;
  weight_kg: number | null;
  caught_at: string;
}

function anonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

/** Kings of the past `weeks` weeks, most recent first. Current week is
 *  included only when it has eligible catches (the reigning king). */
export async function getWeeklyKings(weeks = 8): Promise<CrownReign[]> {
  const current = catchWeek();
  const windows: Array<{ start: string; end: string; label: string }> = [];
  for (let i = 0; i < weeks; i++) {
    if (i === 0) windows.push(current);
    else {
      const prev = new Date(new Date(windows[windows.length - 1].start).getTime() - 60 * 1000);
      windows.push(catchWeek(prev));
    }
  }

  const oldest = windows[windows.length - 1].start;
  const { data } = await anonClient()
    .from('hall_of_fame_entries')
    .select('catch_id, user_id, username, display_name, avatar_url, species, weight_kg, caught_at')
    .gte('caught_at', oldest)
    .lte('caught_at', new Date().toISOString())
    .not('weight_kg', 'is', null)
    .order('weight_kg', { ascending: false })
    .limit(1000);

  const rows = (data ?? []) as EntryRow[];
  const reigns: CrownReign[] = [];
  for (const w of windows) {
    const winner = rows.find((r) => r.caught_at >= w.start && r.caught_at < w.end);
    if (winner) {
      reigns.push({
        weekStart: w.start,
        weekLabel: w.label,
        userId: winner.user_id,
        name: winner.display_name ?? winner.username ?? 'Anonymous angler',
        username: winner.username,
        avatarUrl: winner.avatar_url,
        species: winner.species,
        weightKg: winner.weight_kg,
        catchId: winner.catch_id,
      });
    }
  }
  return reigns;
}

/** Consecutive weeks the given user has held the crown, counting back
 *  from the current week. 0 means they don't hold it now. */
export function reignLength(reigns: CrownReign[], userId: string): number {
  let n = 0;
  for (const r of reigns) {
    if (r.userId !== userId) break;
    n++;
  }
  return n;
}

/** Total crown weeks ever held by a user (best-effort over the window). */
export async function getCrownCount(userId: string, weeks = 52): Promise<number> {
  const reigns = await getWeeklyKings(weeks);
  return reigns.filter((r) => r.userId === userId).length;
}
