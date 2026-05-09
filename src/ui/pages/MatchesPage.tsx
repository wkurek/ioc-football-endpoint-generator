import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Play } from 'lucide-react';
import { useMatchesState } from '@/ui/state/MatchesStateProvider';
import { useDownload } from '@/ui/hooks/useDownload';
import { exportSingleAsJson } from '@/domain/export/single';
import { exportBulkAsJson, type MatchEntry as BulkEntry } from '@/domain/export/bulk';
import {
  filenameBulkAll,
  filenameBulkSelected,
  filenameSingle,
} from '@/domain/export/filename';
import { filterMatches } from '@/domain/filter/matchFilters';
import { StatusBanner } from '@/ui/components/StatusBanner';
import { EmptyState } from '@/ui/components/EmptyState';
import { PrimaryButton } from '@/ui/components/PrimaryButton';
import { SecondaryButton } from '@/ui/components/SecondaryButton';
import { FiltersToolbar } from '@/ui/components/Filters/FiltersToolbar';
import { MatchesTable } from '@/ui/components/MatchesTable/MatchesTable';
import { MatchesCards } from '@/ui/components/MatchesTable/MatchesCards';
import type { MatchEntry } from '@/ui/hooks/usePipeline';

export function MatchesPage() {
  const { t } = useTranslation();
  const {
    enabled,
    setEnabled,
    pipeline,
    selection,
    criteria,
    setCriteria,
    sorting,
    setSorting,
  } = useMatchesState();
  const download = useDownload();

  const filtered = useMemo(
    () => filterMatches(pipeline.entries.map((e) => e.summary), criteria),
    [pipeline.entries, criteria],
  );
  const filteredEntries: MatchEntry[] = useMemo(() => {
    const codes = new Set(filtered.map((s) => s.eventUnitCode));
    return pipeline.entries.filter((e) => codes.has(e.code));
  }, [pipeline.entries, filtered]);

  const dateBounds = useMemo(() => {
    // Bounds come from SCH_DaysByDiscipline (the API's own match-date list) —
    // available as soon as the first fetch resolves, before H2H/RES finish.
    if (pipeline.dates.length === 0) return { min: undefined, max: undefined };
    return {
      min: pipeline.dates[0],
      max: pipeline.dates[pipeline.dates.length - 1],
    };
  }, [pipeline.dates]);

  const handleDownloadSingle = (entry: MatchEntry) => {
    if (!entry.match) return;
    download(filenameSingle(entry.code), exportSingleAsJson(entry.match));
  };

  const buildBulkEntries = (entries: MatchEntry[]): BulkEntry[] =>
    entries
      .filter((e): e is MatchEntry & { match: NonNullable<MatchEntry['match']> } => !!e.match)
      .map((e) => ({ code: e.code, match: e.match }));

  const handleDownloadAll = () => {
    const bulk = buildBulkEntries(pipeline.entries);
    download(filenameBulkAll(), exportBulkAsJson(bulk));
  };

  const handleDownloadSelected = () => {
    const selectedEntries = pipeline.entries.filter((e) => selection.has(e.code));
    const bulk = buildBulkEntries(selectedEntries);
    download(filenameBulkSelected(bulk.length), exportBulkAsJson(bulk));
  };

  const isReady = pipeline.phase === 'ready';
  const allDownloadable = pipeline.entries.filter((e) => !!e.match).length;
  const selectedDownloadable = pipeline.entries.filter(
    (e) => selection.has(e.code) && !!e.match,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('app.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('app.subtitle')}</p>
      </header>

      {!enabled && pipeline.entries.length === 0 ? (
        <EmptyState
          title={t('table.empty')}
          action={
            <PrimaryButton onClick={() => setEnabled(true)}>
              <Play className="h-4 w-4" aria-hidden="true" />
              {t('actions.loadMatches')}
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <StatusBanner state={pipeline} />

          {pipeline.entries.length > 0 && (
            <>
              <FiltersToolbar
                criteria={criteria}
                onChange={setCriteria}
                {...(dateBounds.min ? { dateMin: dateBounds.min } : {})}
                {...(dateBounds.max ? { dateMax: dateBounds.max } : {})}
                matchDays={pipeline.dates}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {t('table.summary', {
                    filtered: filteredEntries.length,
                    total: pipeline.entries.length,
                  })}
                </div>
                <div className="flex gap-2">
                  <SecondaryButton
                    onClick={handleDownloadSelected}
                    disabled={selectedDownloadable === 0}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t('actions.downloadSelected', { count: selectedDownloadable })}
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={handleDownloadAll}
                    disabled={!isReady || allDownloadable === 0}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    {t('actions.downloadAll')}
                  </PrimaryButton>
                </div>
              </div>

              {filteredEntries.length === 0 ? (
                <EmptyState title={t('table.emptyFiltered')} />
              ) : (
                <>
                  {/* Desktop: table; Mobile (<md): cards */}
                  <div className="hidden md:block">
                    <MatchesTable
                      entries={filteredEntries}
                      selected={selection.selected}
                      onToggle={selection.toggle}
                      onDownloadSingle={handleDownloadSingle}
                      sorting={sorting}
                      onSortingChange={setSorting}
                    />
                  </div>
                  <div className="md:hidden">
                    <MatchesCards
                      entries={filteredEntries}
                      selected={selection.selected}
                      onToggle={selection.toggle}
                      onDownloadSingle={handleDownloadSingle}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
