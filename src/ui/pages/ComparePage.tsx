import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useMatchesState } from '@/ui/state/MatchesStateProvider';
import { Banner } from '@/ui/components/Banner';
import { EmptyState } from '@/ui/components/EmptyState';
import { exportSingleAsJson } from '@/domain/export/single';
import { parseJsonInput } from '@/domain/compare/parseJsonInput';
import { MatchSelector } from '@/ui/components/Compare/MatchSelector';
import { ActualResponseInput } from '@/ui/components/Compare/ActualResponseInput';
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

  const selectedEntry = useMemo(
    () => (selectedCode ? pipeline.entries.find((e) => e.code === selectedCode) : undefined),
    [pipeline.entries, selectedCode],
  );

  const expectedJson = useMemo(
    () => (selectedEntry?.match ? exportSingleAsJson(selectedEntry.match) : ''),
    [selectedEntry],
  );

  const parsed = useMemo(() => parseJsonInput(actualText), [actualText]);
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
          <div className="flex items-center justify-end">
            <DiffViewToggle splitView={splitView} onChange={setSplitView} />
          </div>
          <DiffViewer expected={expectedJson} actual={actualJson} splitView={splitView} />
        </>
      )}
    </div>
  );
}
