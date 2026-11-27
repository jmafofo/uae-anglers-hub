import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Big-number stat with a small label — leaderboard weights, counts, scores.
 * `gold` is for #1 / record values only (see docs/design-tokens.md).
 */
export function StatBlock({
  value,
  label,
  gold = false,
  className,
}: {
  value: ReactNode;
  label: string;
  gold?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <span
        className={cn(
          'font-serif text-[clamp(1.6rem,2.4vw,2.4rem)] leading-none tracking-[-0.03em]',
          gold ? 'text-[#b8892d]' : 'text-[#18333f]',
        )}
      >
        {value}
      </span>
      <span className="mt-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#5b6b77]">
        {label}
      </span>
    </div>
  );
}
