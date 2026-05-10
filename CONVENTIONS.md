# Conventions — FootyScores OG2024

Mapping decisions and edge-case handling for the OG2024 (Atos) → `example.json`
generator. README has the user-facing summary; this file has the *why* behind
non-obvious mapper choices, kept short on purpose.

---

## 1. Output schema fidelity

Output is **strictly the shape of `example.json`** — no extra keys, no wrapper
fields per match. FootyScores is fictional, so `example.json` is the only
contract. Adding fields would break expected-vs-actual diffing for QA.

Forces:
- `scorers[].type` is `"open_play" | "header" | "penalty"` only.
- `competition.name` / `season` / `status` are constants (no API source).
- PSO winner, header detection, granular position codes are dropped — see §3.

---

## 2. SCH vs RES — source of truth per field

| Field group | Source | Notes |
|---|---|---|
| `competition.round` | SCH `eventUnit.longDescription` + computed match number | per-phase 1-based index, sorted by `(startDate, eventUnit.code)` |
| `competition.name` / `season` | constant `"Olympic Games"` / `"Paris 2024"` | not in API |
| `venue.name` | SCH `venue.description` | |
| `venue.city` | SCH `location.longDescription`, last segment after `, ` | |
| `kickoff` | SCH `startDate` (ISO 8601, `+02:00` preserved) | |
| `status` | SCH `status.code` → `mapStatus` | only `FINISHED → "FT"` |
| `teams.home/away` | RES `items[]` cross-referenced with `HOME_AWAY` | |
| `score` | RES `results.periods` (`TOT` / `H1`) | regulation+ET, NOT including PSO |
| `scorers[]` | RES `results.playByPlay[].actions` | see §3 |
| `lineups.*.team` | RES `items[].participant.name` | |
| `lineups.*.formation` | RES `items[].eventUnitEntries[FORMATION]` | |
| `lineups.*.coach` | RES `items[].teamCoaches`, function-code precedence | `COACH > SI_COA > INT_COA > any non-AST_COA` |
| `lineups.*.startingXI` / `bench` | RES `items[].teamAthletes`, sorted by `startSortOrder` | starters: `STARTER=Y`; rest → bench |

If a pre-match field disagreed between SCH and RES (not observed in 58 matches),
SCH wins. Conflicts surface as warnings.

---

## 3. Known-loss mappings

These are deliberate — `example.json`'s vocabulary doesn't have a slot for the
information, or the source data doesn't carry it.

### `position` — 4 of 11 possible values

OG2024 gives broad codes only: `GK / DF / MF / FW`. `example.json` defines 11
granular roles (`RB/CB/LB/DM/CM/AM/LW/RW/ST/FW/GK`). Mapping:

```
GK → GK    DF → CB    MF → CM    FW → FW
```

Granular Atos codes (`D01–D08`, `M11–M44`, `F02–F06`) are formation-relative
slot indices, NOT roles. Same `D05` is RB for ARG (4-4-2) but CB for USA-W
(4-1-2-3). Without an Atos-published taxonomy, granular → role mapping is not
deterministic, so we don't attempt it.

### `scorers[].type` — header undetectable

OG2024 actions encode `pbpa_Action ∈ {SHOT, PEN, FRD, OG}` with no body-part
annotation (verified: `pbpa_Loc=null` for all 33 SCRs across 6 sample matches).
Mapping:

```
PEN  (and not in PSO)  → "penalty"
OG                      → "open_play", credited to opposing team (FIFA convention)
SHOT / FRD / others     → "open_play"
```

Headers in real matches will appear as `"open_play"`.

### Penalty shootout — excluded

3 matches went to PSO (EGY-PAR M-QF, ESP-COL W-QF, CAN-GER W-QF). PSO actions
have `pbpa_period: "PSO"` and `pbpa_When: undefined`. They're filtered out of
`scorers[]` because `example.json` has no slot for the shootout result.
`score.home/away` reflects regulation+ET only, `status` stays `"FT"`.

### USA 3-0 Guinea — `playByPlay` gap

For `FBLMTEAM11--GPA-000600--`, the action stream has only 1 of 3 USA goals
(`pbpa_ScoreH/A` jumps from `undefined` to `3-0` at minute 75). `score` is
correct (read independently from `periods[TOT]`); `scorers[]` lists 1 entry
instead of 3. No way to recover the missing scorers without an external source.
Surfaced in UI per match.

### Cardinality assertions (defensive)

Each SCR action carries exactly one `SCR` athlete and ≤1 `ASSIST`. We `throw`
on >1 of either to catch schema drift instead of silently dropping. Errors land
in `matchErrors` with `pbpa_id`.

---

## 4. `scorers[].minute` — base-minute rule

Format: `^\s*(\d+)'(?: ?\+\d+)?$`. Take the first number, ignore the `+X`
stoppage suffix.

OG2024 uses **continuous** minute numbering across the whole match — ET-H1
starts at minute 91 (not 1), ET-H2 at 106. So `"99'"` is the 9th minute of
extra time, not the 9th minute of the match.

Critical: `90+3` collapses to `90`, while the 3rd ET-H1 minute is `93` — they
don't conflate. Trade-off: we lose "which stoppage minute" precision, gain a
single integer that uniquely identifies a logical match minute.

Sort: `(minute ASC, pbpa_order ASC)`. `pbpa_order` is Atos's native chronological
index — used as a stable tie-breaker.

