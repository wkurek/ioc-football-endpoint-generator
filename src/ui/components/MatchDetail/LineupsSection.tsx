import { useTranslation } from 'react-i18next';
import type { Match } from '@/domain/types';
import { TeamLineupCard } from './TeamLineupCard';

interface LineupsSectionProps {
  match: Match;
}

export function LineupsSection({ match }: LineupsSectionProps) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('match.sections.lineups')}
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <TeamLineupCard lineup={match.lineups.home} />
        <TeamLineupCard lineup={match.lineups.away} />
      </div>
    </section>
  );
}
