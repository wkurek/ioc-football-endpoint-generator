import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function EmptyState({ title, hint, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/40"
      aria-live="polite"
    >
      <p className="text-sm text-slate-700 dark:text-slate-300">{title}</p>
      {hint && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
