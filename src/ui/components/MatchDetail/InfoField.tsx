import type { ReactNode } from 'react';

interface InfoFieldProps {
  label: string;
  children: ReactNode;
}

/**
 * Single dt/dd row used inside a grid-based dl in info cards.
 * Caller wraps in a `<dl>` with `grid-cols-[max-content,1fr]`.
 */
export function InfoField({ label, children }: InfoFieldProps) {
  return (
    <>
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mb-1 text-slate-900 sm:mb-0 dark:text-slate-100">{children}</dd>
    </>
  );
}
