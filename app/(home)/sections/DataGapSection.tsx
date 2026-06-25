import Link from 'next/link';
import Image from 'next/image';
import {
  Database, Dna, BarChart3, ArrowRight,
} from 'lucide-react';

interface DataGapSectionProps {
  speciesCount: number;
}

export function DataGapSection({ speciesCount }: DataGapSectionProps) {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Mangrove background */}
      <div className="absolute inset-0">
        <Image
          src="/background pictures/mangrove_national_park.png"
          alt="UAE mangrove ecosystem"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0a1828]/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1828]/90 via-transparent to-[#0a1828]/90" />
      </div>

      {/* DNA helix accent — right edge */}
      <div className="absolute right-0 top-0 bottom-0 w-72 pointer-events-none hidden xl:block opacity-[0.04] z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent, transparent 8px,
            rgba(0,200,180,1) 8px, rgba(0,200,180,1) 9px
          )`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-xs font-semibold uppercase tracking-[0.25em] mb-3">The Data Gap</p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5">
            UAE marine science has researchers.<br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              It needs the data.
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Thousands of anglers fish UAE waters every week — but until now,
            none of their catch data has been systematically collected.
            UAE Anglers Hub bridges that gap: turning recreational fishing
            into structured, georeferenced marine biodiversity records.
          </p>

          <div className="mt-8 p-6 rounded-2xl border border-teal-500/15 bg-teal-950/20 max-w-3xl mx-auto text-left">
            <h3 className="text-teal-300 font-semibold mb-2 text-sm uppercase tracking-wide">
              Why this matters for UAE waters
            </h3>
            <p className="text-gray-300 text-base leading-relaxed">
              The UAE sits at the transition between the warm, shallow Persian
              Gulf and the deeper, more oxygenated Gulf of Oman. This creates
              two distinct fisheries — each with its own seasonal peaks,
              breeding closures, and pressure points. Yet published research on
              recreational catch composition, size distributions, and local
              abundance trends remains scarce. By recording what anglers catch,
              where, and when, we generate year-round signals that help track
              range shifts, identify spawning hotspots, and support national
              conservation measures such as hamour seasonal bans and protected
              area management.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {[
            {
              icon: Database,
              color: 'teal',
              title: 'Structured catch records',
              desc: 'Every catch logged on uaeangler.com captures species (with scientific name), weight, GPS location, depth, bait, and season — the exact fields marine researchers need.',
            },
            {
              icon: Dna,
              color: 'blue',
              title: 'Species-level precision',
              desc: `${speciesCount} species mapped to the MOCCAE 2023 official list, covering both Persian Gulf and Gulf of Oman coastlines — with conservation status and habitat classification.`,
            },
            {
              icon: BarChart3,
              color: 'cyan',
              title: 'Population trend data',
              desc: 'Aggregate catch data by species, emirate, season, and depth — enabling detection of population shifts, range changes, and fishing pressure over time.',
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className={`p-6 rounded-2xl border bg-gradient-to-br ${
              color === 'teal' ? 'from-teal-950/50 to-[#06101c] border-teal-500/20' :
              color === 'blue' ? 'from-blue-950/50 to-[#06101c] border-blue-500/20' :
                                 'from-cyan-950/50 to-[#06101c] border-cyan-500/20'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                color === 'teal' ? 'bg-teal-500/10 border border-teal-500/20' :
                color === 'blue' ? 'bg-blue-500/10 border border-blue-500/20' :
                                   'bg-cyan-500/10 border border-cyan-500/20'
              }`}>
                <Icon className={`w-5 h-5 ${
                  color === 'teal' ? 'text-teal-400' :
                  color === 'blue' ? 'text-blue-400' : 'text-cyan-400'
                }`} />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Pull quote */}
        <div className="relative p-8 rounded-2xl border border-blue-500/20 bg-blue-950/20 text-center max-w-3xl mx-auto">
          <div className="text-blue-400/30 text-7xl font-serif absolute -top-4 left-6 leading-none">&ldquo;</div>
          <p className="text-white text-lg sm:text-xl font-medium leading-relaxed relative z-10">
            The UAE has world-class marine genomics capability.
            What it lacks is a real-time, community-scale record
            of what is being caught, where, and when.
          </p>
          <p className="text-gray-500 text-sm mt-4">
            That is what UAE Anglers Hub is building, with data standards
            informed by marine researchers and aligned with UAE conservation
            policy.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              { label: 'Georeferenced records', value: 'GPS, depth, date & time' },
              { label: 'Research-aligned schema', value: 'Species, weight, size, habitat' },
              { label: 'Structured data exports', value: 'Ready for scientific analysis' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-teal-400 text-xs font-semibold">{label}</p>
                <p className="text-gray-300 text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            <Link href="/research"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Research Vision <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/conservation"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-blue-400/40 text-gray-400 hover:text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
              UAE Conservation Rules
            </Link>
            <Link href="/editorial-policy"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-blue-400/40 text-gray-400 hover:text-white text-sm px-5 py-2.5 rounded-lg transition-colors">
              Editorial Policy
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
