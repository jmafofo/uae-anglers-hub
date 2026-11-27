import Link from 'next/link';
import { habitatPhotoCredits } from '@/lib/species-images';
import { fishSpecies } from '@/lib/species';
import { fishingSpots } from '@/lib/spots';
import commonsCredits from '@/lib/commons-credits.json';

export const metadata = { title: 'Species photograph credits | UAEAngler' };

type CommonsCredit = { kind: 'species' | 'spot'; src: string; author: string; license: string; licenseUrl: string; source: string };

export default function PhotoCredits() {
  const commons = Object.entries(commonsCredits as Record<string, CommonsCredit>);
  return (
    <main className="min-h-screen bg-slate-50 px-6 pb-16 pt-28 text-slate-900">
      <div className="mx-auto max-w-4xl">
        <Link href="/species" className="text-teal-800">← Species guide</Link>
        <h1 className="mt-6 font-serif text-4xl">Photographs from the wild</h1>
        <p className="mt-4 text-slate-600">Real habitat photographs, credited to their photographers. Locations may be outside the UAE. Images are reproduced without edits; the source links include observation and licensing details.</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {Object.entries(habitatPhotoCredits).map(([slug, photo]) => (
            <article key={slug} className="rounded-xl border border-slate-200 bg-white p-5">
              <Link href={`/species/${slug}`} className="font-semibold text-teal-900">{fishSpecies.find(fish => fish.slug === slug)?.name ?? slug}</Link>
              <p className="mt-3 text-sm">{photo.author}</p>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{photo.caption}</p>
              <p className="mt-3 text-sm"><a href={photo.source} className="text-teal-800 underline">Source photograph</a> · <a href={photo.licenseUrl} className="text-teal-800 underline">{photo.license}</a></p>
            </article>
          ))}
        </div>

        {commons.length > 0 && (
          <>
            <h2 className="mt-14 font-serif text-3xl">Specimen &amp; spot photographs</h2>
            <p className="mt-3 text-slate-600">Species and fishing-spot photographs shared by photographers via Wikimedia Commons, resized for web display. Each links to its Commons page with full licensing details.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {commons.map(([slug, credit]) => {
                const name = credit.kind === 'species'
                  ? fishSpecies.find(f => f.slug === slug)?.name ?? slug
                  : fishingSpots.find(s => s.slug === slug)?.name ?? slug;
                const href = credit.kind === 'species' ? `/species/${slug}` : `/spots/${slug}`;
                return (
                  <article key={slug} className="rounded-xl border border-slate-200 bg-white p-5">
                    <Link href={href} className="font-semibold text-teal-900">{name}</Link>
                    <span className="ml-2 text-xs uppercase tracking-wide text-slate-400">{credit.kind}</span>
                    <p className="mt-3 text-sm">{credit.author}</p>
                    <p className="mt-3 text-sm"><a href={credit.licenseUrl} className="text-teal-800 underline">Source &amp; license</a> · {credit.license}</p>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
