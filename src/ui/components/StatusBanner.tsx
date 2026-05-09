import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Banner } from '@/ui/components/Banner';
import type { PipelineState } from '@/ui/hooks/usePipeline';

interface StatusBannerProps {
  state: PipelineState;
}

export function StatusBanner({ state }: StatusBannerProps) {
  const { t } = useTranslation();

  if (state.phase === 'idle') return null;

  if (state.daysError) {
    return (
      <Banner kind="error" icon={AlertTriangle}>
        {t('states.error')}: {state.daysError.message}
      </Banner>
    );
  }

  if (state.phase === 'days') {
    return (
      <Banner kind="info" icon={Loader2}>
        {t('states.loadingDays')}
      </Banner>
    );
  }

  if (state.phase === 'h2h') {
    return (
      <Banner kind="info" icon={Loader2}>
        {t('states.loadingH2H', { loaded: state.h2hLoaded, total: state.h2hTotal })}
      </Banner>
    );
  }

  if (state.phase === 'res') {
    return (
      <Banner kind="info" icon={Loader2}>
        {t('states.loadingRes', { loaded: state.resLoaded, total: state.resTotal })}
      </Banner>
    );
  }

  if (state.matchErrors.length > 0) {
    return (
      <Banner kind="warn" icon={AlertTriangle}>
        {state.entries.length - state.matchErrors.length} / {state.entries.length}{' '}
        {t('states.ready')} · {state.matchErrors.length} build error
        {state.matchErrors.length === 1 ? '' : 's'}
      </Banner>
    );
  }

  return (
    <Banner kind="success" icon={CheckCircle2}>
      {state.entries.length} matches · {t('states.ready')}
    </Banner>
  );
}
