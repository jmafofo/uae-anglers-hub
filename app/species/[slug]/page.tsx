import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fish, ChevronRight, MapPin, Ruler, Weight, Layers, AlertTriangle } from 'lucide-react';
import { fishSpecies, getSpeciesBySlug, getRelatedSpecies, type FishSpecies, type ConservationStatus } from '@/lib/species';

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
  return {
    title: `${species.name} (${species.scientificName}) — UAE Fish Species`,
    description: `${species.description} Found in: ${species.regions.join(', ')}. Conservation status: ${species.conservationStatus}. Depth: ${species.depth}.`,
    openGraph: {
      title: `${species.name} — UAE Fish Species Guide`,
      description: species.description,
    },
  };
}

function habitatGradient(category: FishSpecies['habitatCategory']): string {
  switch (category) {
    case 'Reef': return 'from-cyan-950 via-teal-900 to-[#0a0f1a]';
    case 'Open Ocean': return 'from-blue-950 via-indigo-900 to-[#0a0f1a]';
    case 'Pelagic': return 'from-sky-950 via-blue-900 to-[#0a0f1a]';
    case 'Coastal': return 'from-teal-950 via-green-900 to-[#0a0f1a]';
    case 'Demersal': return 'from-stone-900 via-slate-900 to-[#0a0f1a]';
    case 'Other': return 'from-gray-900 via-slate-900 to-[#0a0f1a]';
    default: return 'from-gray-900 to-[#0a0f1a]';
  }
}

function conservationColor(status: ConservationStatus): string {
  switch (status) {
    case 'Least Concern': return 'text-green-400 bg-green-500/10 border-green-500/30';
    case 'Near Threatened': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    case 'Vulnerable': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    case 'Endangered': return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'Critically Endangered': return 'text-red-300 bg-red-600/20 border-red-600/30';
    default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
}

export default async function SpeciesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const species = getSpeciesBySlug(slug);
  if (!species) notFound();

  const related = getRelatedSpecies(species);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: species.name,
    alternateName: species.scientificName,
    description: species.description,
    url: `https://uaeangler.com/species/${species.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen">
        {/* Hero */}
        <div className={`relative min-h-[340px] bg-gradient-to-b ${habitatGradient(species.habitatCategory)} flex items-end pt-20`}>
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
            }}
          />
          <div className="relative z-10 max-w-4xl mx-auto px-4 pb-10 w-full">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
              <Link href="/species" className="hover:text-teal-400 transition-colors">Species Guide</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white">{species.name}</span>
            </div>

            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{species.name}</h1>
                <p className="text-xl text-gray-300 italic mb-4">{species.scientificName}</p>
                <p className="text-gray-400 text-sm">{species.family} family · {species.habitatCategory}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`text-sm border px-3 py-1 rounded-full font-medium ${conservationColor(species.conservationStatus)}`}>
                  {species.conservationStatus}
                </span>
                {species.dangerLevel !== 'none' && (
                  <span className="flex items-center gap-1.5 text-sm bg-orange-500/10 border border-orange-500/30 text-orange-400 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {species.dangerLevel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
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
                    <p className="text-white font-semibold">{species.maxSizeCm} cm</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <Weight className="w-4 h-4 text-teal-400 mb-2" />
                    <p className="text-xs text-gray-500 mb-1">Max Weight</p>
                    <p className="text-white font-semibold">{species.maxWeightKg} kg</p>
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
              <section>
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
              </section>

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
        </div>
      </div>
    </>
  );
}
