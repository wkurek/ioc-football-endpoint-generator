import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2 } from 'lucide-react';
import { TranslatableError } from '@/domain/errors';
import { translateError } from '@/app/i18n/translateError';

interface FetchUrlInputProps {
  /**
   * Called when the fetch succeeds and the response body is valid JSON.
   * Receives the pretty-printed JSON string for direct use as the diff input.
   */
  onFetched: (prettyJson: string) => void;
}

export function FetchUrlInput({ onFetched }: FetchUrlInputProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setError(translateError(new TranslatableError('errors.compare.fetchInvalidScheme'), t));
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch(trimmed, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new TranslatableError('errors.compare.fetchHttp', {
          status: res.status,
          statusText: res.statusText,
        });
      }
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new TranslatableError('errors.compare.fetchInvalidJson');
      }
      onFetched(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setError(translateError(e, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {t('compare.fetchUrl')}
      </label>
      <div className="flex flex-wrap items-stretch gap-2">
        <input
          id={inputId}
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleFetch();
            }
          }}
          placeholder={t('compare.fetchUrlPlaceholder')}
          className="min-w-[18rem] flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
        <button
          type="button"
          onClick={() => void handleFetch()}
          disabled={loading || !url.trim()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm font-medium hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {t('compare.fetch')}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600 dark:text-red-400">
          {t('compare.fetchFailed', { error })}
        </p>
      )}
    </div>
  );
}
