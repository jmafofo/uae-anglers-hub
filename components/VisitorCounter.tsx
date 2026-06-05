'use client';

import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

/**
 * Records a visit on mount and displays the total visitor count.
 * Placed at the bottom of the landing page.
 */
export default function VisitorCounter() {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    // Record visit and get updated count
    fetch('/api/visit', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => setTotal(data.totalVisitors ?? 0))
      .catch(() => {
        // Fallback: just GET the count without recording
        fetch('/api/visit')
          .then((res) => res.json())
          .then((data) => setTotal(data.totalVisitors ?? 0))
          .catch(() => setTotal(0));
      });
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-500">
      <Eye className="w-3.5 h-3.5" />
      {total === null ? (
        <span>Counting visitors…</span>
      ) : (
        <span>
          <span className="text-teal-400 font-semibold">{total.toLocaleString()}</span>{' '}
          {total === 1 ? 'visitor' : 'visitors'} to date
        </span>
      )}
    </div>
  );
}
