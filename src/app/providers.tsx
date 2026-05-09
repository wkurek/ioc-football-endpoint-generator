import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ThemeContext, type Theme, resolveTheme, applyThemeClass } from '@/ui/hooks/useTheme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is immutable archive (Paris 2024 finished 2024-08-10).
      staleTime: Infinity,
      gcTime: 1000 * 60 * 60, // 1h in memory
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
    },
  },
});

const THEME_STORAGE_KEY = 'theme';

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as Theme | null) ?? 'system';
  });

  useEffect(() => {
    applyThemeClass(resolveTheme(theme));
    if (theme === 'system') {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyThemeClass(resolveTheme('system'));
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    return undefined;
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Tooltip.Provider delayDuration={150}>{children}</Tooltip.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
