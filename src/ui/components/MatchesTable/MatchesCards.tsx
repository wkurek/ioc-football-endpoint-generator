import type { MatchEntry } from '@/ui/hooks/usePipeline';
import { MatchCard } from './MatchCard';

interface MatchesCardsProps {
  entries: MatchEntry[];
  selected: ReadonlySet<string>;
  onToggle: (code: string) => void;
  onDownloadSingle: (entry: MatchEntry) => void;
}

export function MatchesCards({
  entries,
  selected,
  onToggle,
  onDownloadSingle,
}: MatchesCardsProps) {
  return (
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.code}>
          <MatchCard
            entry={entry}
            selected={selected.has(entry.code)}
            onToggle={onToggle}
            onDownload={onDownloadSingle}
          />
        </li>
      ))}
    </ul>
  );
}
