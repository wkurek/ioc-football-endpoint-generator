import { useTranslation } from 'react-i18next';
import { LegendItem } from './LegendItem';

export function SourceLegend() {
  const { t } = useTranslation();
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/40">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('match.legend.title')}
      </h3>
      <ul className="space-y-1.5">
        <LegendItem
          swatchColor="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700"
          label={t('match.legend.sch')}
          examples={t('match.legend.schExamples')}
          hint={t('match.legend.schHint')}
        />
        <LegendItem
          swatchColor="bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-700"
          label={t('match.legend.res')}
          examples={t('match.legend.resExamples')}
          hint={t('match.legend.resHint')}
        />
        <LegendItem
          swatchColor="bg-slate-100 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600"
          label={t('match.legend.const')}
          examples={t('match.legend.constExamples')}
          hint={t('match.legend.constHint')}
        />
      </ul>
    </div>
  );
}
