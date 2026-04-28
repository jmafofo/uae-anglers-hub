import { ExternalLink } from 'lucide-react';
import { pickAndRecordAd, type Placement, type AdContext } from '@/lib/ads';

/**
 * Server-rendered ad placement.
 *
 * On render, picks the highest-scoring active campaign for the
 * given placement+context, records the impression, and renders
 * the creative with a UAE-required "Sponsored" disclosure chip.
 * Click-throughs go via /api/ads/click for first-party attribution.
 *
 * Returns null when there's no eligible campaign — the slot just
 * disappears. Premium-user gating is not yet enforced for web
 * (would require Supabase SSR cookie reading); the mobile API
 * does enforce premium-bypass via Bearer token.
 */
export async function AdSlot({
  placement,
  context = {},
  className = '',
}: {
  placement: Placement;
  context?: AdContext;
  className?: string;
}) {
  const ad = await pickAndRecordAd(placement, context, null);
  if (!ad) return null;

  const clickHref = `/api/ads/click?cid=${ad.id}&iid=${ad.impression_id}`;

  return (
    <aside
      className={
        'relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent ' +
        className
      }
      aria-label="Sponsored content"
    >
      {/* Disclosure — required by UAE National Media Council */}
      <div className="absolute top-3 right-3 z-10">
        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/40 backdrop-blur-sm">
          Sponsored
        </span>
      </div>

      <a
        href={clickHref}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex flex-col sm:flex-row gap-4 p-5 group"
      >
        {ad.image_url && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={ad.image_url}
            alt=""
            className="w-full sm:w-32 sm:h-32 h-40 object-cover rounded-xl border border-white/10 shrink-0 group-hover:scale-[1.02] transition-transform duration-500"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {ad.sponsor_logo && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={ad.sponsor_logo} alt={ad.sponsor_name} className="w-5 h-5 rounded object-cover" />
            )}
            <span className="text-xs text-amber-200/80 font-medium">{ad.sponsor_name}</span>
          </div>

          <h3 className="text-white font-bold text-lg leading-snug group-hover:text-amber-200 transition-colors">
            {ad.headline}
          </h3>

          {ad.body && (
            <p className="text-gray-300 text-sm mt-1 line-clamp-2">{ad.body}</p>
          )}

          <div className="mt-3 inline-flex items-center gap-1 text-amber-300 group-hover:text-amber-200 text-sm font-semibold">
            {ad.cta_text}
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </a>
    </aside>
  );
}
