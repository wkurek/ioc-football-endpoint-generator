import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8 dark:text-slate-400">
        <span>{t('footer.source')}</span>
        <span>OG2024 Football · Take-home assignment</span>
      </div>
    </footer>
  );
}
