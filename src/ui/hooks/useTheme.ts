import { createContext, useContext } from 'react';
import { Theme, type ResolvedTheme } from '@/ui/types';

export { Theme, type ResolvedTheme } from '@/ui/types';

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <Providers>');
  return ctx;
}

export function resolveTheme(t: Theme): ResolvedTheme {
  if (t === Theme.SYSTEM) {
    if (typeof window === 'undefined') return Theme.LIGHT;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  }
  return t;
}

export function applyThemeClass(resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolved === Theme.DARK) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
