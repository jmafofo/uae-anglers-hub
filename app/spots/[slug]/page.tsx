import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Fish, Clock, Building2, ArrowLeft, Navigation, BadgeCheck } from 'lucide-react';
import { fishingSpots, getSpotBySlug, getSpotImage, getSpotGallery } from '@/lib/spots';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return fishingSpots.map((spot) => ({ slug: spot.slug }));
}

// Custom SEO descriptions for high-priority spots
const CUSTOM_DESCRIPTIONS: Record<string, string> = {
  'hameem-beach':
    'Hameem Beach is one of Abu Dhabi\'s best-kept fishing secrets — a pristine, uncrowded shoreline with crystal-clear water, minimal fishing pressure, and excellent catches of Hammour, Kingfish, Barracuda, Trevally and Emperor Fish. Ideal for camping and night fishing. GPS coordinates and access guide included.',
  'al-zorah-nature-reserve':
    'Al Zorah Nature Reserve in Ajman is a stunning mangrove fishing destination home to flamingos, Mullet, Trevally, Barracuda and Sea Bass. Fish the flats at high tide by kayak or from shore. One of the most scenic fishing spots in the UAE.',
  'al-mamzah-beach':
    'Al Mamzah Beach on the Dubai-Sharjah border offers sheltered, calm water and year-round fishing for Kingfish, Queenfish, Trevally and Bream. A family-friendly public beach park with excellent early morning sessions.',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const spot = getSpotBySlug(slug);
  if (!spot) return {};

  const speciesList = spot.species.slice(0, 5).join(', ');
  const description =
    CUSTOM_DESCRIPTIONS[slug] ??
    `Fish for ${speciesList} at ${spot.name} in ${spot.emirate}. ${spot.accessType} access. Best time: ${spot.bestTime}. GPS coordinates, facilities, and local tips.`;

  return {
    title: `${spot.name} Fishing Spot — ${spot.emirate}, UAE`,
    description,
    openGraph: {
      title: `${spot.name} — UAE Fishing Spot`,
      description,
      url: `https://uaeangler.com/spots/${spot.slug}`,
    },
  };
}

export default async function SpotPage({ params }: PageProps) {
  const { slug } = await params;
  const spot = getSpotBySlug(slug);
  if (!spot) notFound();

  const googleMapsUrl = `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${spot.latitude},${spot.longitude}&navigate=yes`;
  const gallery = getSpotGallery(spot.slug); // extra photos beyond the hero

  return (
    <div className="min-h-screen pb-16">
      {/* Hero image */}
      <div className="relative w-full h-64 sm:h-80 pt-14">
        <Image
          src={getSpotImage(spot.slug, spot.accessType)}
          alt={spot.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 max-w-3xl mx-auto">
          <Link href="/spots" className="inline-flex items-center gap-1.5 text-gray-300 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> All spots
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">{spot.name}</h1>
          <p className="text-gray-300 text-sm mt-1 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{spot.emirate}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Badges + GPS */}
        <div className="mb-8">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-3 py-1 rounded-full">
              {spot.accessType}
            </span>
          </div>
          <p className="text-gray-500 text-sm">GPS: {spot.latitude}, {spot.longitude}</p>
        </div>

        {/* Navigate buttons */}
        <div className="flex gap-3 mb-10">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Open in Google Maps
          </a>
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 hover:border-white text-gray-300 hover:text-white text-sm font-semibold transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Open in Waze
          </a>
        </div>

        {/* Photo gallery — only shown when 2+ local photos exist */}
        {gallery.length > 1 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Photos</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
              {gallery.map((src, i) => (
                <div
                  key={src}
                  className="relative shrink-0 w-64 h-44 rounded-xl overflow-hidden snap-start"
                >
                  <Image
                    src={src}
                    alt={`${spot.name} photo ${i + 1}`}
                    fill
                    sizes="256px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {/* Species */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Fish className="w-4 h-4 text-teal-400" />
              <h2 className="font-semibold text-white">Species Found Here</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {spot.species.map((s) => (
                <span
                  key={s}
                  className="text-xs bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Best time */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-teal-400" />
              <h2 className="font-semibold text-white">Best Time to Fish</h2>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{spot.bestTime}</p>
          </div>

          {/* Access */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-teal-400" />
              <h2 className="font-semibold text-white">Access</h2>
            </div>
            <p className="text-gray-300 text-sm">{spot.access}</p>
          </div>

          {/* Facilities */}
          <div className="p-5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-teal-400" />
              <h2 className="font-semibold text-white">Facilities</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {spot.facilities.map((f) => (
                <span
                  key={f}
                  className="text-xs bg-white/5 text-gray-400 border border-white/10 px-2.5 py-1 rounded-full"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Featured Tackle Partner slot (Business tier sponsorship) */}
        <div className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <BadgeCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-0.5">Featured Tackle Partner</p>
              <p className="text-sm text-gray-500 italic">Sponsor this spot page — your shop here</p>
            </div>
          </div>
          <Link
            href="/advertise#pricing"
            className="shrink-0 text-xs font-semibold text-teal-400 hover:text-teal-300 border border-teal-500/30 hover:border-teal-400 px-3 py-1.5 rounded-lg transition-all whitespace-nowrap"
          >
            Advertise here →
          </Link>
        </div>

        {/* CTA */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-teal-900/30 to-transparent border border-teal-500/20 text-center">
          <h3 className="font-bold text-white mb-2">Fished here before?</h3>
          <p className="text-gray-400 text-sm mb-5">
            Log your catch, share tips, and help other UAE anglers find the best spots.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
          >
            Join UAE Anglers Hub — Free
          </Link>
        </div>

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Place',
              name: spot.name,
              description: `Fishing spot in ${spot.emirate}, UAE. Species: ${spot.species.join(', ')}.`,
              geo: {
                '@type': 'GeoCoordinates',
                latitude: spot.latitude,
                longitude: spot.longitude,
              },
              address: {
                '@type': 'PostalAddress',
                addressRegion: spot.emirate,
                addressCountry: 'AE',
              },
              url: `https://uaeangler.com/spots/${spot.slug}`,
            }),
          }}
        />
      </div>
    </div>
  );
}
