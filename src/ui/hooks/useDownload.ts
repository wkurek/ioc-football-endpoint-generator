import { useCallback } from 'react';
import { OBJECT_URL_REVOKE_DELAY_MS } from '@/ui/timing';

const DEFAULT_MIME = 'application/json';

/**
 * Triggers a browser download for a string payload.
 * Used for `Download single` / `Download selected` / `Download all`.
 */
export function useDownload() {
  return useCallback((filename: string, content: string, mime = DEFAULT_MIME) => {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Defer revoke so the download can start.
    setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_REVOKE_DELAY_MS);
  }, []);
}
