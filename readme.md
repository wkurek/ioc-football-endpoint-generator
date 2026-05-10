# OG2024 Football Endpoint Generator

Take-home assignment: a single-page web app that generates "expected API endpoint" responses for every football match of the **Paris 2024 Olympic Games**. The output serves as reference data for automated tests against the (hypothetical) FootyScores API.

> Original assignment in [ASSIGNMENT.md](./ASSIGNMENT.md). Design decisions and per-field source mapping in [CONVENTIONS.md](./CONVENTIONS.md).

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest watch mode
npm run test:run     # Vitest one-shot
npm run build        # Production build → dist/
npm run preview      # Serve the built bundle locally
npm run lint         # ESLint
npm run format       # Prettier write
```

Requires **Node.js 20+**.

The app is a 100% static client-side SPA — no backend, no proxy, no API keys. After `npm run build` the contents of `dist/` can be served from any static host (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

## What it does

1. Fetches the official Paris 2024 Olympic football schedule and post-match results from `stacy.olympics.com`.
2. Generates one JSON object per match in the structure of [example.json](./example.json) — total 58 matches across the men's and women's tournaments.
3. Lets you preview each match (annotated JSON or human-readable breakdown), compare against an "actual" API response (Git-style diff), and export single / multiple / all matches as JSON.

UI highlights:
- Sortable / filterable table with checkbox-based multi-select; mobile fallback to card layout.
- Filters: tournament (Men's / Women's), round (Group / QF / SF / Bronze / Final), date range with a calendar popup, free-text team search. Filter state syncs to URL search params (refresh-safe, shareable).
- "Load matches" gate persists in `sessionStorage` — once you click it, the pipeline stays loaded across navigation and in-tab refresh until you close the tab.
- Dedicated match detail page (`/match/:eventUnitCode`) with two tabs:
  - **Generated** — pretty-printed JSON, optional source highlighting (which line came from which API endpoint).
  - **Parsed** — DOM cards: match info, score table, goals timeline, lineups per team.
- **Compare** page (`/compare/:eventUnitCode?`) — paste an "actual" JSON response (or fetch one from a URL), get a Git-style diff (split / unified, word-level highlights, collapsed unchanged regions) against our generated expected.
- Light + dark theme toggle, full keyboard navigation, screen-reader friendly (Radix primitives + ARIA), responsive down to ~360px.
- i18n-ready (currently English; adding a new language = one new JSON file).

---

## How data is retrieved and parsed

> Required by ASSIGNMENT.md submission requirements.

### Source endpoints

The URL given in the assignment (`https://stacy.olympics.com/en/paris-2024/competition-schedule`) is a React SPA — its HTML is a 2 KB shell with no match data. The actual data is fetched at runtime from JSON endpoints under the same `stacy.olympics.com` domain:

| Endpoint | Provides | Calls per session |
|---|---|---|
| `SCH_DaysByDiscipline~comp=OG2024~disc=FBL~lang=ENG.json` | List of 13 dates that contain football matches | 1 |
| `SCH_ByDisciplineH2H~comp=OG2024~disc=FBL~lang=ENG~date=YYYY-MM-DD.json` | Per-day matches: kickoff, teams, venue, round | 13 (parallel) |
| `RES_ByRSC_H2H~comp=OG2024~disc=FBL~rscResult=<eventUnit.code>~lang=ENG.json` | Per-match: score, scorers, lineups, formation, coach | 58 (parallel, batched) |

Total: **72 fetches, ~5.5 MB raw JSON**. Deduplicated by TanStack Query in memory and cached by the browser HTTP layer for 30 days (`Cache-Control: max-age=2592000` from the server).

CORS is open (`Access-Control-Allow-Origin: *`), so we fetch directly from the browser — no proxy, no edge function, no backend required.

