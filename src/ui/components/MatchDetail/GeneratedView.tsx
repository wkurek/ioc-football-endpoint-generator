import { useMemo, useState } from 'react';
import { FieldSource, type Match } from '@/domain/types';
import { buildJsonLines } from '@/domain/display/jsonLines';
import { urlForH2HOnDate, urlForRes } from '@/data/api/stacy-client';
import { JsonLineRow } from './JsonLineRow';
import { SourceLegend } from './SourceLegend';
import { ColorizeToggle } from './ColorizeToggle';

interface GeneratedViewProps {
  match: Match;
  eventUnitCode: string;
}

export function GeneratedView({ match, eventUnitCode }: GeneratedViewProps) {
  const [colorize, setColorize] = useState(false);
  const lines = useMemo(() => buildJsonLines(match), [match]);

  const schUrl = useMemo(() => urlForH2HOnDate(match.kickoff.slice(0, 10)), [match.kickoff]);
  const resUrl = useMemo(() => urlForRes(eventUnitCode), [eventUnitCode]);

  return (
    <div className="space-y-3">
      {/* Toggle and legend live in distinct rows that always exist — the
          legend is a permanent colour key (and source-URL reference) so
          toggling `colorize` never shifts the toggle or the JSON below. */}
      <ColorizeToggle checked={colorize} onChange={setColorize} />
      <div
        className={
          colorize
            ? 'transition-opacity'
            : 'pointer-events-none opacity-60 transition-opacity'
        }
        aria-hidden={!colorize}
      >
        <SourceLegend schUrl={schUrl} resUrl={resUrl} />
      </div>
      <pre
        className="overflow-x-auto rounded-md border border-slate-200 py-2 font-mono text-xs leading-6 dark:border-slate-800"
        aria-label="Generated endpoint JSON"
      >
        {lines.map((line, i) => (
          <JsonLineRow
            key={i}
            line={line}
            colorize={colorize}
            sourceUrl={
              line.source === FieldSource.SCH
                ? schUrl
                : line.source === FieldSource.RES
                  ? resUrl
                  : undefined
            }
          />
        ))}
      </pre>
    </div>
  );
}
