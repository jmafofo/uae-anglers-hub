import Link from 'next/link';
import { CalendarDays, CloudSun, Fish, Navigation, Thermometer, Wind } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { windVerdict } from '@/lib/events';

export const revalidate = 1800; // 30 min

interface Hourly {
  time: string[];
  wind_speed_10m: number[];
}

/** Lowest-wind 3-hour daylight window today — the practical "go now" advice. */
function bestWindow(hourly: Hourly): string | null {
  const now = new Date();
  const todayDubai = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' });
  let bestStart = -1;
  let bestAvg = Infinity;
  for (let i = 0; i + 2 < hourly.time.length; i++) {
    if (!hourly.time[i].startsWith(todayDubai)) continue;
    const hour = Number(hourly.time[i].slice(11, 13));
    if (hour < 4 || hour > 18) continue;
    const avg = (hourly.wind_speed_10m[i] + hourly.wind_speed_10m[i + 1] + hourly.wind_speed_10m[i + 2]) / 3;
    if (avg < bestAvg) {
      bestAvg = avg;
      bestStart = hour;
    }
  }
  if (bestStart < 0) return null;
  const fmt = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;
  return `${fmt(bestStart)}–${fmt((bestStart + 3) % 24)}`;
}

/**
 * "Today in the UAE" — the daily-glance strip: current conditions, the
 * best fishing window today, and community pulse. The answer to
 * "should I go fishing today?" in one look.
 */
export async function TodayPanel() {
  let temp: number | null = null;
  let wind: number | null = null;
  let window_: string | null = null;
  let catchesToday = 0;
  let tripsThisWeek = 0;

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=25.26&longitude=55.33&current=temperature_2m,wind_speed_10m&hourly=wind_speed_10m&forecast_days=2&timezone=Asia%2FDubai',
      { next: { revalidate: 1800 } },
    );
    const json = await res.json();
    temp = json.current?.temperature_2m ?? null;
    wind = json.current?.wind_speed_10m ?? null;
    if (json.hourly) window_ = bestWindow(json.hourly as Hourly);
  } catch { /* conditions optional */ }

  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    const dayStart = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }) + 'T00:00:00+04:00';
    const [catches, trips] = await Promise.all([
      sb.from('catches').select('*', { count: 'exact', head: true }).eq('is_public', true).gte('caught_at', dayStart),
      sb.from('events').select('*', { count: 'exact', head: true }).is('cancelled_at', null)
        .gt('starts_at', new Date().toISOString())
        .lt('starts_at', new Date(Date.now() + 7 * 86400e3).toISOString()),
    ]);
    catchesToday = catches.count ?? 0;
    tripsThisWeek = trips.count ?? 0;
  } catch { /* counts optional */ }

  if (temp == null && catchesToday === 0 && tripsThisWeek === 0) return null;
  const verdict = wind != null ? windVerdict(wind) : null;

  return (
    <section aria-label="Today in the UAE" className="border-b border-[#e1e7eb] bg-white">
      <div className="coastal-wrap flex flex-wrap items-center gap-x-8 gap-y-4 py-5">
        <div>
          <p className="coastal-eyebrow !text-[10px]">Today in the UAE</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {temp != null && (
              <span className="flex items-center gap-1.5 text-sm text-[#18333f]">
                <Thermometer size={15} className="text-[#23675e]" /> {Math.round(temp)}°C
              </span>
            )}
            {wind != null && (
              <span className="flex items-center gap-1.5 text-sm text-[#18333f]">
                <Wind size={15} className="text-[#23675e]" /> {Math.round(wind)} km/h
              </span>
            )}
            {verdict && (
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                verdict.tone === 'good' ? 'bg-[#e7f2ee] text-[#205b52]' : verdict.tone === 'fair' ? 'bg-[#faf3e3] text-[#8a651c]' : 'bg-red-50 text-red-700'
              }`}>
                {verdict.label}
              </span>
            )}
            {window_ && (
              <span className="flex items-center gap-1.5 text-sm text-[#5b6b77]">
                <CloudSun size={15} className="text-[#23675e]" /> best window <strong className="text-[#18333f]">{window_}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="ms-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/community" className="flex items-center gap-1.5 text-[#5b6b77] hover:text-[#23675e]">
            <Fish size={15} className="text-[#23675e]" />
            <strong className="text-[#18333f]">{catchesToday}</strong> catches logged today
          </Link>
          <Link href="/trips" className="flex items-center gap-1.5 text-[#5b6b77] hover:text-[#23675e]">
            <CalendarDays size={15} className="text-[#23675e]" />
            <strong className="text-[#18333f]">{tripsThisWeek}</strong> expeditions this week
          </Link>
          <Link
            href="/weather"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#23675e] bg-[#23675e] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#174e47]"
          >
            <Navigation size={13} /> Plan today
          </Link>
        </div>
      </div>
    </section>
  );
}
