import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Fish, Anchor, Waves, Dna, ArrowRight,
} from 'lucide-react';
import FeaturedCatch from '@/components/FeaturedCatch';

interface HeroSectionProps {
  spotCount: number;
  speciesCount: number;
}

export async function HeroSection({ spotCount, speciesCount }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-14 overflow-hidden">
      {/* ── Fishing photo background ── */}
      <div className="absolute inset-0">
        <Image
          src="/spot-photos/jumeira-beach.jpg"
          alt="UAE anglers fishing at sunset"
          fill
          priority
          className="object-cover object-center animate-slow-zoom"
          sizes="100vw"
        />
        {/* Lighter overlay — more photo visible, still readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040d1a]/95 via-[#0a1a2e]/55 to-[#0d1f33]/40" />
        {/* Bottom vignette for wave transition */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#040d1a]/80" />
      </div>

      {/* ── Animated wave separator at bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden leading-[0]">
        {/* Back wave — slower, more opaque */}
        <div className="relative w-[200%] h-[60px] sm:h-[80px] animate-wave-slow">
          <svg
            className="absolute top-0 left-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
              className="fill-[#040d1a]"
              style={{ opacity: 0.9 }}
            />
          </svg>
        </div>
        {/* Front wave — faster, more transparent */}
        <div className="relative w-[200%] h-[40px] sm:h-[50px] -mt-1 animate-wave-fast">
          <svg
            className="absolute top-0 left-0 w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"
              className="fill-[#040d1a]"
              style={{ opacity: 0.5 }}
            />
          </svg>
        </div>
      </div>

      {/* ── Subtle floating data labels ── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {[
          { l: '8%',  t: '18%', txt: '● Epinephelus coioides',  c: 'text-teal-400/20'  },
          { l: '75%', t: '22%', txt: '● GPS: 25.2°N 55.4°E',    c: 'text-blue-400/15'  },
          { l: '82%', t: '55%', txt: '● Scomberoides commersonnianus', c: 'text-cyan-400/15' },
          { l: '5%',  t: '60%', txt: '● Depth: 12m',             c: 'text-teal-400/15'  },
          { l: '55%', t: '12%', txt: '● Rastrelliger kanagurta', c: 'text-blue-300/12'  },
          { l: '38%', t: '75%', txt: '● Season: Oct–Apr',        c: 'text-teal-400/15'  },
        ].map(({ l, t, txt, c }) => (
          <div key={txt} className={`absolute text-[11px] font-mono hidden lg:block ${c}`}
            style={{ left: l, top: t }}>
            {txt}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col xl:flex-row items-center xl:items-start justify-center xl:justify-between gap-10 xl:gap-6">
        {/* Main hero content */}
        <div className="max-w-4xl text-center xl:text-left">
        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3 mb-8">
          <span className="inline-flex items-center gap-2 bg-teal-500/15 backdrop-blur-sm border border-teal-500/30 rounded-full px-4 py-1.5 text-teal-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            UAE&apos;s Premier Angling Community
          </span>
          <span className="inline-flex items-center gap-2 bg-blue-500/15 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-xs font-medium">
            <Dna className="w-3.5 h-3.5" />
            Citizen Science for UAE Waters
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.88] text-white mb-6 drop-shadow-lg">
          Built for{' '}
          <span className="text-teal-400">Anglers.</span>
          <br />
          <span className="text-3xl sm:text-4xl lg:text-5xl font-light text-gray-200 tracking-normal">
            Designed for
          </span>{' '}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            the ocean.
          </span>
        </h1>

        <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mx-auto xl:mx-0 mb-10 leading-relaxed drop-shadow-md">
          {spotCount}+ verified spots across all 7 Emirates. The UAE&apos;s first
          community-powered coastal fish database — catch data that matters
          beyond the fishing line.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center xl:justify-start gap-4 mb-14">
          <Link href="/spots"
            className="group flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:shadow-[0_0_32px_rgba(20,184,166,0.45)] hover:-translate-y-0.5">
            <MapPin className="w-4 h-4" />
            Explore Fishing Spots
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/species"
            className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/20 hover:border-teal-500/50 text-gray-200 hover:text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all">
            <Fish className="w-4 h-4" />
            UAE Species Database
          </Link>
        </div>

        {/* Live stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
          {[
            { value: `${spotCount}`,    label: 'Verified Spots',       icon: MapPin    },
            { value: `${speciesCount}`, label: 'Documented Species',   icon: Fish      },
            { value: '7',               label: 'Emirates Covered',     icon: Anchor    },
            { value: '2',               label: 'Coastlines Mapped',    icon: Waves     },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="bg-[#0a1828]/70 backdrop-blur-sm px-5 py-4 flex flex-col items-center text-center">
              <Icon className="w-4 h-4 text-teal-400 mb-1.5" />
              <span className="text-2xl sm:text-3xl font-black text-white">{value}</span>
              <span className="text-gray-400 text-xs mt-0.5">{label}</span>
            </div>
          ))}
        </div>
        </div>

        {/* Featured catch card */}
        <FeaturedCatch />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 text-xs z-10">
        <span className="tracking-[0.2em] uppercase text-[10px]">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-teal-500/50 to-transparent" />
      </div>

    </section>
  );
}
