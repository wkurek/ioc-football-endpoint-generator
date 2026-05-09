import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useMatchesState } from '@/ui/state/MatchesStateProvider';
import { Banner } from '@/ui/components/Banner';
import { MatchHeader } from '@/ui/components/MatchDetail/MatchHeader';
import { MatchTabs } from '@/ui/components/MatchDetail/MatchTabs';
import { MatchActions } from '@/ui/components/MatchDetail/MatchActions';

export function MatchDetailPage() {
  const { eventUnitCode } = useParams<{ eventUnitCode: string }>();
  const { t } = useTranslation();
  const { enabled, setEnabled, pipeline } = useMatchesState();

  // Auto-load if user lands here via deep-link without first visiting /.
  useEffect(() => {
    if (!enabled) setEnabled(true);
  }, [enabled, setEnabled]);

  const entry = eventUnitCode
    ? pipeline.entries.find((e) => e.code === eventUnitCode)
    : undefined;

  return (
    <div className="space-y-4">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('actions.backToMatches')}
      </Link>

      {!entry && pipeline.phase !== 'idle' && pipeline.phase !== 'ready' && (
        <Banner kind="info" icon={Loader2}>
          {t('states.loading')}
        </Banner>
      )}

      {!entry && pipeline.phase === 'ready' && (
        <Banner kind="error" icon={AlertTriangle}>
          Match not found: {eventUnitCode}
        </Banner>
      )}

      {entry && entry.buildError && (
        <Banner kind="error" icon={AlertTriangle}>
          Failed to build match: {entry.buildError.message}
        </Banner>
      )}

      {entry && !entry.match && !entry.buildError && (
        <Banner kind="info" icon={Loader2}>
          {t('states.loadingRes', { loaded: pipeline.resLoaded, total: pipeline.resTotal })}
        </Banner>
      )}

      {entry && entry.match && (
        <>
          <MatchHeader match={entry.match} />
          <MatchActions code={entry.code} match={entry.match} />
          <MatchTabs match={entry.match} />
        </>
      )}
    </div>
  );
}
