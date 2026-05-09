import * as ToggleGroup from '@radix-ui/react-toggle-group';
import type { ReactNode } from 'react';

interface ThemeToggleButtonProps {
  value: string;
  label: string;
  children: ReactNode;
}

export function ThemeToggleButton({ value, label, children }: ThemeToggleButtonProps) {
  return (
    <ToggleGroup.Item
      value={value}
      aria-label={label}
      title={label}
      className="rounded-sm p-1.5 text-slate-500 transition-colors hover:text-slate-900 data-[state=on]:bg-slate-100 data-[state=on]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=on]:bg-slate-700 dark:data-[state=on]:text-slate-100"
    >
      {children}
      <span className="sr-only">{label}</span>
    </ToggleGroup.Item>
  );
}
