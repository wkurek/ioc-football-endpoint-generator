import * as Tooltip from '@radix-ui/react-tooltip';
import { Info } from 'lucide-react';

interface LegendItemProps {
  /** Tailwind classes for the swatch (bg + border, with dark variants). */
  swatchColor: string;
  /** Short label (e.g. "Schedule"). */
  label: string;
  /** Comma-separated examples (e.g. "round, kickoff, venue"). */
  examples: string;
  /** Longer explanation shown on hover/focus of the info icon. */
  hint: string;
}

export function LegendItem({ swatchColor, label, examples, hint }: LegendItemProps) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <span
        className={`inline-block h-3 w-3 flex-shrink-0 rounded-sm border ${swatchColor}`}
        aria-hidden="true"
      />
      <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
      <span className="text-slate-500 dark:text-slate-400">— {examples}</span>
      <Tooltip.Root delayDuration={150}>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label={`More about ${label}`}
            className="text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-slate-200"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={5}
            className="z-50 max-w-xs rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
          >
            {hint}
            <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-100" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </li>
  );
}
