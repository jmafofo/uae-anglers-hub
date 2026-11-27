import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Fish, Clock } from 'lucide-react';
import { getSpotImage, type FishingSpot } from '@/lib/spots';

export default function SpotCard({ spot }: { spot: FishingSpot }) {
  return <Link href={`/spots/${spot.slug}`} className="coastal-card group">
    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
      <Image src={getSpotImage(spot.slug, spot.accessType)} alt={spot.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-800">{spot.accessType}</span>
    </div>
    <div className="p-6">
      <p className="flex items-center gap-1.5 text-sm text-teal-800"><MapPin size={14} />{spot.emirate}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 group-hover:text-teal-800">{spot.name}</h3>
      <p className="mt-4 flex gap-2 text-sm leading-relaxed text-slate-600"><Fish size={16} className="mt-0.5 shrink-0" />{spot.species.slice(0, 3).join(' · ')}</p>
      <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-500"><Clock size={16} className="mt-0.5 shrink-0" />{spot.bestTime}</p>
    </div>
  </Link>;
}
