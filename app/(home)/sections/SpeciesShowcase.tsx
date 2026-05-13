import Link from 'next/link';
import Image from 'next/image';
import { Waves, ArrowRight } from 'lucide-react';
import type { fishSpecies } from '@/lib/species';
import speciesPhotos from '@/lib/species-photos.json';

interface SpeciesShowcaseProps {
  photoSpecies: (typeof fishSpecies)[number][];
  speciesCount: number;
}

export function SpeciesShowcase({ photoSpecies, speciesCount }: SpeciesShowcaseProps) {
  return (
    <section className="py-24 px-4 bg-[#0d1f33]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-teal-400 text-xs font-semibold uppercase tracking-[0.2em] mb-2">Marine Biodiversity</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">UAE Fish Species</h2>
            <p className="text-gray-400 mt-2">
              {speciesCount}{' '}species documented — Persian Gulf &amp; Gulf of Oman
            </p>
          </div>
          <Link href="/species"
            className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-semibold text-sm whitespace-nowrap transition-colors">
            Full species guide <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {photoSpecies.map((species) => {
            const photo = (speciesPhotos as Record<string, string[]>)[species.slug][0];
            return (
              <Link key={species.slug} href={`/species/${species.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-square bg-white/5 border border-white/10 hover:border-teal-500/50 transition-all hover:scale-[1.04]">
                <Image src={photo} alt={species.name} fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <p className="text-white text-xs font-semibold leading-tight">{species.name}</p>
                  <p className="text-gray-400 text-[10px] italic">{species.scientificName}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Two coastlines */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
              <Waves className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Persian Gulf Coast</p>
              <p className="text-gray-400 text-xs">Abu Dhabi · Dubai · Sharjah · Ajman · UAQ · RAK</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Waves className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Gulf of Oman Coast</p>
              <p className="text-gray-400 text-xs">Fujairah · Khor Fakkan · Dibba · East Sharjah</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
