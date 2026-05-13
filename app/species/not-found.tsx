import Link from 'next/link';
import { Fish, ArrowLeft } from 'lucide-react';

export default function SpeciesNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
          <Fish className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Species not found</h1>
        <p className="text-gray-400 text-sm mb-6">
          We couldn&apos;t find that species in our database.
        </p>
        <Link
          href="/species"
          className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse all species
        </Link>
      </div>
    </div>
  );
}
