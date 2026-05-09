import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TeamSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function TeamSearch({ value, onChange }: TeamSearchProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="team-search"
        className="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {t('filters.search.label')}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id="team-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('filters.search.placeholder')}
          className="w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2 text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-56"
        />
      </div>
    </div>
  );
}
