import type { ReactNode } from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  neutral: 'border-[#dce4e8] bg-white text-[#4a5d68]',
  teal: 'border-[#6f9f94] bg-[#e7f2ee] text-[#205b52]',
  deep: 'border-transparent bg-[#18333f] text-white',
} as const;

/** Small pill for categories, statuses, filters. */
export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Gold badge — strictly reserved for paid tiers and achievement
 * (dealer, Ocean Sentinel premium, Hall of Fame). See docs/design-tokens.md.
 */
export function PremiumBadge({ label = 'Premium' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#d4af5a]/60 bg-[#faf3e3] px-2.5 py-1 text-xs font-semibold text-[#8a651c]">
      <Crown size={12} aria-hidden />
      {label}
    </span>
  );
}
