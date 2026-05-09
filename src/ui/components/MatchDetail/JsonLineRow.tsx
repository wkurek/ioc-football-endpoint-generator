import type { JsonLine } from '@/domain/display/jsonLines';

interface JsonLineRowProps {
  line: JsonLine;
  /** When false, source highlight is suppressed (plain JSON look). */
  colorize: boolean;
}

const SOURCE_BG: Record<JsonLine['source'], string> = {
  sch: 'bg-emerald-50 dark:bg-emerald-950/40',
  res: 'bg-sky-50 dark:bg-sky-950/40',
  const: 'bg-slate-100 dark:bg-slate-800/60',
  neutral: '',
};

export function JsonLineRow({ line, colorize }: JsonLineRowProps) {
  const bg = colorize ? SOURCE_BG[line.source] : '';
  return <div className={`whitespace-pre px-3 ${bg}`}>{line.text || ' '}</div>;
}
