import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/ui/components/ThemeToggle';
import { TorchLogo } from '@/ui/components/TorchLogo';
import { NavTab } from '@/ui/layout/NavTab';
import { routes } from '@/ui/routes';

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to={routes.matches()}
          className="flex items-center gap-2 text-base font-semibold tracking-tight hover:text-blue-600 dark:hover:text-blue-400"
        >
          <TorchLogo className="h-6 w-6 shrink-0" />
          {t('app.title')}
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          <NavTab to={routes.matches()} label={t('nav.matches')} />
          <NavTab to={routes.compare()} label={t('nav.compare')} />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