#### Why API endpoints instead of HTML scraping
- The data is **byte-identical** — the JSON we use is what the official page renders from.
- Direct JSON is **deterministic** (a stable schema vs CSS-class-dependent scraping).
- Avoids a heavy dependency on a headless browser (Puppeteer / Playwright would add ~150 MB to the dev environment for no gain).
- Full rationale in [CONVENTIONS.md §45](./CONVENTIONS.md).

### Parsing pipeline

```
SCH_DaysByDiscipline       →  13 dates
       ↓
SCH_ByDisciplineH2H × 13   →  60 entries → filter HTEAM → 58 matches
                              (2 entries are medal ceremonies, type=NONE)
       ↓
RES_ByRSC_H2H × 58         →  per-match results (score, lineups, scorers)
       ↓
buildMatch(sch, res, all)  →  one Match object per fixture
                              (mapper composed from 8 small pure functions)
       ↓
sort + filter + export
```

All parsing logic lives in [`src/domain/`](./src/domain/) as **pure functions** with no I/O — fully unit-tested with deterministic fixtures. The schema validation at the network boundary is done with **Zod** ([`src/data/api/schemas.ts`](./src/data/api/schemas.ts)), which fails loudly if the source API changes shape.

---

## How endpoint ordering is determined

> Required by ASSIGNMENT.md submission requirements.

**Default sort key: `(kickoff ASC, eventUnit.code ASC)`**. Implemented in [`src/domain/sort/sortKey.ts`](./src/domain/sort/sortKey.ts).

- Primary sort by `kickoff` (ISO 8601 timestamp, preserved in source timezone `+02:00` Paris).
- Tie-breaker by `eventUnit.code` (alphabetical) — Olympic group-stage matches are frequently played in parallel across 7 venues, so plain kickoff sort isn't deterministic. The code is unique per match.

This order is preserved in:
- The default table view (re-sortable interactively, but resets to default per session).
- The bulk export (`Download all` and `Download selected`) — JSON map keys preserve insertion order in modern JS engines, and we insert in the sort order.
- The match-number suffix in `competition.round` (e.g. `"Men's Group A — Match 17"`, `"Men's Quarter-final 27"`) — taken from SCH's `unitNum`, the same value the official Olympic schedule page renders as "Match N". A reviewer cross-referencing our output against the page sees the same labels.
- The single-match export, where keys are written in `example.json`'s canonical order via an explicit canonicalizer (not via insertion order of the in-memory `Match` object) — output is byte-stable even if the TypeScript interface ever gets reordered.

