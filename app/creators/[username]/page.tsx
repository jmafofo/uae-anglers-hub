/**
 * /creators/[username]
 *
 * Public creator profile page.
 * Shows social media links (YouTube, TikTok, Instagram, Facebook),
 * all public catches with video thumbnails (YouTube auto-extracted,
 * other platforms show a play badge), and a fishing stats summary.
 */

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── Video helpers ─────────────────────────────────────────────────────────────

/** Extract YouTube video ID from any youtube.com / youtu.be URL */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const m = u.pathname.match(/\/(shorts|embed|v)\/([^/?]+)/);
      return m?.[2] ?? null;
    }
  } catch {}
  return null;
}

type VideoPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'other';

function detectPlatform(url: string): VideoPlatform {
  try {
    const h = new URL(url).hostname;
    if (h.includes('youtube') || h.includes('youtu.be')) return 'youtube';
    if (h.includes('tiktok'))    return 'tiktok';
    if (h.includes('instagram')) return 'instagram';
    if (h.includes('facebook') || h.includes('fb.watch')) return 'facebook';
  } catch {}
  return 'other';
}

const PLATFORM_META: Record<VideoPlatform, { label: string; color: string }> = {
  youtube:   { label: 'YouTube',   color: '#ff0000' },
  tiktok:    { label: 'TikTok',    color: '#ff2d55' },
  instagram: { label: 'Instagram', color: '#e1306c' },
  facebook:  { label: 'Facebook',  color: '#1877f2' },
  other:     { label: 'Video',     color: '#6a9fc0' },
};

function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0)  return 'today';
  if (d === 1)  return 'yesterday';
  if (d < 7)   return `${d}d ago`;
  if (d < 30)  return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getCreator(username: string) {
  const { data } = await sb
    .from('profiles')
    .select('id, username, display_name, avatar_url, bio, creator_bio, is_creator, total_catches, created_at, emirate, youtube_channel, tiktok_handle, instagram_handle, facebook_page')
    .eq('username', username)
    .maybeSingle();
  return data;
}

