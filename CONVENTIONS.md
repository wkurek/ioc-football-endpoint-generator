# Konwencje projektu — FootyScores OG2024

Zbiór wszystkich decyzji projektowych dotyczących mapowania danych OG2024 (Atos)
na schemat `example.json`, obsługi edge case'ów oraz UX. Każda decyzja ma listę
opcji + finalny wybór + uzasadnienie. Po podjęciu decyzji wartość trafia
docelowo do `README.md` projektu jako sekcja "Assumptions" / "Mapping".

**Legenda:** ✅ podjęta · ⏳ czeka

---

## 1. Strykt­ność schematu względem `example.json` ✅

**Decyzja: A — twardy schemat.** Emitujemy **wyłącznie** pola obecne w `example.json`. Brakujące dane → puste tablice / `null` / pomięte (zgodnie z konwencją per-pole). Nigdy nie dodajemy nowych pól.

**Uzasadnienie:**
- FootyScores nie jest realnym API (zweryfikowane — żadne większe API piłki nożnej tak się nie nazywa). Jedyną definicją "co API zwraca" jest `example.json`.
- Gdyby kiedykolwiek FootyScores zostało zaimplementowane na bazie tej spec, dodanie pola w naszym `expected` zepsułoby porównanie z `actual` (klucz w expected, brak w actual → fail).
- Acceptance criteria mówi wprost: *"exactly the same as in example.json"*.

**Konsekwencje (które domykają inne pytania automatycznie):**
- pyt. 8 (PSO winner) → forced A: utrata informacji udokumentowana jako known limitation.
- pyt. 10 (header detection) → forced A: wszystkie nie-PEN bramki → `"open_play"`.
- pyt. 11 (FRD goal type) → forced A: mapuje na `"open_play"`.

---

## 2. Pole `captain` w `lineups.home/away` ✅

W danych OG2024 **mamy** sygnał kapitana (`teamAthletes[].eventUnitEntries[eue_code="CAPTAIN"].eue_value === "Y"`). `example.json` go nie ma.

**Decyzja: A — pomijamy.** Schemat ścisły zgodnie z pyt. 1.

**Uzasadnienie:** FootyScores jest fikcyjnym API w zadaniu, jedyną definicją "co API zwraca" jest `example.json`. Dodanie pola, którego API nie zwraca, sprawi że automatyczne porównanie expected vs actual się rozjedzie.

---

## 3. `competition.name` — wartość ✅

Pole nie pochodzi z API (stała). Najbliższe API: `discipline.description = "Football"`, `comp = "OG2024"`.

**Decyzja: `"Olympic Games"`.** Zgodnie z konwencją `example.json` (`"LaLiga"` — krótka, generyczna nazwa rozgrywek bez sezonu).

---

## 4. `competition.season` — wartość ✅

Pole nie pochodzi z API. Pojęcie "season" w semantyce Olimpiad nie istnieje — to jednorazowa edycja turnieju.

**Decyzja: `"Paris 2024"`.** Edycja IO. Rozróżnienie M/W idzie do `competition.round` (patrz pyt. 5).

---

## 5. Gdzie zakodować rozróżnienie Men's / Women's? ✅

**Decyzja: B — w `competition.round`.** Prefiks `"Men's"` / `"Women's"` jest w danych OG2024 jako część `eventUnit.longDescription` — przepisujemy w stanie surowym do round.

---

## 6. Format `competition.round` ✅

Source: `eventUnit.longDescription` (`"Men's Group A"`), `unitNum` (numer kolejnego meczu w fazie — globalny per dzień, nie per grupa).

**Decyzja: C — long + numer:**
- Group stage: `"Men's Group A — Match 1"`, `"Men's Group A — Match 2"`, ..., `"Men's Group D — Match 6"` (numer 1-6 per grupa, NIE globalny `unitNum` — wyliczamy lokalny indeks 1-6 sortując po `startDate` w obrębie tej samej grupy).
- Quarter-finals: `"Men's Quarter-final 1"` ... `"Men's Quarter-final 4"` (numer 1-4).
- Semi-finals: `"Men's Semi-final 1"` ... `"Men's Semi-final 2"` (numer 1-2).
- Bronze: `"Men's Bronze Medal Match"` (bez numeru — jeden).
- Gold: `"Men's Gold Medal Match"` (bez numeru — jeden).

**Uwaga implementacyjna:** Numer w fazie grupowej powinien wynikać z deterministycznego porządku (kickoff ASC, kod ASC) w ramach tej grupy, nie z `unitNum` z API (które jest globalne per dzień).

---

## 7. Bramki z PSO (rzuty karne po dogrywce) w `scorers[]` ✅

3 mecze poszły w karne (EGY-PAR M, ESP-COL W, CAN-GER W). PSO-bramki mają `pbpa_period: "PSO"`, `pbpa_When: undefined`, `pbpa_Action: "PEN"`.

**Decyzja: A — wykluczyć z `scorers[]`.** Filtr: `pbpa_period !== "PSO"`. Konwencja FIFA — PSO to seria karnych po regulaminowym meczu, nie część `score.TOT`. Brak `pbpa_When` i tak by zmusił do `minute: null`, co łamie schemat `example.json`.

---

## 8. Wynik karnych (kto wygrał PSO) ✅

`score.TOT` to wynik po dogrywce (np. EGY-PAR `1-1`). Egipt wygrał karnymi, ale w schemacie tej info nie ma.

