import { useId } from 'react';
import { useTranslation } from 'react-i18next';

interface ActualResponseInputProps {
  value: string;
  onChange: (value: string) => void;
  parseError?: string;
}

export function ActualResponseInput({
  value,
  onChange,
  parseError,
}: ActualResponseInputProps) {
  const { t } = useTranslation();
  const inputId = useId();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {t('compare.pasteActual')}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('compare.pastePlaceholder')}
        rows={10}
        spellCheck={false}
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-900"
      />
      {parseError && (
        <p className="text-xs text-red-600 dark:text-red-400">
          {t('compare.invalidJson', { error: parseError })}
        </p>
      )}
    </div>
  );
}
