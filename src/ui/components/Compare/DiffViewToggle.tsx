import { useTranslation } from 'react-i18next';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

interface DiffViewToggleProps {
  splitView: boolean;
  onChange: (splitView: boolean) => void;
  disabled?: boolean;
}

export function DiffViewToggle({ splitView, onChange, disabled }: DiffViewToggleProps) {
  const { t } = useTranslation();
  const value = splitView ? 'split' : 'unified';

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v === 'split')}
      disabled={disabled}
      aria-label="Diff view mode"
      className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900"
    >
      <ToggleGroup.Item
        value="split"
        className="rounded-sm px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
      >
        {t('compare.splitView')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        value="unified"
        className="rounded-sm px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:font-medium data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
      >
        {t('compare.unifiedView')}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
}
