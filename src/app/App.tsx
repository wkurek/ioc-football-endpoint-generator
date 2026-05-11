import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Providers } from '@/app/providers';
import { AppLayout } from '@/ui/layout/AppLayout';
import { PageFallback } from '@/ui/components/PageFallback';
import { MatchesStateProvider } from '@/ui/state/MatchesStateProvider';
import { ToastProvider } from '@/ui/state/ToastProvider';

const MatchesPage = lazy(() =>
  import('@/ui/pages/MatchesPage').then((m) => ({ default: m.MatchesPage })),
);
const MatchDetailPage = lazy(() =>
  import('@/ui/pages/MatchDetailPage').then((m) => ({ default: m.MatchDetailPage })),
);
const ComparePage = lazy(() =>
  import('@/ui/pages/ComparePage').then((m) => ({ default: m.ComparePage })),
);
const NotFoundPage = lazy(() =>
  import('@/ui/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

export function App() {
  return (
    <Providers>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MatchesStateProvider>
          <ToastProvider>
            <AppLayout>
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<MatchesPage />} />
                  <Route path="/match/:eventUnitCode" element={<MatchDetailPage />} />
                  <Route path="/compare" element={<ComparePage />} />
                  <Route path="/compare/:eventUnitCode" element={<ComparePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppLayout>
          </ToastProvider>
        </MatchesStateProvider>
      </BrowserRouter>
    </Providers>
  );
}
