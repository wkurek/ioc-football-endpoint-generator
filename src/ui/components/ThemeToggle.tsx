import { useTranslation } from 'react-i18next';
import { Monitor, Moon, Sun } from 'lucide-react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { useTheme, type Theme } from '@/ui/hooks/useTheme';
import { ThemeToggleButton } from '@/ui/components/ThemeToggleButton';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <ToggleGroup.Root
      type="single"
      value={theme}
      onValueChange={(v) => v && setTheme(v as Theme)}
      aria-label={t('theme.label')}
      className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
    >
      <ThemeToggleButton value="light" label={t('theme.light')}>
        <Sun className="h-4 w-4" aria-hidden="true" />
      </ThemeToggleButton>
      <ThemeToggleButton value="system" label={t('theme.system')}>
        <Monitor className="h-4 w-4" aria-hidden="true" />
      </ThemeToggleButton>
      <ThemeToggleButton value="dark" label={t('theme.dark')}>
        <Moon className="h-4 w-4" aria-hidden="true" />
      </ThemeToggleButton>
    </ToggleGroup.Root>
  );
}
