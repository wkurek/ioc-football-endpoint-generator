import type { ComponentType, ReactNode, SVGProps } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import { BannerKind } from '@/ui/types';

export { BannerKind } from '@/ui/types';

interface BannerProps {
  kind: BannerKind;
  /** Lucide-style icon component (uses `h-4 w-4` size). */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  /** When provided, renders a Retry button on the right side. */
  onRetry?: () => void;
}

const KIND_CLASSES: Record<BannerKind, string> = {
  [BannerKind.INFO]:
    'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200',
  [BannerKind.SUCCESS]:
    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200',
  [BannerKind.WARN]:
    'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200',
  [BannerKind.ERROR]:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200',
};

/**
 * Per-kind ARIA role + live-region politeness. Errors and warnings need to
 * interrupt screen-readers (assertive); status/info should not.
 */
const KIND_A11Y: Record<BannerKind, { role: 'status' | 'alert'; ariaLive: 'polite' | 'assertive' }> = {
  [BannerKind.INFO]: { role: 'status', ariaLive: 'polite' },
  [BannerKind.SUCCESS]: { role: 'status', ariaLive: 'polite' },
  [BannerKind.WARN]: { role: 'alert', ariaLive: 'assertive' },
  [BannerKind.ERROR]: { role: 'alert', ariaLive: 'assertive' },
};

const RETRY_BTN_CLASSES: Record<BannerKind, string> = {
  [BannerKind.INFO]:
    'border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800',
  [BannerKind.SUCCESS]:
    'border-emerald-300 hover:bg-emerald-100 dark:border-emerald-700 dark:hover:bg-emerald-900/40',
  [BannerKind.WARN]:
    'border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/40',
  [BannerKind.ERROR]:
    'border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/40',
};

export function Banner({ kind, icon: Icon, children, onRetry }: BannerProps) {
  const { t } = useTranslation();
  const spinning = kind === BannerKind.INFO;
  const { role, ariaLive } = KIND_A11Y[kind];
  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${KIND_CLASSES[kind]}`}
    >
      <Icon
        className={`h-4 w-4 flex-shrink-0 ${spinning ? 'animate-spin' : ''}`}
        aria-hidden="true"
      />
      <span className="flex-1">{children}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`inline-flex flex-shrink-0 items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${RETRY_BTN_CLASSES[kind]}`}
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          {t('actions.retry')}
        </button>
      )}
    </div>
  );
}
