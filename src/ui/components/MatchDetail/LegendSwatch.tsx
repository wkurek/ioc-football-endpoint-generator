import type { ReactNode } from 'react';

interface LegendSwatchProps {
  /** Tailwind classes describing the swatch color (bg + border, with dark variants). */
  color: string;
  children: ReactNode;
}

export function LegendSwatch({ color, children }: LegendSwatchProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm border ${color}`} aria-hidden="true" />
      {children}
    </span>
  );
}
