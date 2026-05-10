import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { useMatchesState } from '@/ui/state/MatchesStateProvider';
import { BannerKind, PipelinePhase } from '@/ui/types';
import { Banner } from '@/ui/components/Banner';
import { routes } from '@/ui/routes';
import { translateError } from '@/app/i18n/translateError';
import { MatchHeader } from '@/ui/components/MatchDetail/MatchHeader';
import { MatchTabs } from '@/ui/components/MatchDetail/MatchTabs';
import { MatchActions } from '@/ui/components/MatchDetail/MatchActions';

export function MatchDetailPage() {
  const { eventUnitCode } = useParams<{ eventUnitCode: string }>();
  const { t } = useTranslation();
  const { enabled, setEnabled, pipeline } = useMatchesState();
  const retry = pipeline.retry;
  const retryMatch = pipeline.retryMatch;

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
        to={routes.matches()}
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('actions.backToMatches')}
      </Link>

      {!entry &&
        pipeline.phase !== PipelinePhase.IDLE &&
        pipeline.phase !== PipelinePhase.READY && (
          <Banner kind={BannerKind.INFO} icon={Loader2}>
            {t('states.loading')}
          </Banner>
        )}

      {!entry && pipeline.phase === PipelinePhase.READY && (
        <Banner kind={BannerKind.ERROR} icon={AlertTriangle}>
          {t('states.matchNotFound', { code: eventUnitCode })}
        </Banner>
      )}

      {entry && entry.buildError && (
        <Banner kind={BannerKind.ERROR} icon={AlertTriangle} onRetry={retry}>
          {t('states.error')}: {translateError(entry.buildError, t)}
        </Banner>
      )}

      {entry && entry.resError && (
        <Banner
          kind={BannerKind.ERROR}
          icon={AlertTriangle}
          onRetry={() => retryMatch(entry.code)}
        >
          {t('states.matchResError', { error: translateError(entry.resError, t) })}
        </Banner>
      )}

      {entry && !entry.match && !entry.buildError && !entry.resError && (
        <Banner kind={BannerKind.INFO} icon={Loader2}>
          {t('states.loadingRes', { loaded: pipeline.resLoaded, total: pipeline.resTotal })}
        </Banner>
      )}

      {entry && entry.match && (
        <>
          <MatchHeader match={entry.match} />
          <MatchActions code={entry.code} match={entry.match} />
          <MatchTabs match={entry.match} eventUnitCode={entry.code} />
        </>
      )}
    </div>
  );
}
