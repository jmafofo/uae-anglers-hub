import Link from 'next/link';
import { MapPin, CirclePlay, Camera, CheckCircle2, ExternalLink, Flame, AlertTriangle, Anchor } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

type Waypoint = {
  id: string;
  latitude: number;
  longitude: number;
  kind: 'productive' | 'rocky' | 'snag' | 'dead' | 'launch' | 'parking' | 'mixed';
  label: string | null;
  photo_url: string | null;
  video_url: string | null;
  target_species: string[] | null;
  confirm_count: number;
  author?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_creator: boolean | null;
    youtube_channel: string | null;
    instagram_handle: string | null;
    tiktok_handle: string | null;
  } | null;
};

const KIND_STYLES: Record<Waypoint['kind'], { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  productive: { label: 'Productive', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: Flame },
  rocky:      { label: 'Rocky',      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',    icon: AlertTriangle },
  snag:       { label: 'Snag',       color: 'text-red-300 bg-red-500/10 border-red-500/30',          icon: AlertTriangle },
  dead:       { label: 'Dead',       color: 'text-gray-400 bg-white/5 border-white/10',              icon: MapPin },
  launch:     { label: 'Launch',     color: 'text-sky-300 bg-sky-500/10 border-sky-500/30',          icon: Anchor },
  parking:    { label: 'Parking',    color: 'text-gray-300 bg-white/5 border-white/10',              icon: MapPin },
  mixed:      { label: 'Mixed',      color: 'text-teal-300 bg-teal-500/10 border-teal-500/30',       icon: MapPin },
};

export async function CreatorWaypoints({ slug }: { slug: string }) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: spot } = await sb.from('spots').select('id').eq('slug', slug).eq('verified', true).maybeSingle();
  if (!spot) return null;

  const { data } = await sb
    .from('spot_waypoints')
    .select(`
      id, latitude, longitude, kind, label, photo_url, video_url,
      target_species, confirm_count,
      author:profiles!spot_waypoints_user_id_fkey(
        username, display_name, avatar_url,
        is_creator, youtube_channel, instagram_handle, tiktok_handle
      )
    `)
    .eq('spot_id', spot.id)
    .eq('verified', true)
    .eq('is_private', false)
    .order('confirm_count', { ascending: false })
    .limit(24);

  const waypoints = (data ?? []) as unknown as Waypoint[];
  if (waypoints.length === 0) return null;

  const creatorCount = waypoints.filter(w => w.author?.is_creator).length;

  return (
    <section className="mt-10 pt-8 border-t border-white/10">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Community pins</h2>
          <p className="text-gray-400 text-sm">
            Spots dropped by anglers along this stretch.
            {creatorCount > 0 && (
              <> <span className="text-teal-400">{creatorCount}</span> from verified creators.</>
            )}
          </p>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {waypoints.map(w => <WaypointCard key={w.id} w={w} />)}
      </ul>
    </section>
  );
}

function WaypointCard({ w }: { w: Waypoint }) {
  const kind = KIND_STYLES[w.kind];
  const KindIcon = kind.icon;
  const isCreator = Boolean(w.author?.is_creator && w.author?.username);

  return (
    <li className={
      'relative flex gap-3 p-3 rounded-xl border ' +
      (isCreator
        ? 'bg-gradient-to-br from-teal-500/[0.06] to-transparent border-teal-500/25'
        : 'bg-white/[0.02] border-white/10')
    }>
      {w.photo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={w.photo_url} alt={w.label ?? 'Waypoint'} className="w-20 h-20 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-white/20" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${kind.color}`}>
            <KindIcon className="w-3 h-3" />
            {kind.label}
          </span>
          {isCreator && <CreatorChip author={w.author!} />}
        </div>

        {w.label && <p className="text-white text-sm mt-1 line-clamp-2">{w.label}</p>}

        {w.target_species && w.target_species.length > 0 && (
          <p className="text-gray-400 text-xs mt-1 line-clamp-1">
            {w.target_species.slice(0, 3).join(', ')}
            {w.target_species.length > 3 && <span className="text-gray-600"> +{w.target_species.length - 3}</span>}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-xs">
          <span className="text-gray-500">
            {w.latitude.toFixed(4)}, {w.longitude.toFixed(4)}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-gray-500">{w.confirm_count} confirm{w.confirm_count === 1 ? '' : 's'}</span>
          {w.video_url && (
            <>
              <span className="text-gray-600">·</span>
              <a
                href={w.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-red-400 hover:text-red-300"
              >
                <CirclePlay className="w-3.5 h-3.5" />
                Watch
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function CreatorChip({ author }: { author: NonNullable<Waypoint['author']> }) {
  const username = author.username!;
  const handle = author.display_name ?? username;
  const PlatformIcon = author.instagram_handle && !author.youtube_channel ? Camera : CirclePlay;
  return (
    <Link
      href={`/creators/${username}`}
      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-200 border border-teal-500/40 font-medium hover:bg-teal-500/25 transition-colors"
    >
      <CheckCircle2 className="w-3 h-3" />
      <PlatformIcon className="w-3 h-3" />
      {handle}
    </Link>
  );
}
