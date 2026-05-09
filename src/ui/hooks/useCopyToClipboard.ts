import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/ui/state/ToastProvider';

/**
 * Copies a string to the OS clipboard and announces the result via toast.
 * Async because `navigator.clipboard.writeText` is async.
 */
export function useCopyToClipboard() {
  const { show } = useToast();
  const { t } = useTranslation();

  return useCallback(
    async (text: string, successMessage?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        show(successMessage ?? t('actions.copied'), 'success');
      } catch (e) {
        show(t('actions.copyFailed', { error: e instanceof Error ? e.message : 'unknown' }), 'error');
      }
    },
    [show, t],
  );
}
