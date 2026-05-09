import { useTranslation } from 'react-i18next';
import * as Tabs from '@radix-ui/react-tabs';
import type { Match } from '@/domain/types';
import { GeneratedView } from './GeneratedView';
import { ParsedView } from './ParsedView';

interface MatchTabsProps {
  match: Match;
}

export function MatchTabs({ match }: MatchTabsProps) {
  const { t } = useTranslation();

  return (
    <Tabs.Root defaultValue="generated" className="space-y-3">
      <Tabs.List
        aria-label="Match views"
        className="inline-flex gap-1 rounded-md border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
      >
        <Tabs.Trigger
          value="generated"
          className="rounded-sm px-3 py-1 text-sm text-slate-600 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:font-medium data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
        >
          {t('match.tabs.generated')}
        </Tabs.Trigger>
        <Tabs.Trigger
          value="parsed"
          className="rounded-sm px-3 py-1 text-sm text-slate-600 hover:text-slate-900 data-[state=active]:bg-slate-100 data-[state=active]:font-medium data-[state=active]:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-slate-100"
        >
          {t('match.tabs.parsed')}
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="generated" className="focus-visible:outline-none">
        <GeneratedView match={match} />
      </Tabs.Content>

      <Tabs.Content value="parsed" className="focus-visible:outline-none">
        <ParsedView match={match} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
