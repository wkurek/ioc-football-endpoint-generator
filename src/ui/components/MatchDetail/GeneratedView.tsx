import { useMemo, useState } from 'react';
import type { Match } from '@/domain/types';
import { buildJsonLines } from '@/domain/display/jsonLines';
import { JsonLineRow } from './JsonLineRow';
import { SourceLegend } from './SourceLegend';
import { ColorizeToggle } from './ColorizeToggle';

interface GeneratedViewProps {
  match: Match;
}

export function GeneratedView({ match }: GeneratedViewProps) {
  const [colorize, setColorize] = useState(false);
  const lines = useMemo(() => buildJsonLines(match), [match]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ColorizeToggle checked={colorize} onChange={setColorize} />
        {colorize && <SourceLegend />}
      </div>
      <pre
        className="overflow-x-auto rounded-md border border-slate-200 py-2 font-mono text-xs leading-6 dark:border-slate-800"
        aria-label="Generated endpoint JSON"
      >
        {lines.map((line, i) => (
          <JsonLineRow key={i} line={line} colorize={colorize} />
        ))}
      </pre>
    </div>
  );
}
