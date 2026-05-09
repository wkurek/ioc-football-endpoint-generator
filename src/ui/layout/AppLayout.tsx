import { type ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
