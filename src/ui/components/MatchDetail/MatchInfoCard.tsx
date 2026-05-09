import { useTranslation } from 'react-i18next';
import type { Match } from '@/domain/types';
import { splitKickoff } from '@/ui/components/MatchesTable/formatKickoff';
import { InfoField } from './InfoField';

interface MatchInfoCardProps {
  match: Match;
}

export function MatchInfoCard({ match }: MatchInfoCardProps) {
  const { t } = useTranslation();
  const { date, time } = splitKickoff(match.kickoff);

  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('match.sections.matchInfo')}
      </h2>
      <dl className="grid grid-cols-1 gap-y-2 text-sm sm:grid-cols-[max-content,1fr] sm:gap-x-4">
        <InfoField label={t('table.columns.kickoff')}>
          <span className="tabular-nums">
            {date} {time}
          </span>
        </InfoField>
        <InfoField label={t('table.columns.round')}>{match.competition.round}</InfoField>
        <InfoField label={t('table.columns.venue')}>
          {match.venue.name}
          {match.venue.city ? ` · ${match.venue.city}` : ''}
        </InfoField>
        <InfoField label={t('table.columns.status')}>
          <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
            {match.status}
          </span>
        </InfoField>
      </dl>
    </section>
  );
}
