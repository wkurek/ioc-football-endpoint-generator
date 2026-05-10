import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import type { MatchEntry } from '@/ui/hooks/usePipeline';
import { routes } from '@/ui/routes';

interface MatchSelectorProps {
  entries: MatchEntry[];
  value: string | undefined;
  onChange: (code: string) => void;
}

export function MatchSelector({ entries, value, onChange }: MatchSelectorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const optionId = (code: string) => `${inputId}-opt-${code}`;

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const ready = useMemo(() => entries.filter((e) => !!e.match), [entries]);

  const selected = useMemo(
    () => (value ? ready.find((e) => e.code === value) : undefined),
    [ready, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ready;
    return ready.filter((entry) => entryMatchesSearch(entry, q));
  }, [ready, query]);

  // Reset the options-array length on every render so disposed buttons can be GC'd
  optionsRef.current.length = filtered.length;

  const select = (code: string) => {
    onChange(code);
    navigate(routes.compareWithMatch(code), { replace: true });
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  // Click outside closes the popup.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // When opening: highlight currently-selected entry (or first match) and scroll it into view.
  useLayoutEffect(() => {
    if (!open) return;
    const selectedIdx = value ? filtered.findIndex((e) => e.code === value) : -1;
    const initial = selectedIdx >= 0 ? selectedIdx : filtered.length > 0 ? 0 : -1;
    setActiveIndex(initial);
    if (initial >= 0) {
      optionsRef.current[initial]?.scrollIntoView({ block: 'nearest' });
    }
    // Only on transition into open. We deliberately omit `filtered`/`value` from deps:
    // changing the query updates active via the dedicated effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reset highlight when filtered list changes (typing).
  useEffect(() => {
    if (!open) return;
    setActiveIndex((idx) => {
      if (filtered.length === 0) return -1;
      if (idx < 0 || idx >= filtered.length) return 0;
      return idx;
    });
  }, [filtered, open]);

  // Keep the active option scrolled into view as the user navigates.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionsRef.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (open) {
        e.stopPropagation();
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      setActiveIndex((idx) => (idx + 1) % filtered.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (filtered.length === 0) return;
      setActiveIndex((idx) => (idx <= 0 ? filtered.length - 1 : idx - 1));
      return;
    }
    if (e.key === 'Home') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === 'End') {
      if (open && filtered.length > 0) {
        e.preventDefault();
        setActiveIndex(filtered.length - 1);
      }
      return;
    }
    if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && activeIndex < filtered.length) {
        const entry = filtered[activeIndex];
        if (entry) {
          e.preventDefault();
          select(entry.code);
        }
      }
      return;
    }
    if (e.key === 'Tab') {
      if (open) setOpen(false);
    }
  };

  const activeDescendantId =
    open && activeIndex >= 0 && filtered[activeIndex]
      ? optionId(filtered[activeIndex]!.code)
      : undefined;

  return (
    <div ref={rootRef} className="relative flex max-w-2xl flex-col gap-1">
      <label
        htmlFor={inputId}
        className="text-xs font-medium text-slate-600 dark:text-slate-400"
      >
        {t('compare.selectMatch')}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          {...(activeDescendantId ? { 'aria-activedescendant': activeDescendantId } : {})}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onInputKeyDown}
          placeholder={selected ? formatLabel(selected) : t('compare.searchPlaceholder')}
          className="w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <span aria-live="polite" className="sr-only">
        {open ? t('compare.resultsAnnouncement', { count: filtered.length }) : ''}
      </span>
      {open && (
        <div
          ref={popupRef}
          className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">
              {t('compare.noResults')}
            </p>
          ) : (
            <ul id={listboxId} role="listbox" aria-label={t('compare.selectMatch')}>
              {filtered.map((entry, i) => {
                const isSelected = entry.code === value;
                const isActive = i === activeIndex;
                return (
                  <li key={entry.code}>
                    <button
                      ref={(el) => {
                        optionsRef.current[i] = el;
                      }}
                      id={optionId(entry.code)}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(i)}
                      // mousedown fires before the input's blur, so the popup
                      // doesn't disappear under the click.
                      onMouseDown={(e) => {
                        e.preventDefault();
                        select(entry.code);
                      }}
                      onClick={() => select(entry.code)}
                      className={`flex w-full items-center gap-2 border-l-2 px-3 py-1.5 text-left text-sm ${
                        isSelected
                          ? 'border-blue-500 bg-blue-100 font-medium text-blue-900 dark:bg-blue-900/50 dark:text-blue-50'
                          : isActive
                            ? 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                            : 'border-transparent text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <span
                          className="inline-block h-3.5 w-3.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {highlightMatches(formatLabel(entry), query.trim())}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatLabel(e: MatchEntry): string {
  return `${e.summary.date} ${e.summary.homeTeam} ${e.summary.scoreText ?? '—'} ${
    e.summary.awayTeam
  } (${e.summary.round})`;
}

/**
 * Wraps every case-insensitive occurrence of `query` inside `text` with a
 * `<mark>` so the user can see which characters matched their search.
 */
function highlightMatches(text: string, query: string): ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const needle = query.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let next = lower.indexOf(needle, cursor);
  while (next !== -1) {
    if (next > cursor) parts.push(text.slice(cursor, next));
    parts.push(
      <mark
        key={next}
        className="rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-500/40"
      >
        {text.slice(next, next + needle.length)}
      </mark>,
    );
    cursor = next + needle.length;
    next = lower.indexOf(needle, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

function entryMatchesSearch(e: MatchEntry, q: string): boolean {
  const haystacks: Array<string | undefined> = [
    e.code,
    e.summary.date,
    e.summary.kickoff,
    e.summary.tournament,
    e.summary.phase,
    e.summary.groupLetter,
    e.summary.round,
    e.summary.homeTeam,
    e.summary.awayTeam,
    e.summary.scoreText,
    e.summary.venue,
    e.summary.city,
    e.summary.status,
  ];
  for (const h of haystacks) {
    if (h && h.toLowerCase().includes(q)) return true;
  }
  return false;
}
