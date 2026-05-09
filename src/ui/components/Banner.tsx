import type { ComponentType, ReactNode, SVGProps } from 'react';

export type BannerKind = 'info' | 'success' | 'warn' | 'error';

interface BannerProps {
  kind: BannerKind;
  /** Lucide-style icon component (uses `h-4 w-4` size). */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}

const KIND_CLASSES: Record<BannerKind, string> = {
  info: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200',
  success:
    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200',
  warn: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200',
};

export function Banner({ kind, icon: Icon, children }: BannerProps) {
  const spinning = kind === 'info';
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${KIND_CLASSES[kind]}`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 ${spinning ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}
