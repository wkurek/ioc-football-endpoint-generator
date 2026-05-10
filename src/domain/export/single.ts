import type { Match, TeamLineup, Player, Scorer } from '@/domain/types';

/**
 * Serialize a single match to a JSON string in `example.json` shape.
 *
 * Output is byte-perfect against `example.json`: no wrapper, no `__metadata__`,
 * no extra keys. Used as the QA reference for "expected" responses, so byte
 * stability matters — a `JSON.stringify(match)` would tie key order to the
 * `Match` interface declaration order, which is fragile if the type ever
 * changes. Instead, we build the object explicitly in the canonical order
 * shown in `example.json` (competition → venue → kickoff → status → teams →
 * score → scorers → lineups), and per-Player/Scorer/Lineup the same way.
 *
 * Pretty-printed with 2-space indent for human review.
 */
export function exportSingleAsJson(match: Match): string {
  return JSON.stringify(canonicalizeMatch(match), null, 2);
}

/** Build an object whose key insertion order matches `example.json`. */
export function canonicalizeMatch(m: Match): Match {
  const scorers = m.scorers.map(canonicalizeScorer);
  return {
    competition: {
      name: m.competition.name,
      season: m.competition.season,
      round: m.competition.round,
    },
    venue: { name: m.venue.name, city: m.venue.city },
    kickoff: m.kickoff,
    status: m.status,
    teams: { home: m.teams.home, away: m.teams.away },
    score: {
      home: m.score.home,
      away: m.score.away,
      halfTime: { home: m.score.halfTime.home, away: m.score.halfTime.away },
    },
    scorers,
    lineups: {
      home: canonicalizeLineup(m.lineups.home),
      away: canonicalizeLineup(m.lineups.away),
    },
  };
}

function canonicalizeScorer(s: Scorer): Scorer {
  // `assist` stays optional — only emit the key when present (CONVENTIONS.md §4).
  const out: Scorer = { team: s.team, player: s.player, minute: s.minute, type: s.type };
  if (s.assist !== undefined) {
    return { team: s.team, player: s.player, minute: s.minute, assist: s.assist, type: s.type };
  }
  return out;
}

function canonicalizeLineup(l: TeamLineup): TeamLineup {
  return {
    team: l.team,
    formation: l.formation,
    coach: l.coach,
    startingXI: l.startingXI.map(canonicalizePlayer),
    bench: l.bench.map(canonicalizePlayer),
  };
}

function canonicalizePlayer(p: Player): Player {
  return { name: p.name, number: p.number, position: p.position };
}
