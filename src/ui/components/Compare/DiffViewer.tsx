import { memo } from 'react';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { useTheme, resolveTheme } from '@/ui/hooks/useTheme';
import { Theme } from '@/ui/types';

interface DiffViewerProps {
  expected: string;
  actual: string;
  splitView: boolean;
}

// `DiffMethod.LINES` is dramatically cheaper than WORDS for our canonical-JSON
// output: every key/value is on its own line, so line-level granularity already
// pinpoints every meaningful change without paying for per-token alignment
// across thousands of small fragments. Memoised so split/unified toggles in the
// parent don't trigger a recompute when the diff inputs are unchanged.
export const DiffViewer = memo(function DiffViewer({
  expected,
  actual,
  splitView,
}: DiffViewerProps) {
  const { theme } = useTheme();
  const isDark = resolveTheme(theme) === Theme.DARK;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
      <ReactDiffViewer
        oldValue={expected}
        newValue={actual}
        splitView={splitView}
        useDarkTheme={isDark}
        compareMethod={DiffMethod.LINES}
        extraLinesSurroundingDiff={3}
      />
    </div>
  );
});
