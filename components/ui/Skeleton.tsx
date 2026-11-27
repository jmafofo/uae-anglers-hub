import { cn } from '@/lib/utils';

/** Shimmer block for loading states. Compose to match the final layout. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-pulse rounded-lg bg-[#e7edef]',
        className,
      )}
    />
  );
}

/** Card-shaped skeleton matching GlassCard proportions. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e1e7eb] bg-white p-5">
      <Skeleton className="mb-4 h-32 w-full" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('mb-2 h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
