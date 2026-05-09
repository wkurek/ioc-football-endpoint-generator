import { useTranslation } from 'react-i18next';
import type { Match } from '@/domain/types';

interface ScoreCardProps {
  match: Match;
}

export function ScoreCard({ match }: ScoreCardProps) {
  const { t } = useTranslation();
  const { home, away, halfTime } = match.score;

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('match.sections.score')}
      </h2>
      <div className="overflow-hidden rounded border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-3 py-2 text-left font-medium">
                &nbsp;
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                {match.teams.home}
              </th>
              <th scope="col" className="px-3 py-2 text-center font-medium">
                {match.teams.away}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 text-slate-500 dark:text-slate-400">HT</td>
              <td className="px-3 py-2 text-center tabular-nums">{halfTime.home}</td>
              <td className="px-3 py-2 text-center tabular-nums">{halfTime.away}</td>
            </tr>
            <tr className="border-t border-slate-100 dark:border-slate-800">
              <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">FT</td>
              <td className="px-3 py-2 text-center text-base font-semibold tabular-nums">
                {home}
              </td>
              <td className="px-3 py-2 text-center text-base font-semibold tabular-nums">
                {away}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
