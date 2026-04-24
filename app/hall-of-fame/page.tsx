import type { Metadata } from 'next';
import Link from 'next/link';
import { Crown, Fish, Scale, Ruler, Trophy, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { KingCrown } from '@/components/KingCrown';

export const metadata: Metadata = {
  title: 'Hall of Fame — UAE Anglers',
  description: 'The biggest catches of the week, month and year across the UAE. The top angler is coronated with a king\u2019s crown.',
};

export const revalidate = 300;

type Period = 'week' | 'month' | 'year' | 'all';
type Metric = 'weight' | 'length';

type Entry = {
  rank: number;
  catch_id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  species: string | null;
  scientific_name: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  photo_url: string | null;
  catch_emirate: string | null;
  location_name: string | null;
  caught_at: string;
};

type PageProps = {
  searchParams: Promise<{ period?: string; metric?: string; emirate?: string }>;
};

const PERIODS: { key: Period; label: string }[] = [
  { key: 'week',  label: 'This week'  },
  { key: 'month', label: 'This month' },
  { key: 'year',  label: 'This year'  },
  { key: 'all',   label: 'All time'   },
];

function coerce<T extends string>(v: string | undefined, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(v ?? '') ? (v as T) : fallback;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function metricValue(e: Entry, metric: Metric): string {
  if (metric === 'length' && e.length_cm != null) return `${e.length_cm} cm`;
  return e.weight_kg != null ? `${e.weight_kg} kg` : '—';
}

export default async function HallOfFamePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const period = coerce(raw.period, ['week', 'month', 'year', 'all'] as const, 'week');
  const metric = coerce(raw.metric, ['weight', 'length'] as const, 'weight');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data } = await supabase.rpc('hall_of_fame', {
    p_period:  period,
    p_metric:  metric,
    p_species: null,
    p_emirate: raw.emirate ?? null,
    p_limit:   10,
  });
  const entries = (data ?? []) as Entry[];
  const [king, ...rest] = entries;
  const periodLabel = PERIODS.find(p => p.key === period)!.label.toLowerCase();

  return (
    <div className="min-h-screen pt-20 px-4 pb-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-teal-400 text-sm font-medium mb-1">
            <Trophy className="w-4 h-4" />
            Hall of Fame
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1">Biggest catches</h1>
          <p className="text-gray-400">
            The top angler {periodLabel} wears the crown.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {PERIODS.map(p => (
            <Link
              key={p.key}
              href={`/hall-of-fame?period=${p.key}&metric=${metric}`}
              className={
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
                (p.key === period
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10')
              }
            >
              {p.label}
            </Link>
          ))}
          <div className="mx-2 w-px bg-white/10" />
          {(['weight', 'length'] as const).map(m => (
            <Link
              key={m}
              href={`/hall-of-fame?period=${period}&metric=${m}`}
              className={
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
                (m === metric
                  ? 'bg-teal-500 text-white border-teal-500'
                  : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10')
              }
            >
              {m === 'weight' ? <Scale className="w-3.5 h-3.5" /> : <Ruler className="w-3.5 h-3.5" />}
              {m === 'weight' ? 'Heaviest' : 'Longest'}
            </Link>
          ))}
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-24 text-gray-500 border border-dashed border-white/10 rounded-2xl">
            <Fish className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-1">No eligible catches {periodLabel}.</p>
            <p className="text-sm">Log an identified public catch with a weight to enter the leaderboard.</p>
          </div>
        ) : (
          <>
            {king && <KingPodium entry={king} metric={metric} />}
            {rest.length > 0 && (
              <ol className="mt-6 divide-y divide-white/5 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                {rest.map(e => (
                  <RankRow key={e.catch_id} entry={e} metric={metric} />
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KingPodium({ entry, metric }: { entry: Entry; metric: Metric }) {
  const name = entry.display_name ?? entry.username ?? 'Anonymous angler';
  return (
    <Link
      href={entry.username ? `/profile/${entry.username}` : `#`}
      className="block relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-6 md:p-8 group"
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        <div className="relative shrink-0">
          <Crown
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.6)]"
            strokeWidth={1.5}
            fill="currentColor"
            fillOpacity={0.25}
          />
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-[3px]">
            <div className="w-full h-full rounded-full overflow-hidden bg-gray-900 flex items-center justify-center">
              {entry.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={entry.avatar_url} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-amber-300">{initials(name)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="text-amber-300 text-xs font-bold tracking-wider mb-1">#1 — CROWNED</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{name}</h2>
          <div className="text-amber-200/90 text-sm mb-3">
            {entry.species ?? 'Unknown species'}
            {entry.scientific_name && (
              <em className="text-gray-400 ml-1">({entry.scientific_name})</em>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-200 px-3 py-1.5 rounded-lg font-bold">
              {metric === 'length' ? <Ruler className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
              {metricValue(entry, metric)}
            </span>
            {entry.catch_emirate && (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                {entry.catch_emirate}
              </span>
            )}
          </div>
        </div>

        {entry.photo_url && (
          <KingCrown
            src={entry.photo_url}
            alt={`${name}'s catch`}
            className="w-32 h-32 md:w-40 md:h-40 shrink-0"
            maxCrownPx={56}
          />
        )}
      </div>
    </Link>
  );
}

function RankRow({ entry, metric }: { entry: Entry; metric: Metric }) {
  const name = entry.display_name ?? entry.username ?? 'Anonymous angler';
  return (
    <li>
      <Link
        href={entry.username ? `/profile/${entry.username}` : `#`}
        className="flex items-center gap-4 p-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="w-8 text-center text-gray-500 font-bold text-sm">#{entry.rank}</div>
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center shrink-0">
          {entry.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={entry.avatar_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-gray-400">{initials(name)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold truncate">{name}</div>
          <div className="text-gray-400 text-sm truncate">
            {entry.species ?? 'Unknown'}{entry.catch_emirate ? ` · ${entry.catch_emirate}` : ''}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-teal-400 font-bold">{metricValue(entry, metric)}</div>
          <div className="text-gray-500 text-xs">
            {new Date(entry.caught_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </Link>
    </li>
  );
}
