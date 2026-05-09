import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function MatchDetailPage() {
  const { eventUnitCode } = useParams<{ eventUnitCode: string }>();
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('actions.backToMatches')}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Match {eventUnitCode}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          (detail view coming next iteration — Generated and Parsed tabs)
        </p>
      </header>
    </div>
  );
}
