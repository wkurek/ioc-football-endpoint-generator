import { useTranslation } from 'react-i18next';

export function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
      <div className="text-sm text-slate-500 dark:text-slate-400">{t('states.loading')}</div>
    </div>
  );
}
