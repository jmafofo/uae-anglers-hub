/**
 * /creators/[username]
 *
 * Public creator profile page.
 * Shows:
 *  - Creator bio + YouTube channel link
 *  - All public catches logged from Ocean Sentinel
 *  - YouTube video thumbnails when a youtube_url was provided
 *  - Fishing spot breakdown
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYouTubeThumb(url: string): string | null {
  try {
    const u = new URL(url);
    let vid: string | null = null;
    if (u.hostname.includes('youtu.be')) {
      vid = u.pathname.slice(1).split('?')[0];
    } else if (u.hostname.includes('youtube.com')) {
      vid = u.searchParams.get('v');
      if (!vid) {
        // /shorts/ID or /embed/ID
        const match = u.pathname.match(/\/(shorts|embed|v)\/([^/?]+)/);
        vid = match?.[2] ?? null;
      }
    }
    return vid ? `https://img.youtube.com/vi/${vid}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7)  return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCreator(username: string) {
  const { data } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, creator_bio, youtube_channel, is_creator, total_catches, created_at, emirate')
    .eq('username', username)
    .maybeSingle();
  return data;
}

async function getCreatorCatches(userId: string) {
  const { data } = await sb
    .from('catches')
    .select('id, species, scientific_name, weight_kg, length_cm, bait, technique, location_name, latitude, longitude, emirate, photo_url, notes, caught_at, youtube_url, identification_status, identify_confidence, spot_id')
    .eq('user_id', userId)
    .eq('is_public', true)
    .eq('identification_status', 'identified')
    .order('caught_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const creator = await getCreator(params.username);
  if (!creator) return { title: 'Creator not found' };
  return {
    title: `${creator.display_name ?? creator.username} — UAE Angler Creator`,
    description: creator.creator_bio ?? creator.bio ?? `Fishing catches and spots by ${creator.username}`,
  };
}

export default async function CreatorPage({ params }: { params: { username: string } }) {
  const creator = await getCreator(params.username);
  if (!creator) notFound();

  const catches = await getCreatorCatches(creator.id);

  // Stats
  const withVideo = catches.filter(c => c.youtube_url);
  const speciesSet = new Set(catches.map(c => c.species));
  const spotSet    = new Set(catches.map(c => c.location_name).filter(Boolean));

  return (
    <main className="min-h-screen bg-[#050e1f] text-white">

      {/* ── Hero banner ──────────────────────────────────────────────── */}
      <div className="border-b border-[#12305a] bg-gradient-to-b from-[#0a1628] to-[#050e1f]">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#0d1f3c] border-2 border-[#00d4aa] flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />
              ) : (
                <span>🎣</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black">{creator.display_name ?? creator.username}</h1>
                {creator.is_creator && (
                  <span className="text-xs font-bold tracking-widest text-[#00d4aa] border border-[#00d4aa44] bg-[#00d4aa11] px-2 py-0.5 rounded">
                    ◆ CREATOR
                  </span>
                )}
              </div>
              <p className="text-[#6a9fc0] text-sm mt-0.5">@{creator.username}</p>

              {(creator.creator_bio ?? creator.bio) && (
                <p className="text-[#aac8e0] text-sm mt-3 max-w-xl leading-relaxed">
                  {creator.creator_bio ?? creator.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {creator.youtube_channel && (
                  <a
                    href={creator.youtube_channel}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    YouTube Channel
                  </a>
                )}
                {creator.emirate && (
                  <span className="text-xs text-[#6a9fc0]">📍 {creator.emirate}</span>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-8">
            {[
              { label: 'CATCHES',   value: catches.length },
              { label: 'SPECIES',   value: speciesSet.size },
              { label: 'SPOTS',     value: spotSet.size },
              { label: 'ON VIDEO',  value: withVideo.length },
            ].map(s => (
              <div key={s.label} className="bg-[#0d1f3c] border border-[#12305a] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#00d4aa]">{s.value}</p>
                <p className="text-[9px] font-bold tracking-widest text-[#6a9fc0] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catches feed ──────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs font-bold tracking-widest text-[#00d4aa]">// CATCH_LOG</span>
          <div className="flex-1 h-px bg-[#12305a]" />
          <span className="text-xs text-[#6a9fc0]">{catches.length} logged</span>
        </div>

        {catches.length === 0 ? (
          <div className="text-center py-20 text-[#6a9fc0]">
            <p className="text-4xl mb-4">🎣</p>
            <p className="font-semibold">No catches logged yet</p>
            <p className="text-sm mt-2">Download Ocean Sentinel to start logging catches</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {catches.map(c => (
              <CatchCard key={c.id} catch={c} />
            ))}
          </div>
        )}
      </div>

      {/* ── Ocean Sentinel CTA ────────────────────────────────────────── */}
      <div className="border-t border-[#12305a] bg-[#0a1628] mt-8">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p className="text-[#6a9fc0] text-xs font-bold tracking-widest mb-3">// POWERED BY</p>
          <h2 className="text-xl font-black mb-2">
            Log your catches with <span className="text-[#00d4aa]">Ocean Sentinel</span>
          </h2>
          <p className="text-[#6a9fc0] text-sm max-w-md mx-auto mb-6">
            AI fish identification, offline-capable, GPS logging. Catches sync directly to your UAE Angler creator profile.
          </p>
          <Link
            href="/ocean-sentinel"
            className="inline-flex items-center gap-2 bg-[#00d4aa] text-[#050e1f] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#00bfa0] transition-colors"
          >
            Get Ocean Sentinel →
          </Link>
        </div>
      </div>
    </main>
  );
}

// ── CatchCard component ───────────────────────────────────────────────────────

function CatchCard({ catch: c }: { catch: any }) {
  const thumb = c.youtube_url ? getYouTubeThumb(c.youtube_url) : null;
  const conf  = c.identify_confidence != null ? Math.round(c.identify_confidence * 100) : null;
  const confColor = conf == null ? '#6a9fc0' : conf >= 80 ? '#00d4aa' : conf >= 55 ? '#ffb74d' : '#ef5350';

  return (
    <div className="bg-[#0d1f3c] border border-[#12305a] rounded-2xl overflow-hidden hover:border-[#1a4070] transition-colors">
      <div className="flex gap-0">

        {/* YouTube thumbnail — shown when video URL present */}
        {thumb && (
          <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="relative flex-shrink-0 w-36 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb} alt="YouTube thumbnail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </a>
        )}

        {/* Main content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{c.species}</h3>
              {c.scientific_name && (
                <p className="text-xs text-[#6a9fc0] italic truncate">{c.scientific_name}</p>
              )}
            </div>
            {conf != null && (
              <span className="text-xs font-bold flex-shrink-0" style={{ color: confColor }}>
                {conf}% ID
              </span>
            )}
          </div>

          {/* Details row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {c.weight_kg && (
              <span className="text-xs text-[#aac8e0]">⚖️ {c.weight_kg} kg</span>
            )}
            {c.length_cm && (
              <span className="text-xs text-[#aac8e0]">📏 {c.length_cm} cm</span>
            )}
            {c.bait && (
              <span className="text-xs text-[#aac8e0]">🪱 {c.bait}</span>
            )}
            {c.technique && (
              <span className="text-xs text-[#aac8e0]">🎣 {c.technique}</span>
            )}
          </div>

          {/* Location + time */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {c.location_name && (
              <span className="text-xs text-[#6a9fc0]">📍 {c.location_name}</span>
            )}
            {c.latitude && c.longitude && !c.location_name && (
              <span className="text-xs text-[#6a9fc0]">
                📍 {Number(c.latitude).toFixed(4)}°N {Number(c.longitude).toFixed(4)}°E
              </span>
            )}
            <span className="text-xs text-[#2a4a6a]">
              {timeAgo(c.caught_at)}
            </span>
            {c.youtube_url && (
              <a
                href={c.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                Watch video
              </a>
            )}
          </div>

          {c.notes && (
            <p className="text-xs text-[#6a9fc0] mt-2 line-clamp-2 italic">"{c.notes}"</p>
          )}
        </div>
      </div>
    </div>
  );
}