**Decyzja: A — ignorujemy.** Forced przez pyt. 1 = A. Mecze rozstrzygnięte karnymi pojawią się jak remisy po dogrywce z `status: "FT"`. Lista 3 takich meczów w README projektu jako known limitation:
- `EGY 1-1 PAR` (Men's QF) — Egypt won PSO 5-4
- `ESP 2-2 COL` (Women's QF) — Spain won PSO 4-2
- `CAN 0-0 GER` (Women's QF) — Germany won PSO 4-2

---

## 9. Format `minute` przy doliczonym czasie ✅

### Założenie podstawowe — jak działa numeracja w danych OG2024

Dane używają **ciągłej numeracji minut przez cały mecz** (continuous numbering). Każdy okres ma stały zakres minut bazowych, a doliczony czas jest oznaczony sufiksem `+X`:

| Okres | Zakres minut bazowych | Forma stoppage |
|---|---|---|
| `H1` (pierwsza połowa) | 1 – 45 | `"45' +1"`, `"45' +2"`, ... |
| `H2` (druga połowa) | 46 – 90 | `"90' +1"`, `"90' +2"`, `"90' +3"`, ... |
| `ET-H1` (pierwsza dogrywka) | **91 – 105** | (rzadko, ale `"105' +X"` możliwe) |
| `ET-H2` (druga dogrywka) | **106 – 120** | `"120' +1"`, ... |
| `PSO` (rzuty karne po dogrywce) | brak minuty (`pbpa_When === undefined`) | n/d |

**To znaczy:** dogrywka NIE zaczyna numerować od 1. Pierwsza minuta ET-H1 to minuta **91** całego meczu, druga to 92, trzecia to 93. Gol Matety w SFNL przy `pbpa_When: "99'"` to potwierdza — to 99-ta minuta meczu, czyli 9-ta dogrywki.

### Decyzja

**A — bazowa minuta jako `number` (integer).** Parser: regex `^(\d+)'` → `parseInt`.

Typ zgodny z `example.json` (`"minute": 18` to JSON `number`, nie string). W TypeScript: `minute: number`.

### Reguła w jednym zdaniu

> Weź pierwszą liczbę przed apostrofem, **zignoruj** wszystko za nim (`+X`).

### Skutek dla dwóch sytuacji które łatwo pomylić

To jest **kluczowy punkt** — przy opcji A te dwie sytuacje dają **różne** wartości `minute`:

| Sytuacja w meczu | `pbpa_When` | `period` | **`minute`** |
|---|---|---|---|
| **3 minuta doliczonego czasu H2** (gol w 90+3) | `"90' +3"` | `H2` | **`90`** |
| **3 minuta regularnej dogrywki** (ET-H1, czyli 91+2) | `"93'"` | `ET-H1` | **`93`** |

Czyli `90+3` zwija się do `90`, a 3. minuta dogrywki to `93`. **Nie kolidują.** To była główna obawa przy projektowaniu — opcja B (sumowanie, `90+3 → 93`) zlewałaby te dwa przypadki w jedno `93` i nie dałoby się ich rozróżnić bez pola `period`, którego `example.json` nie ma.

### Pełna tabela mapowania

| `pbpa_When` | `period` | `minute` |
|---|---|---|
| `"11'"` | H1 | 11 |
| `"45'"` | H1 | 45 |
| `"45' +2"` | H1 | 45 *(stoppage zwija się do końca H1)* |
| `"49'"` | H2 | 49 |
| `"90'"` | H2 | 90 |
| `"90' +3"` | H2 | 90 *(stoppage zwija się do końca H2)* |
| `"93'"` *(hipotetyczna)* | ET-H1 | 93 *(3. minuta dogrywki)* |
| `"99'"` | ET-H1 | 99 |
| `"108'"` | ET-H2 | 108 |
| `"120' +1"` | ET-H2 | 120 *(stoppage zwija się do końca ET-H2)* |
| `undefined` | PSO | bramka pomijana ze `scorers[]` (patrz pyt. 7) |
| `"ET-HT"` lub inne nieliczbowe | dowolny | bramka pomijana ze `scorers[]` + `console.warn` (defensywnie — w danych nieobserwowane) |

### Co tracimy w opcji A

- Informację "która konkretnie minuta stoppage" (czy gol padł w 90+1 czy 90+3 — w obu przypadkach `minute = 90`).

### Co zyskujemy

- Jednoznaczność: każda wartość `minute` referuje do dokładnie jednej "logicznej minuty meczu" (regulaminowej lub dogrywki, niezlewane).
- Zgodność typu z `example.json` (integer).
- Deterministyczna prosta reguła: pierwsza liczba przed `'`.

---

## 10. Typ bramki — header ✅

W danych OG2024 **nie ma sygnału headera** (sprawdziliśmy: `pbpa_Loc`=null, `pbpa_Comment`=undefined we wszystkich 33 SCR-ach z 6 meczów próbnych).

**Decyzja: A — akceptujemy stratę.** Forced przez pyt. 1 = A. Wszystkie bramki które nie są `pbpa_Action === "PEN"` (i nie są w PSO) → `type: "open_play"`. W README jako known limitation.

---

## 11. Typ bramki — `pbpa_Action: "FRD"` (z rzutu wolnego) ✅

Jeden gol z FRD obserwowany (Alex Baena vs France w finale Gold). `example.json` zna tylko `"open_play"`/`"header"`/`"penalty"`.

**Decyzja: A — `"open_play"`.** Forced przez pyt. 1 = A.

### 11a. Samobóje — `pbpa_Action: "OG"` ✅

W danych OG2024 są 4 samobóje w 3 meczach (Mali-ISR M GroupD; ZAM-? W GroupB; ESP-BRA W SF — dwa). API oznacza je inaczej niż zwykłe gole: w `competitors[]` jest tylko **jedna drużyna — drużyna własna strzelca**, athlete nie ma `pbpat_role: "SCR"`, a punkt w `pbpa_ScoreH/A` idzie do drużyny **przeciwnej**.

**Decyzja: dodajemy do `scorers[]` z drużyną-beneficjentem i typem `"open_play"`.** Zgodnie z konwencją FIFA: zawodnik jest wymieniony jako autor gola, ale gol jest zaliczony drużynie przeciwnej (`team` w outpucie = drużyna przeciwna do tej w `competitors[].pbpc_code`). `assist` nigdy nie towarzyszy OG-bramce.

**Uzasadnienie:** Schemat `example.json` nie dopuszcza `"own_goal"` w enumie `Scorer.type`, a samobój **jest** golem zaliczonym do wyniku — pominięcie go (jak PSO) gubiłoby strzelca dla 4/58 meczów. `"open_play"` to akceptowalna utrata informacji o "rodzaju" przy zachowaniu pełnej atrybucji "kto i kiedy" — kompromis ten sam co przy `FRD`.

**Mapping `scorers[].type` (finalny):**
- `pbpa_Action === "PEN"` AND `pbpa_period !== "PSO"` → `"penalty"`
- `pbpa_period === "PSO"` → bramka pomijana (pyt. 7)
- `pbpa_Action === "OG"` → `"open_play"`, `team` = drużyna przeciwna (pyt. 11a)
- wszystko inne (`SHOT`, `FRD`, ewentualne inne) → `"open_play"`

---

## 12. Mapowanie `status` ✅

W danych OG2024 wszystkie 58 meczów ma `status.code === "FINISHED"`.

**Decyzja: `FINISHED → "FT"`, każdy inny kod → throw (defensywnie, per #27).** Minimalny mapping:
```
status.code === "FINISHED" → "FT"
inne → throw Error("unsupported status.code …")
```

**Uzasadnienie:** OG2024 to zamknięte archiwum historyczne (58/58 meczów FINISHED), a `example.json` specyfikuje wyłącznie wartość `"FT"`. Nie znamy reszty taksonomii statusów, więc raw passthrough wprowadzałby do outputu wartości spoza kontraktu (`"SCHEDULED"`, `"LIVE"` itd.) bez żadnej walidacji. Throw zatrzymuje pipeline na pojedynczym meczu, błąd jest wyłapywany przez `usePipeline` jako `matchErrors` i pokazany w UI — zgodnie z #27 reviewer od razu widzi, że pojawił się nieznany kod do rozpatrzenia jednostkowo.

---

## 13. Eksport — formy ✅

**Decyzja: C — single + multi-select + all.**

**Trzy ścieżki w UI:**

1. **Single match download** — przy każdym wierszu w tabeli/liście. Plik: `<eventUnit.code>.json`, treść = czysta shape `example.json`.
2. **Multi-select** — checkbox per wiersz + przycisk "Download selected" w toolbarze. Output: jeden plik JSON z mapą (patrz pyt. 14): `og2024-fbl-selected-<n>.json`.
3. **Download all** — globalny przycisk. Output: jeden plik JSON z mapą wszystkich 58: `og2024-fbl-all.json`.

**Uwaga:** Single download daje plik 1:1 zgodny ze schemą `example.json` (jest to JEDEN mecz). Multi i all zawijają w mapę keyed by `eventUnit.code` (patrz pyt. 14).

---

## 14. ID meczu w eksporcie ✅

**Decyzja: B (mapa keyed by `eventUnit.code`).** Format multi-select / all download:

```json
{
  "FBLMTEAM11------------GPA-000100--": {
    "competition": {...},
    "venue": {...},
    "kickoff": "...",
    ...   // czysta shape example.json
  },
  "FBLMTEAM11------------GPA-000200--": { ... },
  ...
}
```

**Uzasadnienie:** Klucz mapy = ID, zawartość = nietknięta shape `example.json` (per pyt. 1 = A). Mecz pojedynczo (single download) jest dosłownie wartością z tej mapy zapisaną pod nazwą pliku `<id>.json`. Lookup po ID natychmiastowy. Schemat per-mecz nigdzie nie naruszony.

---

## 15. Domyślna kolejność wyjścia ✅

Acceptance criteria wymaga deterministyczności i dokumentacji porządku.

**Decyzja:** Sortowanie `(startDate ASC, eventUnit.code ASC)`. Tie-breaker po `eventUnit.code` daje stabilny porządek dla równolegle granych meczów (faza grupowa Olimpiad miała wiele równoległych godzin startu).

---

## 16. Filtr meczów ✅

Z `SCH_ByDisciplineH2H` przychodzi 60 wpisów per dyscyplinę-okres. Z tego:
- 58 to mecze (`eventUnit.type === "HTEAM"`),
- 2 to ceremonie medalowe (`eventUnit.type === "NONE"`, `phase.type === "6"`).

**Decyzja:** Filtruj `eventUnit.type === "HTEAM"`. Ceremonii nie eksportujemy.

---

## 17. Strefa czasowa ✅

Wszystkie kickoffy w danych mają `+02:00` (CEST — lipiec/sierpień 2024).

**Decyzja:** Zachowujemy oryginalny format ISO 8601 (`"2024-07-24T21:00:00+02:00"`). NIE konwertujemy do UTC. NIE hardkodujemy `+02:00` (parser musi przyjmować dowolny offset).

---

## 18. `venue.city` parsing ✅

`location.longDescription` ma format `"Stadium Name, City"`.

**Decyzja:** Split na `, `, trim ostatniego segmentu.

---

## 19. Format imion zawodników i trenerów ✅

`example.json` używa konwencji `"Jude Bellingham"` / `"Carlo Ancelotti"` (Title Case, given+family).

**Decyzja:** `givenName + " " + familyName`. Zachowuje myślniki (`"Jean-Philippe Mateta"`), apostrofy (`"Sabrina D'Angelo"`), akcenty. Konsystentne dla `scorers[].player`, `scorers[].assist`, `lineups.*.coach`, `lineups.*.startingXI[].name`, `lineups.*.bench[].name`.

---

## 20. UI — kolumny tabeli ✅

**Decyzja: B — średnio.** Domyślne kolumny:
- **[checkbox]** — selekcja do bulk action
- **Date** (z `startDate` → `YYYY-MM-DD` lub natural format)
- **Time** (z `startDate` → `HH:mm` z timezone Paris)
- **Round** (`competition.round` z naszego wyjścia, np. `"Men's Group A — Match 1"`)
- **Home** (nazwa drużyny)
- **Score** (np. `"1-2"` lub `"-"` dla niezakończonych)
- **Away** (nazwa drużyny)
- **Venue** (`venue.name`, ewentualnie skrót gdy długie)
- **Status** (`"FT"` / surowy code)
- **Actions** — `[⤓]` download single, `[▸]` view details (nav na `/match/:code`)

Klik na wiersz (poza checkboxem i akcjami) → nawigacja na `/match/:code` (strona szczegółów).
Klik na checkbox → tylko zaznacza, NIE nawiguje (`stopPropagation`).

Sortowanie: każda kolumna sortowalna (klik header), default `(Date, Time, Round)` ASC.

---

## 23. Stack technologiczny ✅

**Decyzja:** Vite + React 18 + TypeScript + Tailwind CSS. TanStack Query do fetch/cache/states. Zod do walidacji JSON-a OG2024 na wejściu (ostrzega gdy źródło zmieniłoby format). Vitest do unit testów. Brak proxy (CORS otwarte).

**Deploy:** GitHub Pages / Vercel static / Netlify (zero-config dla statycznego buildu).

**Dev:** `npm run dev` na lokalnym Vite. Brak serwera, brak proxy, brak skomplikowanej konfiguracji.

---

## 24. Format `lineups.*.coach` ✅

**Decyzja:** Z `teamCoaches[].coach`, formatowane jako `givenName + " " + familyName` (lub samo `familyName` gdy `givenName` brakuje, per pyt. 19).

**Source path:** `RES_ByRSC_H2H.results.items[i].teamCoaches[j]`.

**Function code precedencja** (przy wyborze head coacha — empirycznie potwierdzone na 58 meczach):

| Code | Znaczenie | Kiedy używany |
|---|---|---|
| `COACH` | Head Coach | 54/58 meczów (standard) |
| `SI_COA` | Stand-in Coach | 4 mecze Kanady (kobiety): Andy Spence zastępujący zawieszoną Bev Priestman |
| `INT_COA` | Interim Coach | nie zaobserwowane, defensywnie |
| inne (≠ `AST_COA`) | fallback | nie zaobserwowane, defensywnie |

`AST_COA` (Assistant Coach) nigdy nie traktujemy jako head coacha.

**Przykłady:** `"Javier Mascherano"` (ARG, COACH), `"Andy Spence"` (CAN W, SI_COA), `"Thierry Henry"` (FRA, COACH).

**Known edge case w Paris 2024:** Bev Priestman (CAN W head coach) zawieszona przed turniejem po aferze ze szpiegowskim dronem; Andy Spence prowadził drużynę jako stand-in we wszystkich 4 meczach Kanady. Output zawiera Spence'a — zgodnie z faktycznym przebiegiem turnieju.

---

## 25. Sortowanie zawodników w `startingXI[]` i `bench[]` ✅

OG2024 daje `teamAthletes[].startSortOrder` — naturalny porządek football (GK → DF → MF → FW).

**Decyzja:** Sort `teamAthletes` po `startSortOrder` ASC.
- Pierwsze 11 (z `STARTER=Y`) → `startingXI` (GK→DF→MF→FW).
- Pozostałe (bez `STARTER=Y`) → `bench` (też GK→DF→MF→FW).

---

## 26. Pole `position` w `lineups.*.startingXI[]` i `bench[]` ⚠️ known limitation

### Konflikt który rozwiązujemy

`example.json` używa **granularnego enum 11 wartości**: `{GK, RB, CB, LB, DM, CM, AM, LW, RW, ST, FW}`.

Dane OG2024 dają **tylko 4 broad codes**: `{GK, DF, MF, FW}`.

Spośród nich tylko `GK` i `FW` są w enumie example.json. **Emitowanie `"DF"` lub `"MF"` łamie strykt schemat (Q1=A)**, więc tych wartości użyć nie możemy.

### Decyzja: default mapping deterministyczny

```
"GK" → "GK"
"DF" → "CB"     // każdy obrońca jako centre back (najczęstsza rola defensiwna)
"MF" → "CM"     // każdy pomocnik jako centre mid (najczęstsza rola pomocy)
"FW" → "FW"
```

Spójne z duchem **Q11 (FRD → "open_play")** — mapujemy wartość spoza enuma do najbliższej dozwolonej.

Wszystkie 4 wartości docelowe (`GK`, `CB`, `CM`, `FW`) są w enumie `example.json` ✓

### Source path

```ts
const broadPosition = athlete.athlete.registeredEvents[0]
  .eventEntries.find(e => e.ee_code === "POSITION")?.ee_value;
// broadPosition ∈ {"GK","DF","MF","FW"}
const position = ({ GK: "GK", DF: "CB", MF: "CM", FW: "FW" } as const)[broadPosition];
```

Ten sam mapper dla `startingXI[].position` i `bench[].position`.

### Dlaczego NIE granular Atos codes (D01, M21, F03 itd.)

Po analizie pełnej próby (58 meczów, 116 składów, 1276 starterów) — granular codes są ciekawe ale **nie deterministyczne** w mapowaniu na enum example.json. Szczegóły:

**Co granular codes faktycznie kodują** (potwierdzone empirycznie):

Codes to **horizontal-slot ID per linia formacji**. Liczby kodują pozycję od lewej do prawej:

| Linia obrony | Codes używane |
|---|---|
| 4-back | `D01, D03, D05, D07` (1-7 nieparzyste) |
| 3-back | `D02, D04, D06` (2-6 parzyste) |
| 5-back | `D00, D02, D04, D06, D08` (0-8 parzyste, rozszerzone) |

Te same wzorce dla `M##` (midfielders) i `F##` (forwards).

**Dlaczego mapowanie nie jest deterministyczne:**

Ten sam kod znaczy różne role piłkarskie w różnych drużynach (kod kodzi slot, drużyna decyduje kto co robi):

| Drużyna | Formacja | Bib + zawodnik | Granular | Faktyczna rola |
|---|---|---|---|---|
| Argentina | 4-4-2 | #2 di Cesare | `D05` | RB |
| Spain | 4-2-3-1 | #4 Eric Garcia | `D05` | RB |
| **USA W** | 4-1-2-3 | **#4 Naomi Girma** | **`D05`** | **CB** *(klasyczny CB grający na CB)* |

**Ten sam kod `D05` raz oznacza RB, raz CB.** Zamiana dotyczy też `D07`, `M##`, `F##`. Zachowanie zależy od konkretnej drużyny i jej tactical setup, nie od kodu.

**Inne źródła niedeterminizmu wykryte w danych:**
- 36 z 94 instancji 4-back **nie używa pełnego setu** `{D01,D03,D05,D07}` (jeden z DF dostał M-code bo gra wyżej, lub tylko 3 D-codes bo jeden DF gra zewnątrz formacji).
- 172 z 1276 starterów (13.5%) ma **broad/granular mismatch**: zarejestrowany jako FW gra jako wingback (M32), albo MF gra jako CB (D03), itd.
- Bench (813 zawodników) **nie ma granular codes** w ogóle — i tak musielibyśmy mieć fallback default dla nich.

**Wniosek:** Bez oficjalnej dokumentacji Atos albo zewnętrznego źródła z faktycznymi pozycjami zawodników w meczu, granular codes nie dają się zdeterministycznie zmapować. Default mapping daje 100% reprodukowalność i jest jawnym ograniczeniem.

### Co reviewer zobaczy

W każdym `lineups.*.startingXI[].position` i `lineups.*.bench[].position` zobaczy **dokładnie jedną z czterech wartości**: `"GK"` | `"CB"` | `"CM"` | `"FW"`. Granularnych kodów (`RB`, `LB`, `DM`, `AM`, `LW`, `RW`, `ST`) **nie wygenerujemy w ogóle**. To deterministyczna utrata informacji, wpisana w README sekcji "Known limitations".

---

## 27. Defensive coding — brakujące dane ✅

**Decyzja: A — throw + UI error.** Jeśli `result.periods` lub inne wymagane pole jest brakujące w `RES_ByRSC_H2H` mimo `status === "FINISHED"`, generator dla tego meczu rzuca z czytelnym komunikatem (`"Match FBLM…GPA-000100--: missing TOT period"`).

**UI behavior:** progress bar pokazuje `X/58 generated, Y errors`. Lista błędów w panelu rozwijanym z konkretnymi ID i message. Reszta meczów generuje się normalnie.

**Acceptance criteria check:** Wymóg "no omissions" jest spełniony — błąd jest jawny, nie cichy. Reviewer widzi dokładnie co się nie udało.

---

## 21. UI — stany loading/empty/error ✅

Acceptance criteria explicitly wymaga.

**Decyzja:** Każdy fetch (Days → H2H → RES) ma własne stany w UI: skeleton/spinner przy loading, pusty placeholder przy empty, error banner z retry przy fetch failure. Globalny progress bar dla całego pipeline'u (np. "Pobrano 42/72 plików").

---

## 28. Konwersje typów string → number ✅

Dane OG2024 dostarczają pola numeryczne jako stringi. `example.json` ma je jako liczby. **Wszystkie konwersje przez `parseInt(value, 10)`** (10 explicit żeby uniknąć surprisingi base-8/16):

| `example.json` pole | Typ | OG2024 source (string) | Konwersja |
|---|---|---|---|
| `score.home` | `number` | `result.periods[TOT].home.score` | `parseInt(_, 10)` |
| `score.away` | `number` | `result.periods[TOT].away.score` | `parseInt(_, 10)` |
| `score.halfTime.home` | `number` | `result.periods[H1].home.score` | `parseInt(_, 10)` |
| `score.halfTime.away` | `number` | `result.periods[H1].away.score` | `parseInt(_, 10)` |
| `scorers[].minute` | `number` | `pbpa_When` | parser regex z Q9 |
| `startingXI[].number` | `number` | `teamAthletes[].bib` | `parseInt(_, 10)` |
| `bench[].number` | `number` | `teamAthletes[].bib` | `parseInt(_, 10)` |

**Defensive:** Jeśli `parseInt` zwraca `NaN` (np. period brakuje), sygnalizujemy błąd (per pyt. 27 — throw + UI error).

---

## 29. `scorers[]` — szczegóły porządku, asyst, pustych tablic ✅

### Kolejność wewnątrz tablicy

**Sortowanie chronologiczne ASC po `minute`.** Tie-breaker: `pbpa_order` z `playByPlay[].actions[].pbpa_order` — to natywny chronologiczny indeks akcji w meczu z OG2024 (już deterministyczny).

```ts
scorers.sort((a, b) =>
  (a.minute - b.minute) ||
  (a._pbpa_order - b._pbpa_order)
);
```

### `assist` — pole opcjonalne

`example.json` **omija klucz** `assist` gdy bramki nie poprzedza asysta (En-Nesyri header w 41', Vinícius penalty w 78'). Tylko Bellingham (open_play) ma `assist: "Rodrygo"`.

**Decyzja:** Pole `assist` emitujemy **tylko gdy jest asysta**. Brak asysty → klucz pominięty (NIE `null`, NIE `undefined`).

```ts
const goal = {
  team, player, minute, type,
  ...(assistName ? { assist: assistName } : {}),  // conditional include
};
```

Wykrycie asysty: w `competitors[k].athletes[]` musi być element z `pbpat_role === "ASSIST"`.

### Pusty `scorers[]`

Mecz 0-0 → `scorers: []` (pusta tablica, **NIE** brak klucza). Konsystentne kształtowo z `example.json` (zawsze ma `scorers`).

---

## 30. `lineups.*.formation` — source path explicit ✅

Pole `formation` na poziomie home i away pochodzi z **per-team `eventUnitEntries`** w `RES.results.items[]`.

```ts
const formation = item.eventUnitEntries
  .find(e => e.eue_code === "FORMATION")?.eue_value;
// np. "4-3-3", "4-2-3-1", "3-4-3"
```

**Format identyczny** z `example.json` — bezpośrednie skopiowanie bez parsowania. Lista zaobserwowanych formacji w pełnej próbie 116 składów: `3-4-1-2, 3-4-3, 3-5-2, 4-1-2-1-2, 4-1-2-3, 4-2-3-1, 4-3-1-2, 4-3-3, 4-4-1-1, 4-4-2, 4-5-1, 5-2-3, 5-3-2, 5-4-1`.

**Parowanie `home/away`:** Z `eventUnitEntries[HOME_AWAY]` na tym samym `item` — `lineups.home.formation` ← formacja z item gdzie `HOME_AWAY=HOME`.

**Defensive:** Jeśli formation brakuje (mało prawdopodobne dla FINISHED), throw + UI error per pyt. 27.

### Pusty `bench[]` defensywnie

Jeśli `teamAthletes` nie zawiera żadnych zawodników bez `STARTER=Y` (mało prawdopodobne — wszystkie 58 meczów ma 7 ławki) → `bench: []` (pusta tablica). NIE pomijamy klucza.

---

## 31. Source-of-truth: SCH vs RES ✅

W obu `SCH_ByDisciplineH2H` i `RES_ByRSC_H2H` znajdują się te same pola (kickoff, teams, venue). Decyzja na wypadek rozjazdu:

**SCH wygrywa dla wszystkiego co istnieje przed meczem (pre-match):**

```
competition.*       ← SCH (eventUnit.longDescription, unitNum, startDate-year)
venue.name          ← SCH.venue.description
venue.city          ← parse(SCH.location.longDescription)
kickoff             ← SCH.startDate
status              ← SCH.status.code  (RES.results.status.code potwierdza)
teams.home/away     ← SCH.start[] cross-ref'ed po HOME_AWAY z RES.items[].eventUnitEntries
```

**RES wyłącznie dla post-match:**

```
score.* (TOT, H1)   ← RES.results.periods
scorers[]           ← RES.results.playByPlay (akcje SCR/ASSIST)
lineups.*.team      ← RES.results.items[].participant.name
lineups.*.formation ← RES.results.items[].eventUnitEntries[FORMATION]
lineups.*.coach     ← RES.results.items[].teamCoaches[function=COACH].coach
lineups.*.startingXI← RES.results.items[].teamAthletes (filter STARTER=Y)
lineups.*.bench     ← RES.results.items[].teamAthletes (filter !STARTER=Y)
```

**Pipeline:** Najpierw 13× SCH (parallel) → lista 58 meczów z pre-match info. Potem 58× RES (parallel) → uzupełnienie post-match. UI może pokazać listę zaraz po SCH, generuje endpointy po RES.

**Konflikt SCH vs RES:** Jeśli pre-match pole różni się między SCH i RES (nie obserwowano w 58 meczach Paris 2024), warning w console + użyj wartość z SCH. Niezgodność loguj do error panelu UI.

---

## 32. Strona szczegółów meczu — Generated / Parsed ✅

Acceptance criteria [readme.md:52](readme.md#L52): *"Users can inspect the match data used to build each endpoint."*

**Decyzja:** Dedykowana strona `/match/:eventUnitCode` (NIE modal) z **dwoma zakładkami**:

1. **Generated** (default) — wygenerowany JSON w shape `example.json`, **z color highlight per source** (#37: 🟢 SCH / 🔵 RES / ⚪ const). Spełnia readme.md:52: każde pole ma widoczne źródło bez potrzeby otwierania osobnego widoku raw. To co wyląduje w eksporcie.
2. **Parsed** — DOM widok: sekcje "Match info", "Score breakdown", "Lineups (table per team)", "Goals timeline" — czytelne wizualnie, bez raw JSON.

**Layout strony:**

```
┌────────────────────────────────────────────────────────────┐
│ [< Back to matches]                            [Lang ▾][🌗]│
├────────────────────────────────────────────────────────────┤
│ Argentina  1 - 2  Morocco                                   │
│ Men's Group B — Match 1 · 24.07.2024 15:00 · Geoffroy-…  FT │
├────────────────────────────────────────────────────────────┤
│ [Generated]  [Parsed]                                      │
├────────────────────────────────────────────────────────────┤
│ Legend: 🟢 SCH endpoint  🔵 RES endpoint  ⚪ const / mapping│
│                                                            │
│ ⚪ "competition": {                                         │
│ ⚪   "name": "Olympic Games",                               │
│ ⚪   "season": "Paris 2024",                                │
│ 🟢   "round": "Men's Group B — Match 1"                     │
│ ⚪ },                                                       │
│ 🟢 "venue": { "name": "...", "city": "..." },               │
│ 🟢 "kickoff": "2024-07-24T15:00:00+02:00",                  │
│ 🔵 "score": { "home": 1, "away": 2, "halfTime": {...} },    │
│ 🔵 "scorers": [ ... ],                                      │
│ 🔵 "lineups": { ... }                                       │
├────────────────────────────────────────────────────────────┤
│           [Download this match]    [☐ Add to selection]    │
└────────────────────────────────────────────────────────────┘
```

**Generated tab — funkcje:**
- Each line has bg color per source (#37).
- Tooltip on hover każdego pola: "from SCH endpoint: SCH_ByDisciplineH2H~..." z faktycznym URL endpointu.
- "Copy JSON" button kopiuje wartość bez kolorów (czysty schemat).

**Parsed tab — sekcje:**
- **Match info**: competition, venue, kickoff, status (key-value layout).
- **Score**: tabelka home/away (regulation, half-time, ewentualnie ET).
- **Lineups**: dwie tabele po 11+7 zawodników (number, position, name) per drużyna. Captain z badgem.
- **Goals timeline**: chronologiczna lista bramek z minutą, drużyną, strzelcem, asystą, typem.

**Nawigacja:** Klik wiersza w tabeli (lub karty na mobile) → `/match/:code`. Akcja [▸] w kolumnie Actions — to samo. Browser back → lista z zachowanymi filtrami.

**A11y:** zakładki to Radix Tabs (keyboard nav, ARIA roles). H1 to nazwy drużyn z wynikiem (struktura nagłówków).

---

## 33. Bonus — automated JSON comparison view (Git-style diff) ✅

Readme [bonus](readme.md#L25-L26): *"run automated JSON comparison with the tested API"*. FootyScores jest fikcyjne, więc realnego API do porównania nie ma. Jednak narzędzie comparison-diff jest użyteczne dla QA niezależnie.

**Decyzja:** Mock comparison view jako route `/compare/:eventUnitCode?` z **Git-style diff** (jak GitHub PR diff / VS Code / `git diff` CLI).

### Flow

1. Wejście: route `/compare` (bez wyboru) lub `/compare/:eventUnitCode` (preselected po nawigacji z detail strony).
2. Selektor meczu: dropdown z 58 meczów (filtrowalny).
3. Textarea: reviewer wkleja "actual response" jako JSON.
4. Walidacja JSON inline (parse error → czytelny komunikat, brak diff).
5. Output: **Git-style diff** między `expected` (nasz generated) a `actual` (paste).

### Visual style — jak Git diff

- **Split view (default)** — dwie kolumny:
  - Lewa: `expected` (numery linii, czerwone tło dla różnic).
  - Prawa: `actual` (numery linii, zielone tło dla różnic).
- **Unified view (toggle)** — jedna kolumna w klasycznym stylu git CLI: `-` czerwone (expected), `+` zielone (actual), ` ` białe (unchanged).
- **Word-level diff w obrębie zmienionej linii** — tylko zmieniony fragment ma highlight (`"season": "Paris 2024"` vs `"2024"` → tylko `Paris ` wyróżniony, nie cała linia).
- **Collapse unchanged sections** — długie segmenty bez różnic składają się do `… N lines unchanged …` z opcją expand (jak GitHub).
- **Syntax highlighting** dla JSON (klucze, stringi, liczby — niezależnie od diff bg).
- **Line numbers** po obu stronach.
- **Summary nad diffem**: `+5 lines, −2 lines, 1 word change, 47 unchanged` lub `✓ Identical`.

```
+ Compare endpoint                                       
+--------------------------------------------------------+
| Match:  [FBLM...GPB-000100  (ARG 1-2 MAR)         ▼]   |
|                                                        |
| Paste actual response from API:                        |
| +----------------------------------------------------+ |
| | {                                                  | |
| |   "competition": {                                 | |
| |     "name": "Olympic Games",                       | |
| |     "season": "2024",                              | |
| |     ...                                            | |
| | }                                                  | |
| +----------------------------------------------------+ |
|                                            [Compare]   |
+--------------------------------------------------------+
| Diff                                                   |
| ── competition.season                                  |
|   - "Paris 2024"   (expected)                          |
|   + "2024"         (actual)                            |
| ── score.halfTime.away                                 |
|   - 1                                                  |
|   + 0                                                  |
| ✓ 28 fields match                                      |
+--------------------------------------------------------+
```

**Why mock**: FootyScores fikcyjne, brak realnego URL/auth/fetch. Architektura "real fetch + auth" opisana jako future work.

**Czas:** ~1-2h (textarea + microdiff + render diff). Wartość dodana do submission znacząca.

---

## 34. UI — stack bibliotek ✅

| Warstwa | Biblioteka | Powód |
|---|---|---|
| Tabela | **TanStack Table v8** | Headless, lekka, sort/filter/select wbudowane, a11y-friendly |
| Tabs (na detail page) | **Radix UI Tabs** | A11y baked-in: keyboard nav, ARIA roles |
| Tooltip | **Radix UI Tooltip** | jw. (na potrzeby Generated annotacji) |
| Checkbox | **Radix UI Checkbox** | jw. |
| Form (filtry) | natywne `<input>` + Tailwind | proste; Radix Select dla multi-select Round |
| i18n | **react-i18next** | Standard, lazy load, łatwo dodać kolejny język |
| JSON diff (Git-style) | **react-diff-viewer-continued** | ~30 KB gz, MIT, maintained fork; split/unified, word-level, collapse unchanged, theme-aware |
| JSON viewer | **własny** custom component | Pełna kontrola nad color highlight per source (nie ma takiej funkcji w bibliotekach) |
| Schema validation | **Zod** | walidacja `stacy.olympics.com` JSON-ów na wejściu |
| Routing | **react-router v6** | dwa routes: `/` (lista+modal) + `/compare` (compare view) |
| State (filters/sort) | URL search params via react-router | shareable links |
| Selection state | local React state (useState/useReducer) | per-tab, niezgodne URL |
| Testy unit | **Vitest** | fast, ESM native, kompatybilne z Vite |
| Testy komponentów | **React Testing Library** + **@testing-library/jest-dom** | de facto |

---

## 35. UI — filtry tabeli ✅

Wszystkie 4 filtry w UI:

| Filter | Typ kontrolki | Default | URL param |
|---|---|---|---|
| **Tournament** (Men's / Women's) | toggle 3-state | All | `?t=men\|women\|all` |
| **Round** (Group A-D, QF, SF, Bronze, Gold) | multi-select dropdown | wszystkie | `?r=GP-A,GP-B,QF,SF,...` |
| **Date range** | date picker (od-do) | pełen zakres turnieju | `?from=2024-07-24&to=2024-08-10` |
| **Team search** | text input (substring, case-insensitive) | empty | `?q=<text>` |

Wszystkie filtry łącznie (AND). Reset button "Clear filters". Wartość filtrów synchronizowana z URL — refresh-safe, shareable.

Filtry są stosowane na poziomie **wynikowej tabeli**, nie na poziomie fetchy. Wszystkie 58 meczów ładujemy, filtry to view-level.

---

## 36. UI — layout mobile ✅

**Decyzja: A — cards na <768px (md breakpoint Tailwind).**

```
Desktop (>=768px):           Mobile (<768px):
┌────────────────────┐       ┌──────────────┐
│ Tabela 8 kolumn    │       │ ☐ ARG 1-2 MAR│
│ ☐ 24.07 ARG 1-2..│       │   M Gp B M1  │
│ ☐ 24.07 UZB 1-2..│       │   24.07 15:00│
│ ☐ 24.07 GUI 1-2..│       │   FT  Geo... │
│ ☐ 24.07 ESP-COL  │       │   [⤓][☑] [▸]│
│ ...                │       ├──────────────┤
└────────────────────┘       │ ☐ UZB 1-2 ESP│
                             │   M Gp C M1  │
                             │   24.07 15:00│
                             │   FT  PdP    │
                             │   [⤓][☑] [▸]│
                             ├──────────────┤
                             │ ...          │
                             └──────────────┘
```

Card pokazuje: drużyny + wynik (głowa), round + kickoff + status + venue (ciało), download/select/details (footer). Klik karty → nawigacja na `/match/:code`.

Implementacja: Tailwind `hidden md:table-row-group` dla tabeli, `md:hidden` dla cards. Komponent współdzieli logikę selekcji i sortowania (tylko render się zmienia).

Filtry na mobile: collapse w dropdown "Filters (3)" w toolbarze.

---

## 37. UI — Generated view: oznaczenie źródła pól ✅

**Decyzja: B — inline color highlight.** Pretty JSON z subtelnym tłem per linia, zależnie od źródła:

| Kolor | Źródło | Pola |
|---|---|---|
| 🟢 jasnozielony (`bg-emerald-50`) | **SCH** | `competition.round`, `kickoff`, `venue.*`, `teams.*` |
| 🔵 jasnoniebieski (`bg-sky-50`) | **RES** | `score.*`, `scorers[].*`, `lineups.*` |
| ⚪ jasnoszary (`bg-slate-100`) | **const** | `competition.name`, `competition.season`, `status` (FT mapping) |

Legenda nad widokiem (i18n-aware):
```
Source legend:  🟢 from SCH  🔵 from RES  ⚪ const / mapping
```

Dark mode: te same kolory, ale dark variants (`dark:bg-emerald-900/30` itd.).

A11y: nie polegamy wyłącznie na kolorze — pod każdą wartością screen-reader-only `<span class="sr-only">from RES</span>`. Plus tooltip on hover dla widzących użytkowników (Radix Tooltip).

---

## 38. Theme — light + dark toggle ✅

**Decyzja: B — light + dark z togglem.**

- Default: matches `prefers-color-scheme` z OS.
- Toggle w headerze (Radix Switch lub button z ikoną).
- Persist w `localStorage` pod kluczem `theme` (`"light" | "dark" | "system"`).
- Tailwind config: `darkMode: 'class'`, klasa `dark` na `<html>` zarządzana przez React effect.
- Każdy komponent: pary `bg-white dark:bg-slate-900`, `text-slate-900 dark:text-slate-100` itd.

---

## 39. Routing — trzy widoki ✅

```
/                              → MatchesPage      (lista meczów + filtry + pobieranie)
/match/:eventUnitCode          → MatchDetailPage  (szczegóły jednego meczu, 3 zakładki)
/compare                       → ComparePage      (mock comparison view, pyt. 33)
/compare/:eventUnitCode        → ComparePage      (z preselectowanym meczem)
```

**Nawigacja do szczegółów:** Klik wiersza w tabeli (lub karty na mobile) → `navigate("/match/:code")`. Akcja kontekstowa "View details" (przycisk lub menu) — to samo. Plus historie back/forward działa naturalnie (back → wraca do listy z zachowanymi filtrami i pozycją scrolla).

**Refresh-safe deep links:**
- `/match/FBLMTEAM11------------GPA-000100--` — zawsze otwiera ten mecz, nawet z linka.
- Jeśli mecz nie jest jeszcze fetched (cache pusty), strona ładuje SCH (dla danego dnia) + RES (dla tego meczu) on-demand.

**Filtry list-page:** query params na `/` (patrz #35). Powrót z detail strony zachowuje filtry.

**Podział kodu:** każda strona to `React.lazy()` lazily — szybszy initial load tylko dla tego co użytkownik widzi.

---

## 40. UX flow — fazowanie ładowania danych ✅

1. **Pierwsze otwarcie strony**: pusty stan, button **"Load matches"** w centrum (i18n).
2. **Klik "Load matches"**: równolegle 13 SCH days. Progress bar `0/13 → 13/13`. Po zakończeniu: tabela z 58 meczami.
3. **Generate endpoints**: dwa tryby:
   - **Auto**: po SCH automatycznie odpalane 58 RES (parallel, batched 8 na raz dla nie zatkania connection limit przeglądarki). Progress `0/58 → 58/58`.
   - **On-demand**: per mecz — klik wiersza otwiera modal, jeśli RES nie jest jeszcze fetched, fetch w modal-owym loaderze.
   - **Default: Auto** (chcemy żeby reviewer widział szybko pełne dane w tabeli wyników).
4. **Eksport**: dostępny tylko gdy 100% endpointów wygenerowanych (przyciski enabled).
5. **Cache TanStack Query**: po kolejnym otwarciu strony, dane trzymane w pamięci do końca sesji + HTTP cache 30 dni przeglądarki.

Stany UI per faza:
- `idle` → button "Load matches"
- `loading-sch` → progress bar + skeleton tabeli
- `loading-res` → tabela z 58 meczami + per-row "generating..." status, global progress bar
- `ready` → wszystko OK, akcje aktywne
- `error-sch` / `error-res` → ErrorBanner z retry (per fetch lub all)

---

## 41. Accessibility ✅

**Cele:** WCAG 2.1 AA. Nie ślepe accessibility — celowe.

**Praktyki:**
- **Semantic HTML**: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, `<td>`, `<button>`, `<input>`, `<label>` — nie `<div>` dla wszystkiego.
- **Keyboard nav**: tab przez wszystkie interaktywne elementy, focus visible (Tailwind `focus:ring-2`), escape zamyka modal.
- **ARIA**: Radix komponenty ogarniają natywnie. Custom: `aria-label` na ikonkach (i18n), `aria-busy` na progress, `aria-live="polite"` dla dynamicznych komunikatów (np. "58 matches loaded").
- **Screen readers**: `<span class="sr-only">` dla kontekstu (np. ikonek-only buttons), legend SCH/RES sr-only inline.
- **Color contrast**: AA (4.5:1 dla tekstu, 3:1 dla UI). Tailwind klasy z slate/emerald/sky dobrze wpadają w AA.
- **Color blindness**: nie polegamy WYŁĄCZNIE na kolorze — SCH/RES highlight ma też tooltip + sr-only text.
- **Motion**: respect `prefers-reduced-motion` (no spinning loaders, fade zamiast slide).
- **Focus management**: po otwarciu modalu focus na pierwszym interaktywnym elemencie (Radix Dialog ogarnia).

---

## 42. Performance ✅

**Strategie minimalizacji:**
- **Bundle size**: tree-shaking Vite + tylko niezbędne Radix prymitywy (każdy importowany osobno, nie cały Radix).
- **Lazy load**: ComparePage lazy loaded (`React.lazy`) — większość użytkowników jej nie otworzy.
- **Code splitting**: tabela + modal w jednym chunku (zawsze potrzebne razem); compare oddzielnie.
- **Network**: TanStack Query — deduplication, cache, background refetch off (turniej w archiwum, dane statyczne).
- **HTTP cache**: serwer zwraca `max-age=2592000` — drugie otwarcie strony = 0 fetchów.
- **Lazy fetch RES**: opcjonalny tryb gdy auto-generate-after-SCH wyłączone.
- **Render performance**: TanStack Table virtualization dla rzędów (nie potrzebne dla 58 rows, ale gotowe gdyby).
- **Image optimization**: brak obrazków poza ikonami SVG (lucide-react inline).
- **Lighthouse target**: 90+ Performance, 100 Accessibility, 100 Best Practices, 100 SEO.

---

## 43. Code architecture ✅

```
src/
├─ app/                            # composition root
│   ├─ App.tsx                     # routes setup + providers
│   ├─ providers.tsx               # QueryClient + i18n + ThemeProvider
│   └─ i18n/
│       ├─ index.ts                # i18next setup
│       └─ locales/
│           └─ en.json             # default
│
├─ data/                           # I/O layer (testowalne z mocks)
│   ├─ api/
│   │   ├─ stacy-client.ts         # fetch + UA + retry
│   │   ├─ schemas.ts              # Zod schemas SCH/RES
│   │   └─ types.ts                # TS types z Zod
│   └─ queries/
│       ├─ useDays.ts              # SCH_DaysByDiscipline (1 fetch)
│       ├─ useH2H.ts               # SCH_ByDisciplineH2H (13 fetches)
│       └─ useRes.ts               # RES_ByRSC_H2H (58 fetches, batched)
│
├─ domain/                         # CZYSTE FUNKCJE (100% testowalne)
│   ├─ types.ts                    # Match, Score, Scorer, Lineup, Player
│   ├─ mapping/
│   │   ├─ competition.ts          # Q3-Q6
│   │   ├─ venue.ts                # Q18
│   │   ├─ kickoff.ts              # Q17
│   │   ├─ score.ts                # Q28
│   │   ├─ scorers.ts              # Q7, Q9, Q11, Q29
│   │   ├─ lineups.ts              # Q19, Q24-26, Q30
│   │   ├─ status.ts               # Q12
│   │   └─ buildMatch.ts           # composer SCH+RES → Match
│   ├─ export/
│   │   ├─ single.ts               # 1 mecz → file
│   │   ├─ bulk.ts                 # mapa keyed by code (Q14)
│   │   └─ filename.ts             # naming convention
│   ├─ sort/
│   │   └─ sortKey.ts              # Q15
│   └─ filter/
│       └─ matchFilters.ts         # Q35
│
├─ ui/                             # komponenty
│   ├─ pages/
│   │   ├─ MatchesPage.tsx              # / (lista + filtry)
│   │   ├─ MatchDetailPage.tsx          # /match/:code (3 zakładki)
│   │   └─ ComparePage.tsx              # /compare(/:code)
│   ├─ components/
│   │   ├─ MatchesTable/
│   │   │   ├─ MatchesTable.tsx        # TanStack Table desktop
│   │   │   ├─ MatchesCards.tsx        # mobile card view
│   │   │   ├─ columns.ts              # column definitions
│   │   │   └─ FiltersToolbar.tsx
│   │   ├─ MatchDetail/
│   │   │   ├─ MatchHeader.tsx         # H1 z drużynami + meta info
│   │   │   ├─ GeneratedView.tsx       # JSON z color highlight per source
│   │   │   └─ ParsedView.tsx          # DOM-style breakdown
│   │   ├─ ComparisonView/
│   │   │   ├─ ComparisonView.tsx
│   │   │   └─ DiffViewer.tsx
│   │   ├─ ErrorBanner.tsx
│   │   ├─ EmptyState.tsx
│   │   ├─ ProgressBar.tsx
│   │   ├─ ThemeToggle.tsx
│   │   └─ LangSwitcher.tsx
│   ├─ hooks/
│   │   ├─ useSelection.ts             # checkbox state
│   │   ├─ useTableState.ts            # filters/sort z URL
│   │   ├─ useGenerateAll.ts           # batch RES fetch
│   │   └─ useTheme.ts
│   └─ layout/
│       ├─ AppLayout.tsx
│       ├─ Header.tsx
│       └─ Footer.tsx
│
└─ test/
    ├─ fixtures/                   # cached SCH+RES JSONs
    │   ├─ sch/
    │   └─ res/
    └─ setup.ts                    # vitest globals
```

**Zasada:** `domain/` nie importuje z `data/` ani `ui/`. Pure functions, deterministyczne, testowalne bez mocks fetchu.

`data/queries/` używa `domain/mapping/buildMatch.ts` w `select` TanStack Query — surowe SCH+RES → Match w jednym kroku, automatycznie cached przez Query.

`ui/` używa `data/queries/` (hooks) i `domain/` (pure utils, np. sortKey, filtry). Nie wywołuje fetch bezpośrednio.

---

## 44. Testy ✅

**Pokrycie minimalne (must-have):**

| Co | Jak | Plik |
|---|---|---|
| `domain/mapping/*` | Vitest, fixture-based input/output | `*.test.ts` per plik |
| `domain/export/*` | Vitest, snapshot lub deep equal | `*.test.ts` |
| `domain/sort/sortKey.ts` | Vitest, mała tablica testów | `sortKey.test.ts` |
| `domain/filter/matchFilters.ts` | Vitest, test każdego filtra | `matchFilters.test.ts` |
| `data/api/schemas.ts` | Vitest, parse fixture przez Zod | `schemas.test.ts` |
| `ui/components/MatchesTable` | RTL: render + sort + filter z fixture | `MatchesTable.test.tsx` |
| `ui/components/MatchModal/GeneratedView` | RTL: render + color classes obecne | `GeneratedView.test.tsx` |
| `ui/components/ComparisonView/DiffViewer` | Vitest + RTL | `DiffViewer.test.tsx` |

**E2E (out of scope MVP):** docelowo Playwright — `1 happy path: load → generate all → export bulk → unzip → diff vs golden`. W scope dla bonus iteracji.

**Fixtures:** podzbiór 6-8 RES + 13 SCH skopiowane do `test/fixtures/`. Trzymane w repo (~1 MB), żeby testy działały offline + reprodukowalnie.

---

## 45. Compliance — fetch z API zamiast HTML scraping ⚠️ wymaga dokumentacji

[readme.md:7-8](readme.md#L7-L8) wskazuje URL: `https://stacy.olympics.com/en/paris-2024/competition-schedule`. My fetchujemy z `stacy.olympics.com/OG2024/data/*.json`. To wymaga jawnego uzasadnienia w README projektu.

### Decyzja

Używamy bezpośrednich endpointów JSON API zamiast HTML scrapingu. Powody:

1. **Byte-identyczne dane** — strona pod podanym URL to React SPA. HTML zawiera tylko shell `<div id="root"></div>` (~2 KB), brak danych meczowych. Realne dane app pobiera z `stacy.olympics.com/OG2024/data/*.json` (zweryfikowane DevTools Network → list of XHRs). Te endpointy są **dokładnie tym** czym zasila się strona — ten sam content.
2. **Ta sama domena `stacy.olympics.com`** — nie sięgamy po external service, tylko inną ścieżkę tej samej domeny.
3. **Niezawodność** — fetch JSON jest deterministyczny i odporny na zmiany layoutu strony. Scraping HTML byłby krucha (pierwsza zmiana CSS classes wywaliłaby parser).
4. **Performance** — JSON ~250 KB total dla całego turnieju vs HTML page + bundle JS ~3 MB + headless browser overhead. CORS otwarte, HTTP cache 30 dni.
5. **Brak wymagania headless browser** — Puppeteer/Playwright zwiększyłyby dependencies o ~150 MB i czas build/test wielokrotnie.

### Lista użytych endpointów (wszystkie z `stacy.olympics.com/OG2024/data/`)

| Endpoint | Cel | Częstotliwość |
|---|---|---|
| `SCH_DaysByDiscipline~comp=OG2024~disc=FBL~lang=ENG.json` | Lista 13 dni meczowych | 1× per session |
| `SCH_ByDisciplineH2H~comp=OG2024~disc=FBL~lang=ENG~date=YYYY-MM-DD.json` | Mecze danego dnia (kickoff, teams, venue) | 13× (jeden per dzień) |
| `RES_ByRSC_H2H~comp=OG2024~disc=FBL~rscResult=<eventUnit.code>~lang=ENG.json` | Pełne dane meczu (score, lineups, scorers) | 58× (jeden per mecz) |

Razem: 72 fetche, ~5.5 MB raw, deduplikowane przez TanStack Query + browser HTTP cache.

### W README projektu — jawna sekcja "Data source approach"

Powinna zawierać:
- Cytat z readme.md `source of truth`.
- Wyjaśnienie że strona to SPA bez SSR.
- Discovery process (DevTools → Network → znalezienie endpointów).
- Lista 3 użytych endpointów z linkami przykładowymi.
- Alternatywa rozważona (headless browser) i powód odrzucenia.
- Stwierdzenie że dane API są byte-identyczne z renderowaną stroną (= ten sam source of truth).

Z taką sekcją reviewer ma jasny audit trail decyzji.

---

## 22. Cache fetchowania ✅

Serwer zwraca `Cache-Control: max-age=2592000` (30 dni). Dane są niezmienne (turniej w archiwum).

**Decyzja:** Polegamy na native HTTP cache przeglądarki + dodatkowe TanStack Query cache w pamięci. Nie robimy własnego `localStorage`-cache (nie ma takiej potrzeby; bonus: po refreshu strony pierwszy fetch zaciągnie z dysku przeglądarki).
