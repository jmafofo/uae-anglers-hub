import type { ReactNode } from 'react';

/**
 * Friendly empty state with an icon, headline, and optional action.
 * Keeps zero-data screens feeling intentional rather than broken.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#cbd5dc] bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#e7f2ee] text-[#23675e]">
        {icon}
      </div>
      <p className="font-serif text-xl tracking-[-0.02em] text-[#18333f]">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5b6b77]">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
