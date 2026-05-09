import type { FieldSource, Match } from '@/domain/types';
import { pathSource } from './pathSource';

export interface JsonLine {
  /** Already-indented line text, with quotes/braces/commas as appropriate. */
  text: string;
  /** Source tag for color highlight (`'neutral'` for structural lines). */
  source: FieldSource | 'neutral';
}

/**
 * Walks a Match record and emits a flat list of pretty-printed JSON lines
 * tagged with their source-of-truth (sch/res/const) per CONVENTIONS.md #37.
 *
 * The output mirrors `JSON.stringify(match, null, 2)` exactly, but with each
 * line carrying a tag so the Generated view can color-code it.
 */
export function buildJsonLines(match: Match): JsonLine[] {
  const lines: JsonLine[] = [];
  lines.push({ text: '{', source: 'neutral' });
  emitObjectBody(lines, match as unknown as Record<string, unknown>, [], 1);
  lines.push({ text: '}', source: 'neutral' });
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

  lines.push({ text: pad + keyLabel + open, source: 'neutral' });
  if (isArr) {
    (value as unknown[]).forEach((item, i, arr) => {
      emitArrayItem(lines, item, [...path, String(i)], indent + 1, i === arr.length - 1);
    });
  } else {
    emitObjectBody(lines, value as Record<string, unknown>, path, indent + 1);
  }
  lines.push({ text: pad + close + comma, source: 'neutral' });
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

  lines.push({ text: pad + open, source: 'neutral' });
  if (isArr) {
    (value as unknown[]).forEach((item, i, arr) => {
      emitArrayItem(lines, item, [...path, String(i)], indent + 1, i === arr.length - 1);
    });
  } else {
    emitObjectBody(lines, value as Record<string, unknown>, path, indent + 1);
  }
  lines.push({ text: pad + close + comma, source: 'neutral' });
}
