import { useTranslation } from 'react-i18next';
import { LegendSwatch } from './LegendSwatch';

export function SourceLegend() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
      <span className="font-medium">{t('match.legend.title')}:</span>
      <LegendSwatch color="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800">
        {t('match.legend.sch')}
      </LegendSwatch>
      <LegendSwatch color="bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800">
        {t('match.legend.res')}
      </LegendSwatch>
      <LegendSwatch color="bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700">
        {t('match.legend.const')}
      </LegendSwatch>
    </div>
  );
}
