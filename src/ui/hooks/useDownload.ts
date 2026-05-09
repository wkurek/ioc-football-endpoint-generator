import { useCallback } from 'react';

/**
 * Triggers a browser download for a string payload.
 * Used for `Download single` / `Download selected` / `Download all`.
 */
export function useDownload() {
  return useCallback((filename: string, content: string, mime = 'application/json') => {
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
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }, []);
}
