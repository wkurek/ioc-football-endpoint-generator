import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Banner } from '@/ui/components/Banner';
import { BannerKind, PipelinePhase } from '@/ui/types';
import type { PipelineState } from '@/ui/hooks/usePipeline';

interface StatusBannerProps {
  state: PipelineState;
}

export function StatusBanner({ state }: StatusBannerProps) {
  const { t } = useTranslation();

  if (state.phase === PipelinePhase.IDLE) return null;

  if (state.daysError) {
    return (
      <Banner kind={BannerKind.ERROR} icon={AlertTriangle} onRetry={state.retry}>
        {t('states.error')}: {state.daysError.message}
      </Banner>
    );
  }

  if (state.h2hError) {
    return (
      <Banner kind={BannerKind.ERROR} icon={AlertTriangle} onRetry={state.retry}>
        {t('states.error')}: {state.h2hError.message}
      </Banner>
    );
  }

  if (state.phase === PipelinePhase.DAYS) {
    return (
      <Banner kind={BannerKind.INFO} icon={Loader2}>
        {t('states.loadingDays')}
      </Banner>
    );
  }

  if (state.phase === PipelinePhase.H2H) {
    return (
      <Banner kind={BannerKind.INFO} icon={Loader2}>
        {t('states.loadingH2H', { loaded: state.h2hLoaded, total: state.h2hTotal })}
      </Banner>
    );
  }

  if (state.phase === PipelinePhase.RES) {
    return (
      <Banner kind={BannerKind.INFO} icon={Loader2}>
        {t('states.loadingRes', { loaded: state.resLoaded, total: state.resTotal })}
      </Banner>
    );
  }

  const errorCount = state.matchErrors.length + state.summaryErrors.length;
  if (errorCount > 0) {
    const total = state.entries.length + state.summaryErrors.length;
    const ok = state.entries.length - state.matchErrors.length;
    return (
      <Banner kind={BannerKind.WARN} icon={AlertTriangle}>
        {ok} / {total} {t('states.ready')} · {errorCount} build error
        {errorCount === 1 ? '' : 's'}
      </Banner>
    );
  }

  return (
    <Banner kind={BannerKind.SUCCESS} icon={CheckCircle2}>
      {state.entries.length} matches · {t('states.ready')}
    </Banner>
  );
}
