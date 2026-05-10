import { CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { ToastKind } from '@/ui/types';

export { ToastKind } from '@/ui/types';

interface ToastProps {
  message: string;
  kind: ToastKind;
}

const ICONS: Record<ToastKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  [ToastKind.SUCCESS]: CheckCircle2,
  [ToastKind.ERROR]: XCircle,
  [ToastKind.INFO]: Info,
};

const STYLES: Record<ToastKind, string> = {
  [ToastKind.SUCCESS]:
    'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
  [ToastKind.ERROR]:
    'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
  [ToastKind.INFO]:
    'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
};

export function Toast({ message, kind }: ToastProps) {
  const Icon = ICONS[kind];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-lg ${STYLES[kind]}`}
    >
      <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
