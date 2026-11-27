import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Coastal card — the default surface for grouped content.
 * `interactive` adds the hover border/shadow lift; use for clickable cards.
 */
export function GlassCard({
  children,
  className,
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[#e1e7eb] bg-white',
        interactive &&
          'transition-[box-shadow,border-color] duration-200 hover:border-[#a8c9c2] hover:shadow-[0_12px_32px_#173b4a0b]',
        className,
      )}
    >
      {children}
    </div>
  );
}
