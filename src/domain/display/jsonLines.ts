import { NEUTRAL, type LineSource, type Match } from '@/domain/types';
import { pathSource } from './pathSource';

export interface JsonLine {
  /** Already-indented line text, with quotes/braces/commas as appropriate. */
  text: string;
  /** Source tag for color highlight (`NEUTRAL` for structural lines). */
  source: LineSource;
}

/**
 * Walks a Match record and emits a flat list of pretty-printed JSON lines
 * tagged with their source-of-truth (sch/res/const) per CONVENTIONS.md #37.
 *
 * The output mirrors `JSON.stringify(match, null, 2)` exactly, but with each
 * line carrying a tag so the Generated view can color-code it. Container
 * open/close lines inherit the source when every leaf descendant agrees,
 * so a wholly-`res` block (e.g. `lineups`) is highlighted as one region.
 */
export function buildJsonLines(match: Match): JsonLine[] {
  const lines: JsonLine[] = [];
  lines.push({ text: '{', source: NEUTRAL });
  emitObjectBody(lines, match as unknown as Record<string, unknown>, [], 1);
  lines.push({ text: '}', source: NEUTRAL });
  return lines;
}

function emitObjectBody(
  lines: JsonLine[],
  obj: Record<string, unknown>,
  path: string[],
  indent: number,
): void {
  const keys = Object.keys(obj);
  keys.forEach((k, i) => {
    emitKeyValue(lines, k, obj[k], [...path, k], indent, i === keys.length - 1);
  });
}

function emitKeyValue(
  lines: JsonLine[],
  key: string,
  value: unknown,
  path: string[],
  indent: number,
  isLast: boolean,
): void {
  const pad = '  '.repeat(indent);
  const comma = isLast ? '' : ',';
  const keyLabel = `"${key}": `;

  if (value === null || typeof value !== 'object') {
    lines.push({
      text: pad + keyLabel + JSON.stringify(value) + comma,
      source: pathSource(path),
    });
    return;
  }

  const isArr = Array.isArray(value);
  const open = isArr ? '[' : '{';
  const close = isArr ? ']' : '}';
  const length = isArr
    ? (value as unknown[]).length
    : Object.keys(value as Record<string, unknown>).length;

  if (length === 0) {
    lines.push({
      text: pad + keyLabel + open + close + comma,
      source: pathSource(path),
    });
    return;
  }

  const blockSrc = blockSource(value, path);
  lines.push({ text: pad + keyLabel + open, source: blockSrc });
  if (isArr) {
    (value as unknown[]).forEach((item, i, arr) => {
      emitArrayItem(lines, item, [...path, String(i)], indent + 1, i === arr.length - 1);
    });
  } else {
    emitObjectBody(lines, value as Record<string, unknown>, path, indent + 1);
  }
  lines.push({ text: pad + close + comma, source: blockSrc });
}

function emitArrayItem(
  lines: JsonLine[],
  value: unknown,
  path: string[],
  indent: number,
  isLast: boolean,
): void {
  const pad = '  '.repeat(indent);
  const comma = isLast ? '' : ',';

  if (value === null || typeof value !== 'object') {
    lines.push({ text: pad + JSON.stringify(value) + comma, source: pathSource(path) });
    return;
  }

  const isArr = Array.isArray(value);
  const open = isArr ? '[' : '{';
  const close = isArr ? ']' : '}';
  const length = isArr
    ? (value as unknown[]).length
    : Object.keys(value as Record<string, unknown>).length;

  if (length === 0) {
    lines.push({ text: pad + open + close + comma, source: pathSource(path) });
    return;
  }

  const blockSrc = blockSource(value, path);
  lines.push({ text: pad + open, source: blockSrc });
  if (isArr) {
    (value as unknown[]).forEach((item, i, arr) => {
      emitArrayItem(lines, item, [...path, String(i)], indent + 1, i === arr.length - 1);
    });
  } else {
    emitObjectBody(lines, value as Record<string, unknown>, path, indent + 1);
  }
  lines.push({ text: pad + close + comma, source: blockSrc });
}

/**
 * Returns the source if every leaf descendant of `value` shares the same
 * source tag; otherwise `NEUTRAL`. Empty containers fall back to
 * `pathSource(path)` (no leaves to disagree).
 */
function blockSource(value: unknown, path: string[]): LineSource {
  if (value === null || typeof value !== 'object') return pathSource(path);
  const keys = Array.isArray(value)
    ? (value as unknown[]).map((_, i) => String(i))
    : Object.keys(value as Record<string, unknown>);
  if (keys.length === 0) return pathSource(path);

  let agreed: LineSource | null = null;
  for (const k of keys) {
    const child = (value as Record<string, unknown>)[k];
    const childSrc =
      child !== null && typeof child === 'object'
        ? blockSource(child, [...path, k])
        : pathSource([...path, k]);
    if (childSrc === NEUTRAL) return NEUTRAL;
    if (agreed === null) agreed = childSrc;
    else if (agreed !== childSrc) return NEUTRAL;
  }
  return agreed ?? NEUTRAL;
}
