import Link from 'next/link';
import { Anchor, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-5">
          <Anchor className="w-8 h-8 text-teal-400" />
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">404</h1>
        <p className="text-gray-400 text-sm mb-6">
          This page has drifted out to sea. Let&apos;s get you back to shore.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
