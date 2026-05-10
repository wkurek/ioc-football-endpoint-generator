import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { buildColumns } from './columns';
import { SortIndicator } from './SortIndicator';
import { TableRow } from './TableRow';
import type { MatchEntry } from '@/ui/hooks/usePipeline';

interface MatchesTableProps {
  entries: MatchEntry[];
  selected: ReadonlySet<string>;
  onToggle: (code: string) => void;
  onSelectMany: (codes: readonly string[]) => void;
  onDeselectMany: (codes: readonly string[]) => void;
  onDownloadSingle: (entry: MatchEntry) => void;
  sorting: SortingState;
  onSortingChange: (s: SortingState) => void;
}

export function MatchesTable({
  entries,
  selected,
  onToggle,
  onSelectMany,
  onDeselectMany,
  onDownloadSingle,
  sorting,
  onSortingChange,
}: MatchesTableProps) {
  const { t } = useTranslation();

  const visibleCodes = useMemo(() => entries.map((e) => e.code), [entries]);

  const columns = useMemo(
    () =>
      buildColumns({
        t,
        selected,
        onToggle,
        onDownloadSingle,
        visibleCodes,
        onSelectMany,
        onDeselectMany,
      }),
    [t, selected, onToggle, onDownloadSingle, visibleCodes, onSelectMany, onDeselectMany],
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.code,
  });

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-3 py-2 align-middle font-medium"
                    style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                  >
                    {canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SortIndicator direction={sortDir} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