`assist` is conditionally included (no `null`, no key when missing). Empty
`scorers: []` for 0-0 matches.

---

## 5. `competition.round` — match-number-in-phase

| Phase | Format | Number |
|---|---|---|
| Group | `"Men's Group A — Match 1"` | 1-6 per group |
| QF | `"Men's Quarter-final 1"` | 1-4 per gender |
| SF | `"Men's Semi-final 1"` | 1-2 per gender |
| Bronze | `"Men's Bronze Medal Match"` | (no number) |
| Gold | `"Men's Gold Medal Match"` | (no number) |

Local index, sorted by `(startDate, eventUnit.code)` within the phase. NOT
`unitNum` from API (which is global per day, not per phase).

---

## 6. Coach precedence (Canada Women edge case)

Bev Priestman (CAN W head coach) was suspended pre-tournament after the drone
incident. Andy Spence took over with `function.functionCode === "SI_COA"`.
Picker: `COACH > SI_COA > INT_COA > any non-AST_COA`. Result: Spence is in the
output for all 4 Canada matches.

---

## 7. Defensive errors — fail loud, not silent

If a `FINISHED` match's `RES_ByRSC_H2H` is missing required fields (e.g.
`periods[TOT]`, `FORMATION`), the mapper throws with a precise message. The UI
shows `X / 58 generated, Y errors` with per-match details. Acceptance criterion
"no omissions" is met because the failure is **visible**, not silently dropped.

Same for `mapStatus` — anything other than `FINISHED` throws. OG2024 is a
closed archive (58/58 FINISHED today), but if Atos amended a match status we'd
rather see a per-match error than emit a value outside the contract.

`parseInt(_, 10)` everywhere on numeric strings from API. NaN → throw.

---

## 8. Filter — `eventUnit.type === "HTEAM"`

`SCH_ByDisciplineH2H` returns 60 entries: 58 matches + 2 medal ceremonies
(`type === "NONE"`, `phase.type === "6"`). Only `HTEAM` enters the pipeline.

---

## 9. Output ordering

Default: `(kickoff ASC, eventUnit.code ASC)`. Implemented in
[`src/domain/sort/sortKey.ts`](./src/domain/sort/sortKey.ts).

Tie-breaker matters because Olympic group-stage kickoffs run in parallel across
7 venues — without it the order varies between runs.

`exportSingleAsJson` emits keys in `example.json` order via an explicit
canonical builder (not `JSON.stringify(match)` + insertion order), so output
stays byte-stable even if the `Match` interface is reordered.

`exportBulkAsJson` adds a non-output `__metadata__` key at the root with
`generatedAt` (ISO timestamp), `schemaVersion`, `source.url`, and `count`. This
is **bulk only** — single-match exports remain a byte-perfect `example.json`
shape.

---

## 10. Data source — API endpoints, not HTML scraping

ASSIGNMENT.md points at `https://stacy.olympics.com/en/paris-2024/competition-schedule`,
which is a React SPA with a 2 KB shell. The page renders from JSON endpoints
on the same host:

| Endpoint | Calls |
|---|---|
| `SCH_DaysByDiscipline` | 1 |
| `SCH_ByDisciplineH2H~date=YYYY-MM-DD` | 13 |
| `RES_ByRSC_H2H~rscResult=<code>` | 58 |

Total: 72 fetches, ~5.5 MB. CORS is open (`Access-Control-Allow-Origin: *`).
HTTP cache `max-age=2592000`.

We use the JSON directly because:
- It's the same data the SPA renders from — byte-identical.
- Stable schema vs CSS-class-dependent scraping.
- No Puppeteer/Playwright dependency (~150 MB saved).

---

## 11. UI scope decisions

Three routes, all lazy-loaded:
- `/` — sortable/filterable matches table (desktop) / cards (mobile <768px).
  Filters: tournament, phase multi-select, date range, team search; URL-synced.
- `/match/:eventUnitCode` — Generated tab (color-highlighted JSON per source:
  🟢 SCH / 🔵 RES / ⚪ const) + Parsed tab (DOM cards: info, score, goals
  timeline, lineups).
- `/compare(/:eventUnitCode)` — paste actual JSON or fetch from URL, get
  Git-style diff (split/unified, word-level highlights, collapsed unchanged).

Pipeline gating: an explicit "Load matches" button avoids 72 fetches on first
landing. Once clicked, state is persisted in `sessionStorage` so navigation
and refresh keep the data loaded for the rest of the tab session.

Accessibility: WCAG 2.1 AA target. Radix primitives (Tabs, Tooltip, Popover,
Switch, Toggle Group, Checkbox, Dropdown). `prefers-reduced-motion` respected.
Color highlights have screen-reader text + tooltip — never color-only.

Theme: light + dark with `prefers-color-scheme` default; toggle persisted in
`localStorage`.

i18n: `react-i18next`, currently `en` only. Adding a new language = one JSON
file under `src/app/i18n/locales/`.

---

## 12. Stack

Vite + React 18 + TypeScript + Tailwind. TanStack Query (cache/dedup) +
TanStack Table (headless, sortable). Zod at the network boundary. Vitest +
React Testing Library. `react-diff-viewer-continued` for the Compare page.
`react-day-picker` for date range. `lucide-react` for icons. No backend, no
proxy — 100% static SPA, deployable to any static host.
