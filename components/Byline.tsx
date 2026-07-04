import { Calendar, ShieldCheck } from 'lucide-react';

interface BylineProps {
  sources?: string;
  reviewedAt?: string;
  className?: string;
}

export default function Byline({
  sources = 'UAE Anglers Hub editorial team',
  reviewedAt = 'June 2026',
  className = '',
}: BylineProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-white/10 pt-4 ${className}`}
    >
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" />
        Last reviewed {reviewedAt}
      </span>
      <span className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" />
        Sources: {sources}
      </span>
    </div>
  );
}
