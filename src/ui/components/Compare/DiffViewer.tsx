import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { useTheme, resolveTheme } from '@/ui/hooks/useTheme';
import { Theme } from '@/ui/types';

interface DiffViewerProps {
  expected: string;
  actual: string;
  splitView: boolean;
}

export function DiffViewer({ expected, actual, splitView }: DiffViewerProps) {
  const { theme } = useTheme();
  const isDark = resolveTheme(theme) === Theme.DARK;

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
      <ReactDiffViewer
        oldValue={expected}
        newValue={actual}
        splitView={splitView}
        useDarkTheme={isDark}
        compareMethod={DiffMethod.WORDS}
        extraLinesSurroundingDiff={3}
      />
    </div>
  );
}