async function getCreatorCatches(userId: string) {
  const { data } = await sb
    .from('catches')
    .select('id, species, scientific_name, weight_kg, length_cm, bait, technique, location_name, latitude, longitude, emirate, notes, caught_at, video_url, identification_status, identify_confidence')
    .eq('user_id', userId)
    .eq('is_public', true)
    .eq('identification_status', 'identified')
    .order('caught_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const c = await getCreator(username);
  if (!c) return { title: 'Creator not found' };
  return {
    title: `${c.display_name ?? c.username} — UAE Angler`,
    description: c.creator_bio ?? c.bio ?? `Fishing catches and spots by ${c.username}`,
  };
}

// ── Social link button ────────────────────────────────────────────────────────

function SocialLink({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
      style={{ color, borderColor: color + '44', backgroundColor: color + '11' }}
    >
      {icon}
      {label}
    </a>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CreatorPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const creator = await getCreator(username);
  if (!creator) notFound();

  const catches      = await getCreatorCatches(creator.id);
  const withVideo    = catches.filter(c => c.video_url);
  const speciesSet   = new Set(catches.map(c => c.species));
  const spotSet      = new Set(catches.map(c => c.location_name).filter(Boolean));

  const hasSocials = creator.youtube_channel || creator.tiktok_handle || creator.instagram_handle || creator.facebook_page;

  return (
    <main className="min-h-screen bg-[#050e1f] text-white">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[#12305a] bg-gradient-to-b from-[#0a1628] to-[#050e1f]">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-[#0d1f3c] border-2 border-[#00d4aa] flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
              {creator.avatar_url
                ? <img src={creator.avatar_url} alt={creator.username} className="w-full h-full object-cover" />
                : <span>🎣</span>}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black">{creator.display_name ?? creator.username}</h1>
                {creator.is_creator && (
                  <span className="text-[10px] font-bold tracking-widest text-[#00d4aa] border border-[#00d4aa44] bg-[#00d4aa11] px-2 py-0.5 rounded">
                    ◆ CREATOR
                  </span>
                )}
              </div>
              <p className="text-[#6a9fc0] text-sm mt-0.5">@{creator.username}{creator.emirate ? ` · ${creator.emirate}` : ''}</p>

              {(creator.creator_bio ?? creator.bio) && (
                <p className="text-[#aac8e0] text-sm mt-3 max-w-xl leading-relaxed">
                  {creator.creator_bio ?? creator.bio}
                </p>
              )}

              {/* Social links */}
              {hasSocials && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {creator.youtube_channel && (
                    <SocialLink href={creator.youtube_channel} color="#ff0000" label="YouTube" icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    } />
                  )}
                  {creator.tiktok_handle && (
                    <SocialLink href={creator.tiktok_handle} color="#ff2d55" label="TikTok" icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.56V6.78a4.85 4.85 0 01-1.07-.09z"/>
                      </svg>
                    } />
                  )}
                  {creator.instagram_handle && (
                    <SocialLink href={creator.instagram_handle} color="#e1306c" label="Instagram" icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    } />
                  )}
                  {creator.facebook_page && (
                    <SocialLink href={creator.facebook_page} color="#1877f2" label="Facebook" icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    } />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mt-8">
            {[
              { label: 'CATCHES',  value: catches.length },
              { label: 'SPECIES',  value: speciesSet.size },
              { label: 'SPOTS',    value: spotSet.size },
              { label: 'ON VIDEO', value: withVideo.length },
            ].map(s => (
              <div key={s.label} className="bg-[#0d1f3c] border border-[#12305a] rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-[#00d4aa]">{s.value}</p>
                <p className="text-[9px] font-bold tracking-widest text-[#6a9fc0] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Catch feed ───────────────────────────────────────────────── */}
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
            <p className="text-sm mt-2">Download Ocean Sentinel to start logging</p>
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
      <div className="border-t border-[#12305a] bg-[#0a1628] mt-4">
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <p className="text-[#6a9fc0] text-xs font-bold tracking-widest mb-3">// POWERED BY</p>
          <h2 className="text-xl font-black mb-2">
            Log your catches with <span className="text-[#00d4aa]">Ocean Sentinel</span>
          </h2>
          <p className="text-[#6a9fc0] text-sm max-w-md mx-auto mb-6">
            AI fish identification · GPS logging · offline-capable · syncs to your UAE Angler profile
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

// ── CatchCard ─────────────────────────────────────────────────────────────────

function CatchCard({ catch: c }: { catch: any }) {
  const platform  = c.video_url ? detectPlatform(c.video_url) : null;
  const ytId      = c.video_url && platform === 'youtube' ? getYouTubeId(c.video_url) : null;
  const ytThumb   = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;
  const platMeta  = platform ? PLATFORM_META[platform] : null;
  const conf      = c.identify_confidence != null ? Math.round(c.identify_confidence * 100) : null;
  const confColor = conf == null ? '#6a9fc0' : conf >= 80 ? '#00d4aa' : conf >= 55 ? '#ffb74d' : '#ef5350';

  return (
    <div className="bg-[#0d1f3c] border border-[#12305a] rounded-2xl overflow-hidden hover:border-[#1a4070] transition-colors">
      <div className="flex">

        {/* Video preview — YouTube gets real thumbnail, others get a styled badge */}
        {c.video_url && (
          <a href={c.video_url} target="_blank" rel="noopener noreferrer"
            className="relative flex-shrink-0 w-32 group bg-[#050e1f] flex items-center justify-center"
          >
            {ytThumb ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ytThumb} alt="video thumbnail" className="w-full h-full object-cover absolute inset-0" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <svg className="w-8 h-8 text-white opacity-80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </>
            ) : (
              /* Non-YouTube: show platform color block with play icon */
              <div className="w-full h-full min-h-[80px] flex flex-col items-center justify-center gap-1"
                style={{ backgroundColor: (platMeta?.color ?? '#333') + '22' }}>
                <svg className="w-7 h-7 opacity-70" viewBox="0 0 24 24" fill={platMeta?.color ?? '#fff'}>
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-[9px] font-bold tracking-wide" style={{ color: platMeta?.color }}>
                  {platMeta?.label}
                </span>
              </div>
            )}
          </a>
        )}

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-bold text-base truncate">{c.species}</h3>
              {c.scientific_name && (
                <p className="text-xs text-[#6a9fc0] italic truncate">{c.scientific_name}</p>
              )}
            </div>
            {conf != null && (
              <span className="text-xs font-bold flex-shrink-0" style={{ color: confColor }}>{conf}% ID</span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {c.weight_kg  && <span className="text-xs text-[#aac8e0]">⚖️ {c.weight_kg} kg</span>}
            {c.length_cm  && <span className="text-xs text-[#aac8e0]">📏 {c.length_cm} cm</span>}
            {c.bait       && <span className="text-xs text-[#aac8e0]">🪱 {c.bait}</span>}
            {c.technique  && <span className="text-xs text-[#aac8e0]">🎣 {c.technique}</span>}
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {(c.location_name || (c.latitude && c.longitude)) && (
              <span className="text-xs text-[#6a9fc0]">
                📍 {c.location_name ?? `${Number(c.latitude).toFixed(4)}°N ${Number(c.longitude).toFixed(4)}°E`}
              </span>
            )}
            <span className="text-xs text-[#2a4a6a]">{timeAgo(c.caught_at)}</span>
            {c.video_url && platMeta && (
              <a href={c.video_url} target="_blank" rel="noopener noreferrer"
                className="text-xs font-semibold flex items-center gap-1 hover:opacity-80"
                style={{ color: platMeta.color }}
              >
                ▶ Watch on {platMeta.label}
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
