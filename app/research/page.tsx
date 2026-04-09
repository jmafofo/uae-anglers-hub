import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Fish, Map, BarChart3, Waves, Thermometer, Users, Smartphone, Dna } from 'lucide-react';
import { fishSpecies } from '@/lib/species';
import { fishingSpots } from '@/lib/spots';

export const metadata: Metadata = {
  title: 'Citizen Science Marine Research — UAE Anglers Hub',
  description:
    'How UAE Anglers Hub catch data supports MOCCAE marine genomics research, species distribution mapping, and the UAE 2030 fisheries sustainability targets.',
};

export default function ResearchPage() {
  const speciesCount = fishSpecies.length;
  const spotsCount = fishingSpots.length;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative pt-28 pb-20 px-4"
        style={{
          background:
            'radial-gradient(ellipse at center top, rgba(0,120,200,0.15) 0%, transparent 60%), #0a0f1a',
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
            <BarChart3 className="w-4 h-4" />
            Citizen Science Program
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5">
            Citizen Science for
            <br />
            <span className="text-teal-400">UAE Marine Conservation</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Every catch you log becomes a data point in a living database that scientists
            use to understand, protect, and sustainably manage UAE marine ecosystems.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-7 py-3.5 rounded-xl font-bold transition-colors"
          >
            Join the Research Community
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-16 space-y-20">
        {/* Every Catch Tells a Story */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Every Catch Tells a Story</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  When you log a catch on UAE Anglers Hub — the species, location, size, date, and
                  conditions — you&apos;re contributing to one of the most comprehensive recreational
                  fishing datasets in the region.
                </p>
                <p>
                  Traditional fisheries science relies on expensive research surveys. Citizen science
                  amplifies this by collecting thousands of data points from anglers who are already
                  out on the water every day.
                </p>
                <p>
                  With scientific names, GPS-linked spots, and temporal data, our community creates
                  a picture of UAE marine life that no research budget alone could replicate.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: `${spotsCount}`, label: 'Verified Fishing Locations', icon: Map },
                { value: `${speciesCount}`, label: 'Fish Species Tracked', icon: Fish },
                { value: 'Daily', label: 'New Catch Records Added', icon: BarChart3 },
                { value: '7', label: 'Emirates Covered', icon: Waves },
              ].map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center"
                >
                  <Icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{value}</p>
                  <p className="text-gray-500 text-xs mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Your Data Helps */}
        <section>
          <h2 className="text-3xl font-bold text-white mb-3 text-center">How Your Data Helps</h2>
          <p className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            Four pillars of marine research powered by community catch logs.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: Map,
                title: 'Species Distribution Mapping',
                desc: 'GPS-tagged catches build a real-time map of where species are found across UAE waters — Arabian Gulf, Gulf of Oman, and beyond. This helps identify critical habitats and no-take zones.',
                color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
              },
              {
                icon: BarChart3,
                title: 'Population Health Monitoring',
                desc: 'Average size and weight data over time reveals whether fish populations are healthy, under pressure, or recovering. A shrinking average size often signals overfishing before populations collapse.',
                color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              },
              {
                icon: Waves,
                title: 'Seasonal Migration Patterns',
                desc: "Catch dates and locations reveal the migration timing of pelagic species like Kingfish, Queenfish, and Dorado. This data helps predict optimal fishing seasons and protect spawning aggregations.",
                color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
              },
              {
                icon: Thermometer,
                title: 'Climate Impact Assessment',
                desc: 'Year-over-year changes in species distribution, seasonal timing, and population size are key indicators of how climate change is affecting UAE marine ecosystems and fisheries.',
                color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Research Partnership */}
        <section className="p-8 rounded-2xl bg-gradient-to-br from-teal-900/20 to-blue-900/20 border border-teal-500/20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-3 py-1 text-teal-400 text-xs mb-5">
              <Users className="w-3.5 h-3.5" />
              Research Vision
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Our Research Vision</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                UAE Anglers Hub is building a citizen science platform where community catch data can inform
                evidence-based fisheries management decisions. Our goal is to contribute meaningful, ground-level
                data to marine research efforts across UAE waters.
              </p>
              <p>
                We support <strong className="text-white">non-lethal sampling</strong> and citizen science
                methodologies — enabling population studies without the need for destructive research surveys.
                Catch-measure-photograph-release, combined with scientific name logging, provides the data
                resolution that researchers need.
              </p>
              <p>
                Our community data is designed to support the{' '}
                <strong className="text-white">UAE 2030 Fisheries Sustainability Targets</strong> — working
                toward food security, ecosystem health, and sustainable use of UAE marine resources for
                generations to come.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              {[
                'Non-lethal sampling',
                'Citizen science data',
                'UAE 2030 targets',
                'Marine genomics',
              ].map((tag) => (
                <span key={tag} className="bg-teal-500/10 border border-teal-500/20 text-teal-400 px-3 py-1 rounded-full text-xs">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Earth Biogenome Project */}
        <section className="p-8 rounded-2xl bg-gradient-to-br from-violet-900/20 to-indigo-900/20 border border-violet-500/20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1 text-violet-400 text-xs mb-4">
                <Dna className="w-3.5 h-3.5" />
                Earth Biogenome Project
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">UAE Marine Genomics Database</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Explore genome sequencing status for UAE marine fish species under the Earth Biogenome Project —
                the global initiative to sequence the genomes of all 1.5 million known eukaryotic species.
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Browse the searchable sequencing database, explore interactive phylogenetic trees, and visualise
                species distribution heatmaps across UAE and Omani waters.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/research/biogenome"
                  className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                >
                  <Dna className="w-4 h-4" />
                  Open Genome Database
                </Link>
                <Link
                  href="/species"
                  className="inline-flex items-center gap-2 border border-violet-500/40 text-violet-400 hover:border-violet-400 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
                >
                  Browse Species
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Visual placeholder */}
            <div className="hidden lg:block relative h-48">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/20 flex items-center justify-center">
                <div className="text-center">
                  <Dna className="w-12 h-12 text-violet-400/60 mx-auto mb-3" />
                  <div className="flex items-center justify-center gap-2 flex-wrap px-4">
                    {['Chromosome', 'Scaffold', 'Contig', 'Pending'].map((label, i) => (
                      <span
                        key={label}
                        className="text-xs px-2.5 py-1 rounded-full border"
                        style={{
                          borderColor: ['rgba(0,212,170,0.4)', 'rgba(56,189,248,0.4)', 'rgba(251,191,36,0.4)', 'rgba(100,116,139,0.4)'][i],
                          color: ['#00d4aa', '#38bdf8', '#fbbf24', '#64748b'][i],
                          backgroundColor: ['rgba(0,212,170,0.08)', 'rgba(56,189,248,0.08)', 'rgba(251,191,36,0.08)', 'rgba(100,116,139,0.08)'][i],
                        }}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-3">Phylogenetic tree · Heatmap · Sequencing DB</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ocean Sentinel */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-3 py-1 text-teal-400 text-xs mb-4">
                <Smartphone className="w-3.5 h-3.5" />
                Mobile App
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Ocean Sentinel App</h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                Take the species database to sea with Ocean Sentinel — our offline-capable AI fish
                identification app. Identify any fish from a photo, get instant scientific names,
                habitat info, and conservation status — even without a cell signal.
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Snap a photo, get an ID, log the catch with scientific name — all from your phone on the boat.
                Your data syncs to uaeangler.com when you&apos;re back in range.
              </p>
              <Link
                href="/ocean-sentinel"
                className="inline-flex items-center gap-2 border border-teal-500/40 text-teal-400 hover:border-teal-400 hover:text-teal-300 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
              >
                Learn about Ocean Sentinel
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="w-48 mx-auto aspect-[9/19] rounded-3xl bg-gradient-to-b from-teal-900/60 to-blue-900/60 border border-teal-500/30 flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-full h-24 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                  <Fish className="w-10 h-10 text-teal-400 opacity-60" />
                </div>
                <div className="w-full space-y-1.5">
                  <div className="h-3 bg-white/10 rounded-full" />
                  <div className="h-2 bg-white/5 rounded-full w-3/4" />
                  <div className="h-2 bg-white/5 rounded-full w-1/2" />
                </div>
                <div className="w-full h-8 rounded-lg bg-teal-500/30 flex items-center justify-center">
                  <span className="text-teal-300 text-xs font-medium">Identify Fish</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-10 border-t border-white/10">
          <h2 className="text-3xl font-bold text-white mb-3">Join the Research Community</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Sign up for free and start contributing your catch data to UAE marine science today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/species"
              className="inline-flex items-center gap-2 border border-white/30 hover:border-white text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              <Fish className="w-4 h-4" />
              Browse Species
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              Create Free Account
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
