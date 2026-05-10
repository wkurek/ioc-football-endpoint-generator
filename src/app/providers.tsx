import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Tooltip from '@radix-ui/react-tooltip';
import { ThemeContext, Theme, resolveTheme, applyThemeClass } from '@/ui/hooks/useTheme';
import { TOOLTIP_DELAY_MS } from '@/ui/timing';

const ONE_HOUR_MS = 1000 * 60 * 60;
const QUERY_RETRY_ATTEMPTS = 2;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is immutable archive (Paris 2024 finished 2024-08-10).
      staleTime: Infinity,
      gcTime: ONE_HOUR_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: QUERY_RETRY_ATTEMPTS,
    },
  },
});

const THEME_STORAGE_KEY = 'theme';

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return Theme.SYSTEM;
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as Theme | null) ?? Theme.SYSTEM;
  });

  useEffect(() => {
    applyThemeClass(resolveTheme(theme));
    if (theme === Theme.SYSTEM) {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => applyThemeClass(resolveTheme(Theme.SYSTEM));
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    return undefined;
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContext.Provider value={{ theme, setTheme }}>
        <Tooltip.Provider delayDuration={TOOLTIP_DELAY_MS}>{children}</Tooltip.Provider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  );
}