Same input → same output, every run (excluding the bulk wrapper's `generatedAt` timestamp — see below).

### Output shapes

- **Single match (`<eventUnit.code>.json`)** — byte-perfect `example.json` shape. No wrapper, no `__metadata__`, no extra keys. This is the file QA wires directly into "expected" assertions.
- **Bulk (`og2024-fbl-all.json`, `og2024-fbl-selected-N.json`)** — a map keyed by `eventUnit.code`, with a `__metadata__` object at the root recording provenance:
  ```json
  {
    "__metadata__": {
      "generatedAt": "2026-05-10T12:34:56.000Z",
      "schemaVersion": "1.0.0",
      "source": {
        "pageUrl": "https://stacy.olympics.com/en/paris-2024/competition-schedule",
        "apiBase": "https://stacy.olympics.com/OG2024/data"
      },
      "count": 58
    },
    "FBLM…GPA-000100--": { ...example.json shape },
    ...
  }
  ```
  The key `__metadata__` uses double-underscore so it can't collide with an Atos `eventUnit.code` (which always starts with `FBL`). The metadata is **bulk-only** by design — single-match files stay free of any wrapper. `source.pageUrl` is the URL from ASSIGNMENT.md (the public-facing schedule page); `source.apiBase` is the CDN where the JSON is actually fetched from. Both are recorded so QA can audit provenance without guessing.

  Consumers can validate the whole payload with the exported `BulkExportSchema` (Zod) from `src/domain/export/bulk.ts`.

  **Key-order caveat:** `__metadata__` is the first key in the file thanks to JS insertion order. A consumer that re-serializes the parsed object with alphabetical key sorting will see `__metadata__` *last* (`_` is `0x5F`, after uppercase letters at `0x46+`). Our determinism guarantee is insertion order, not alphabetical.

---

## Assumptions about missing or inconsistent data

> Required by ASSIGNMENT.md submission requirements.

We follow `example.json` schema strictly. Where the OG2024 source doesn't provide enough information, we apply documented mappings rather than invent values. Full discussion in [CONVENTIONS.md](./CONVENTIONS.md); summary of the user-visible limitations:

1. **Goal type "header" is not detectable.** OG2024 results encode goals as `pbpa_Action ∈ {SHOT, PEN, FRD}` with no body-part annotation. Our output uses only `"open_play"` and `"penalty"` — every header in the actual matches will appear as `"open_play"`.

2. **Penalty-shootout outcome is not encoded.** Three matches went to PSO (EGY-PAR M-QF, ESP-COL W-QF, CAN-GER W-QF). `score.home/away` reflects regulation+ET only (e.g. `1-1` for EGY-PAR), and `status` stays `"FT"` — there's no field in `example.json` for the shootout result, so it's omitted. PSO scorers are excluded from `scorers[]`.

3. **Player position is broad-only.** OG2024 gives 4-letter codes (`GK / DF / MF / FW`); `example.json` uses 11 granular roles (`RB / CB / LB / DM / CM / AM / LW / RW / ST / FW`). We map: `GK → GK`, `DF → CB`, `MF → CM`, `FW → FW`. Per-match positional codes (`D01`, `M27`, …) exist but are formation-relative slot indices, not roles, and aren't reverse-engineerable without a documented Atos taxonomy.

4. **Stand-in coaches are recognised.** Canada Women's head coach Bev Priestman was suspended before the tournament; Andy Spence took over with `function.functionCode === "SI_COA"`. The mapper picks `COACH` first, then `SI_COA`, then `INT_COA`, then any non-assistant — which keeps Spence in the output for all 4 Canada matches (CONVENTIONS.md §24).

5. **Constant fields.** `competition.name = "Olympic Games"` and `competition.season = "Paris 2024"` are not derivable from a single API field — we set them as constants. The Men's / Women's distinction lives in `competition.round` (e.g. `"Men's Group A — Match 1"`, `"Women's Quarter-final 3"`).

6. **Status mapping.** `FINISHED → "FT"`. Any other code throws — `example.json` only specifies `"FT"` and OG2024 is a closed archive (58/58 FINISHED), so an unknown code is a schema surprise that should surface as a per-match error rather than silently leaking through (CONVENTIONS.md §12, §27).

7. **Defensive errors.** If a match has `FINISHED` status but its `RES_ByRSC_H2H` is missing fields we depend on (e.g. `result.periods[TOT]`), the mapper throws with a precise error and the UI shows "X / 58 generated, Y errors" so the reviewer can see exactly what failed (CONVENTIONS.md §27). On the live archive nothing currently fails.

8. **One match has a source-data gap in scorers (USA 3-0 Guinea, Men's Group A).** Atos's `playByPlay` for this match contains only 1 of the 3 USA goals — the other two are entirely absent from the action stream (no SHOT entries, `pbpa_ScoreH/A` jumps from `undefined` to `3-0` at the third goal). `score.home/away` is correct because we read it from `periods[TOT]` independently, but `scorers[]` lists 1 entry instead of 3. We have no way to recover the missing scorers without an external source, so we surface what the API gives us and accept the under-count for this single match.

---

## Architecture

```
src/
├── app/                  composition root: App, providers, i18n
│   ├── App.tsx           BrowserRouter + provider stack + lazy routes
│   ├── providers.tsx     QueryClient + Theme + Tooltip (Radix)
│   └── i18n/locales/     translation JSONs (en.json today)
├── data/                 I/O layer
│   ├── api/              fetch + Zod schemas
│   └── queries/          TanStack Query hooks
├── domain/               PURE FUNCTIONS — fully testable, no React, no fetch
│   ├── types.ts          Match, Score, Scorer, Lineup, Player
│   ├── mapping/          per-field mappers + buildMatch composer
│   ├── export/           single + bulk JSON serialisers
│   ├── sort/             default deterministic sort
│   ├── filter/           predicate composition
│   ├── display/          JSON-line walker for the Generated view
│   ├── compare/          input parsing for the Compare page
│   └── matchSummary.ts   light view-model for the table
└── ui/                   React components, hooks, pages
    ├── components/       small, single-component-per-file
    ├── pages/            MatchesPage, MatchDetailPage, ComparePage, NotFoundPage
    ├── hooks/            useDownload, useCopyToClipboard, useSelection, …
    ├── state/            MatchesStateProvider, ToastProvider
    └── layout/           AppLayout, Header, Footer, NavTab

test/
└── fixtures/
    ├── sch/              13 SCH day files (~250 KB) — for parser tests
    ├── res/              6 representative RES files (~600 KB) — buildMatch tests
    └── res-all/          all 58 RES files (~5 MB) — full-corpus smoke test
```

**Layering rule:** `domain/` does not import from `data/` or `ui/`. `data/` does not import from `ui/`. `ui/` consumes both. This keeps domain logic provable in isolation.

---

## Tech stack

| Layer | Library | Why |
|---|---|---|
| Framework | Vite + React 18 + TypeScript | Modern, fast HMR, strict types |
| Styling | Tailwind CSS | Utility-first, dark mode out of the box |
| Primitives | Radix UI (Tabs, Tooltip, Popover, Switch, Toggle Group, Checkbox) | Battle-tested accessibility |
| Data fetching | TanStack Query v5 | Cache, deduplication, parallel queries |
| Tables | TanStack Table v8 | Headless, lightweight, sortable |
| Routing | React Router v6 | Two routes + match deep-links |
| i18n | react-i18next | De facto standard, lazy locales |
| Validation | Zod | Validate fetched JSON at the boundary |
| Diff | react-diff-viewer-continued | Git-style split/unified JSON diff |
| Date picker | react-day-picker v9 | Range picker with disabled days |
| Icons | lucide-react | Consistent SVG icons |
| Tests | Vitest + React Testing Library | Fast, ESM-native |

Initial bundle (gzipped):
- Shell + React + Router + Query + i18n: ~108 KB
- MatchesPage chunk (table + filters + DayPicker): ~58 KB
- MatchDetailPage chunk: ~6 KB
- ComparePage chunk (lazy: react-diff-viewer): ~40 KB

---

## Tests

```bash
npm run test:run
```

- **229 tests** across **20 files**.
- Pure-function coverage for every mapper, exporter, filter, sorter (~100% on `src/domain/`).
- Integration smoke test: `buildMatch` runs end-to-end on **all 58 Paris 2024 matches** using cached fixtures (`test/fixtures/res-all/`). Catches regressions across the full corpus, not just the 6 representative samples.

---

## Known limitations & future work

- **Bonus comparison view** is implemented as a per-match flow on `/compare` — paste an "actual" JSON or fetch it from a URL, get a Git-style diff against our generated expected. Batch comparison ("run all 58 against a live API and report pass/fail") is a future iteration; FootyScores isn't a real API, so there's no batch endpoint to point at today.
- **End-to-end tests** (Playwright happy path) are out of MVP scope.
- **Player position output is a 4-value subset** of `example.json`'s 11 codes (CONVENTIONS.md §3). RB/LB/DM/AM/LW/RW/ST will never appear in the output — see CONVENTIONS.md for why granular Atos codes aren't deterministically mappable.

---

## License

Take-home assignment for Pretius — not for redistribution.
