import { CheckCircle2, Info, XCircle } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  kind: ToastKind;
}

const ICONS: Record<ToastKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const STYLES: Record<ToastKind, string> = {
  success:
    'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800',
  error:
    'bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800',
  info: 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700',
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
