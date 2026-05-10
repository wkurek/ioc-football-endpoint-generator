import { Toast } from './Toast';
import type { ToastKind } from '@/ui/types';

export interface ToastItem {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastViewportProps {
  toasts: readonly ToastItem[];
}

export function ToastViewport({ toasts }: ToastViewportProps) {
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
    >
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} kind={t.kind} />
      ))}
    </div>
  );
}
