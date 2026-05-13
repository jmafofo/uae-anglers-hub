'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AdminError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-14">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">Admin panel error</h2>
        <p className="text-gray-400 text-sm mb-6">
          Something went wrong in the admin panel. Please try again.
        </p>
        <button
          onClick={reset}
          className="bg-teal-500 hover:bg-teal-400 text-white text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
