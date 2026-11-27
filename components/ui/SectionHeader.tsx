import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Coastal section header: eyebrow + serif heading + optional muted blurb,
 * with an optional trailing link ("View all" pattern).
 */
export function SectionHeader({
  eyebrow,
  title,
  blurb,
  href,
  hrefLabel,
}: {
  eyebrow?: string;
  title: ReactNode;
  blurb?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#27685f]">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-serif text-[clamp(2rem,3.2vw,3.1rem)] leading-[1.15] tracking-[-0.035em] text-[#18333f]">
          {title}
        </h2>
        {blurb && <p className="mt-3 max-w-xl leading-relaxed text-[#5b6b77]">{blurb}</p>}
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="whitespace-nowrap text-sm font-semibold text-[#23675e] underline underline-offset-[6px] hover:text-[#174e47]"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}
