import { useEffect, useMemo, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useMatchesState } from '@/ui/state/MatchesStateProvider';
import { useDebouncedValue } from '@/ui/hooks/useDebouncedValue';
import { Banner } from '@/ui/components/Banner';
import { EmptyState } from '@/ui/components/EmptyState';
import { exportSingleAsJson } from '@/domain/export/single';
import { parseJsonInput } from '@/domain/compare/parseJsonInput';
import { MatchSelector } from '@/ui/components/Compare/MatchSelector';
import { ActualResponseInput } from '@/ui/components/Compare/ActualResponseInput';
import { FetchUrlInput } from '@/ui/components/Compare/FetchUrlInput';
import { DiffViewToggle } from '@/ui/components/Compare/DiffViewToggle';
import { DiffViewer } from '@/ui/components/Compare/DiffViewer';

export function ComparePage() {
  const { t } = useTranslation();
  const { eventUnitCode: routeCode } = useParams<{ eventUnitCode: string }>();
  const { enabled, setEnabled, pipeline } = useMatchesState();

  // Auto-load if user lands here directly.
  useEffect(() => {
    if (!enabled) setEnabled(true);
  }, [enabled, setEnabled]);

  const [selectedCode, setSelectedCode] = useState<string | undefined>(routeCode);
  const [actualText, setActualText] = useState('');
  const [splitView, setSplitView] = useState(true);
  // useTransition lets React commit `isPending=true` before re-rendering the
  // heavy DiffViewer, so the spinner overlay appears immediately on click while
  // the diff recomputes in the background.
  const [isDiffPending, startDiffTransition] = useTransition();

  const selectedEntry = useMemo(
    () => (selectedCode ? pipeline.entries.find((e) => e.code === selectedCode) : undefined),
    [pipeline.entries, selectedCode],
  );

  const expectedJson = useMemo(
    () => (selectedEntry?.match ? exportSingleAsJson(selectedEntry.match) : ''),
    [selectedEntry],
  );

  // Debounce the input that drives the diff. Each keystroke would otherwise
  // re-parse the JSON and rebuild the diff — expensive for large pastes.
  // 200 ms is below the perceptual "lag" threshold while still collapsing
  // a paste / fast typing into a single recompute.
  const debouncedActualText = useDebouncedValue(actualText, 200);
  const parsed = useMemo(() => parseJsonInput(debouncedActualText), [debouncedActualText]);
  const actualJson = useMemo(
    () => (parsed.ok ? JSON.stringify(parsed.value, null, 2) : ''),
    [parsed],
  );

  const isIdentical = !!expectedJson && !!actualJson && expectedJson === actualJson;
  const showDiff = !!expectedJson && parsed.ok;

  if (pipeline.entries.length === 0) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{t('compare.title')}</h1>
        </header>
        <EmptyState title={t('table.empty')} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('compare.title')}</h1>
      </header>

      <MatchSelector
        entries={pipeline.entries}
        value={selectedCode}
        onChange={setSelectedCode}
      />

      <FetchUrlInput onFetched={setActualText} />

      <ActualResponseInput
        value={actualText}
        onChange={setActualText}
        {...(actualText && !parsed.ok ? { parseError: parsed.error } : {})}
      />

      {isIdentical && (
        <Banner kind="success" icon={CheckCircle2}>
          {t('compare.identical')}
        </Banner>
      )}

      {showDiff && !isIdentical && (
        <>
          <div className="flex items-center justify-end gap-2">
            {isDiffPending && (
              <Loader2
                className="h-4 w-4 animate-spin text-blue-600"
                aria-label={t('compare.recomputing')}
              />
            )}
            <DiffViewToggle
              splitView={splitView}
              onChange={(next) => startDiffTransition(() => setSplitView(next))}
              disabled={isDiffPending}
            />
          </div>
          <div className="relative">
            {isDiffPending && (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/60 dark:bg-slate-900/60"
                aria-hidden="true"
              >
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            )}
            <div className={isDiffPending ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <DiffViewer expected={expectedJson} actual={actualJson} splitView={splitView} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
