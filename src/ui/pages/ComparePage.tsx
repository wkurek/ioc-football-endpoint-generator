import { useTranslation } from 'react-i18next';

export function ComparePage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('compare.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          (Git-style JSON diff between expected and actual API response — coming next iteration)
        </p>
      </header>
    </div>
  );
}
