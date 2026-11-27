import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Fish, ChevronRight, MapPin, Ruler, Weight, Layers, AlertTriangle } from 'lucide-react';
import { fishSpecies, getSpeciesBySlug, getRelatedSpecies } from '@/lib/species';
import speciesPhotos, { habitatPhotoCredits } from '@/lib/species-images';
import ResearchPanel from './ResearchPanel';
import RegulationAlert from './RegulationAlert';
import Byline from '@/components/Byline';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return fishSpecies.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const species = getSpeciesBySlug(slug);
  if (!species) return {};

  const pageUrl = `https://uaeangler.com/species/${species.slug}`;
  const ogImageUrl = `https://uaeangler.com/api/og?title=${encodeURIComponent(species.name)}&subtitle=${encodeURIComponent(species.scientificName)}`;

  return {
    title: `${species.name} (${species.scientificName}) — UAE Fish Species`,
    description: `${species.description} Found in: ${species.regions.join(', ')}. Conservation status: ${species.conservationStatus}. Depth: ${species.depth}.`,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${species.name} — UAE Fish Species Guide`,
      description: species.description,
      url: pageUrl,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${species.name} — UAE Fish Species`,
        },
      ],
    },
  };
}

export default async function SpeciesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const species = getSpeciesBySlug(slug);
  if (!species) notFound();

  const related = getRelatedSpecies(species);
  const credit = habitatPhotoCredits[species.slug];
  const heroPhoto = (speciesPhotos as Record<string, string[]>)[species.slug]?.[0];

  const pageUrl = `https://uaeangler.com/species/${species.slug}`;
  const photoUrl = heroPhoto ? `https://uaeangler.com${heroPhoto}` : undefined;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Taxon',
        name: species.name,
        alternateName: species.scientificName,
        description: species.description,
        url: pageUrl,
        ...(photoUrl && { image: photoUrl }),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://uaeangler.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Fish Species',
            item: 'https://uaeangler.com/species',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: species.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <div className="min-h-screen">
        <header className="bg-[#edf4f3] px-4 pb-10 pt-24 text-[#182e3c] sm:pb-14">
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <Link href="/species" className="hover:text-teal-800">Species Guide</Link>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{species.name}</span>
            </nav>
            <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
              <figure className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {heroPhoto ? <a href={heroPhoto} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size photo of ${species.name} in a new tab`} className="relative block aspect-[4/3] sm:aspect-[3/2] focus-visible:outline-4 focus-visible:outline-teal-700">
                  <Image src={heroPhoto} alt={species.name} fill preload sizes="(max-width:1024px) 100vw, 780px" className="object-contain p-4 sm:p-6" />
                </a> : <div className="flex aspect-[3/2] flex-col items-center justify-center gap-4 p-8 text-center text-slate-500"><Fish size={72} strokeWidth={1} /><p>A verified identification photo is not yet available.</p></div>}
                <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4 text-sm text-slate-600">
                  <span>{heroPhoto ? 'Identification photo · shown without cropping' : 'Species reference photo'}</span>
                  {heroPhoto && <a href={heroPhoto} target="_blank" rel="noopener noreferrer" className="font-semibold text-teal-800 underline underline-offset-4">View full-size ↗</a>}
                  {credit && <span className="w-full text-xs leading-relaxed">Photo: {credit.author} · <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline">Original source</a> · <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">{credit.license}</a>. Original photograph; displayed without cropping.</span>}
                </figcaption>
              </figure>
              <div className="min-w-0">
                <p className="coastal-eyebrow">{species.family} · {species.habitatCategory}</p>
                <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">{species.name}</h1>
                <p className="mt-3 text-lg italic text-slate-600">{species.scientificName}</p>
                <p className="mt-5 text-xl text-teal-800" dir="auto">{species.localName || 'Local name awaiting verification'}</p>
                {!!species.aliases?.length && <p className="mt-4 text-sm leading-relaxed text-slate-600">Also known as: {species.aliases.join(' · ')}</p>}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">{species.conservationStatus}</span>
                  {species.dangerLevel !== 'none' && <span className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm text-amber-900"><AlertTriangle size={16} />{species.dangerLevel}</span>}
                </div>
                {species.conservationScope && <p className="mt-3 text-xs text-slate-600">{species.conservationScope}</p>}
              </div>
            </div>
            {((speciesPhotos as Record<string, string[]>)[species.slug]?.length ?? 0) > 1 && <div className="mt-6 flex flex-wrap gap-4" aria-label="More identification photos">
              {(speciesPhotos as Record<string, string[]>)[species.slug].slice(1).map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noopener noreferrer" className="relative block h-32 w-48 rounded-xl border border-slate-200 bg-white" aria-label={`Open additional photo ${index + 2} of ${species.name}`}><Image src={photo} alt={`${species.name}, additional photo ${index + 2}`} fill sizes="192px" className="object-contain p-3" /></a>)}
            </div>}
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Regulations — server component, shows only if rules exist */}
              <RegulationAlert slug={species.slug} />

              {/* Description */}
              <section>
                <p className="text-gray-300 text-lg leading-relaxed">{species.description}</p>
              </section>

              {/* Stats grid */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-4">Species Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <Ruler className="w-4 h-4 text-teal-400 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Max Length</p>
                    <p className="text-white font-semibold">{species.maxSizeCm === null ? 'Not verified' : `${species.maxSizeCm} cm`}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <Weight className="w-4 h-4 text-teal-400 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Max Weight</p>
                    <p className="text-white font-semibold">{species.maxWeightKg === null ? 'Not verified' : `${species.maxWeightKg} kg`}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <Layers className="w-4 h-4 text-teal-400 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Depth Range</p>
                    <p className="text-white font-semibold">{species.depth}</p>
                  </div>
                </div>
              </section>

              {/* Diet */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Diet</h2>
                <p className="text-gray-400">{species.diet}</p>
              </section>

              {/* Habitat */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-2">Habitat</h2>
                <p className="text-gray-400">{species.habitat}</p>
              </section>

              {/* Local name */}
              {species.localName && (
                <section>
                  <h2 className="text-lg font-semibold text-white mb-2">Local Name (Arabic)</h2>
                  <p className="text-gray-400 text-xl">{species.localName}</p>
                </section>
              )}

              {/* Fun facts */}
              {species.funFacts.length > 0 && <section>
                <h2 className="text-lg font-semibold text-white mb-4">Fun Facts</h2>
                <ul className="space-y-3">
                  {species.funFacts.map((fact, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-300 text-sm leading-relaxed">{fact}</p>
                    </li>
                  ))}
                </ul>
              </section>}

              {/* Research papers */}
              <ResearchPanel slug={species.slug} />

              {/* Regions */}
              <section>
                <h2 className="text-lg font-semibold text-white mb-3">Found In</h2>
                <div className="flex flex-wrap gap-2">
                  {species.regions.map((r) => (
                    <span
                      key={r}
                      className="flex items-center gap-1.5 text-sm text-gray-300 bg-white/5 border border-white/10 px-3 py-1 rounded-full"
                    >
                      <MapPin className="w-3 h-3 text-teal-400" />
                      {r}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick info */}
              <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-4">
                <h3 className="font-semibold text-white">Quick Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Family</span>
                    <span className="text-gray-300">{species.family}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Habitat</span>
                    <span className="text-gray-300">{species.habitatCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Edibility</span>
                    <span className={`font-medium ${
                      species.edibility === 'Excellent' ? 'text-teal-400' :
                      species.edibility === 'Good' ? 'text-green-400' :
                      species.edibility === 'Fair' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{species.edibility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coast</span>
                    <span className="text-gray-300">{species.coast}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Danger</span>
                    <span className={`font-medium capitalize ${species.dangerLevel === 'none' ? 'text-gray-400' : 'text-orange-400'}`}>
                      {species.dangerLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="p-5 rounded-xl bg-teal-500/5 border border-teal-500/20">
                <Fish className="w-6 h-6 text-teal-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">Caught a {species.name}?</h3>
                <p className="text-gray-400 text-sm mb-4">Log your catch and contribute to UAE marine research.</p>
                <Link
                  href="/log-catch"
                  className="block text-center bg-teal-500 hover:bg-teal-400 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
                >
                  Log This Catch
                </Link>
              </div>
            </div>
          </div>

          {/* Related species */}
          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-white mb-6">Related Species ({species.family})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/species/${r.slug}`}
                    className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:border-teal-500/40 transition-all"
                  >
                    <h3 className="font-medium text-white group-hover:text-teal-400 transition-colors text-sm">
                      {r.name}
                    </h3>
                    <p className="text-gray-500 text-xs italic">{r.scientificName}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {species.sources && <section className="mb-6 rounded-xl border border-white/10 p-5">
            <h2 className="font-semibold text-white mb-3">References</h2>
            <ul className="space-y-2">{species.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-300 underline underline-offset-4">{source.title}</a></li>)}</ul>
            <p className="mt-3 text-xs text-gray-400">Local names vary between fishing communities and may refer to more than one species. Unverified details are marked explicitly.</p>
          </section>}
          <Byline sources={species.sources ? 'See linked references above' : 'MOCCAE, EAD, FAO species profiles'} reviewedAt={species.reviewedAt ?? 'June 2026'} />
        </div>
      </div>
    </>
  );
}
