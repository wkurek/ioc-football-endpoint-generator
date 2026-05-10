import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Banner } from '@/ui/components/Banner';
import { BannerKind, PipelinePhase } from '@/ui/types';
import type { PipelineState } from '@/ui/hooks/usePipeline';
import { translateError } from '@/app/i18n/translateError';

interface StatusBannerProps {
  state: PipelineState;
}

export function StatusBanner({ state }: StatusBannerProps) {
  const { t } = useTranslation();

  // Error checks first — when every query in a layer fails, the pipeline falls
  // back to `phase=IDLE` (nothing loading, nothing succeeded). The IDLE early-
  // return below would otherwise hide the failure and show a blank page.
  if (state.daysError) {
    return (
      <Banner kind={BannerKind.ERROR} icon={AlertTriangle} onRetry={state.retry}>
        {t('states.error')}: {translateError(state.daysError, t)}
      </Banner>
    );
  }

  const h2hFailedCount = state.h2hErrors.length;
  const h2hAllFailed = state.h2hTotal > 0 && h2hFailedCount === state.h2hTotal;

  if (h2hAllFailed) {
    const firstError = state.h2hErrors[0]?.error;
    return (
      <Banner kind={BannerKind.ERROR} icon={AlertTriangle} onRetry={state.retry}>
        {t('states.error')}
        {firstError ? `: ${translateError(firstError, t)}` : ''}
      </Banner>
    );
  }

  if (state.phase === PipelinePhase.IDLE) return null;

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

  // READY phase — surface any partial network failures + build errors as a single WARN.
  const resFailedCount = state.resErrors.length;
  const buildErrorCount = state.matchErrors.length + state.summaryErrors.length;
  const hasAnyError = h2hFailedCount > 0 || resFailedCount > 0 || buildErrorCount > 0;

  if (hasAnyError) {
    const parts: string[] = [];
    if (h2hFailedCount > 0) {
      parts.push(t('states.h2hPartial', { failed: h2hFailedCount, total: state.h2hTotal }));
    }
    if (resFailedCount > 0) {
      parts.push(t('states.resPartial', { failed: resFailedCount }));
    }
    if (buildErrorCount > 0) {
      parts.push(t('states.buildErrors', { count: buildErrorCount }));
    }
    const canRetry = h2hFailedCount > 0 || resFailedCount > 0;
    return (
      <Banner
        kind={BannerKind.WARN}
        icon={AlertTriangle}
        onRetry={canRetry ? state.retry : undefined}
      >
        {state.entries.length} {t('states.ready')} · {parts.join(' · ')}
      </Banner>
    );
  }

  return (
    <Banner kind={BannerKind.SUCCESS} icon={CheckCircle2}>
      {state.entries.length} matches · {t('states.ready')}
    </Banner>
  );
}
