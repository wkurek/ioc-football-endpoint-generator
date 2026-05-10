import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Copy, Download, GitCompare } from 'lucide-react';
import type { Match } from '@/domain/types';
import { exportSingleAsJson } from '@/domain/export/single';
import { filenameSingle } from '@/domain/export/filename';
import { useDownload } from '@/ui/hooks/useDownload';
import { useCopyToClipboard } from '@/ui/hooks/useCopyToClipboard';
import { PrimaryButton } from '@/ui/components/PrimaryButton';
import { SecondaryButton } from '@/ui/components/SecondaryButton';
import { routes } from '@/ui/routes';

interface MatchActionsProps {
  code: string;
  match: Match;
}

export function MatchActions({ code, match }: MatchActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const download = useDownload();
  const copy = useCopyToClipboard();

  const json = exportSingleAsJson(match);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrimaryButton onClick={() => download(filenameSingle(code), json)}>
        <Download className="h-4 w-4" aria-hidden="true" />
        {t('actions.downloadSingle')}
      </PrimaryButton>
      <SecondaryButton onClick={() => void copy(json)}>
        <Copy className="h-4 w-4" aria-hidden="true" />
        {t('actions.copyAll')}
      </SecondaryButton>
      <SecondaryButton onClick={() => navigate(routes.compareWithMatch(code))}>
        <GitCompare className="h-4 w-4" aria-hidden="true" />
        {t('actions.compareThisMatch')}
      </SecondaryButton>
    </div>
  );
}
