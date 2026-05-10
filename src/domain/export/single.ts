import type { Match, TeamLineup, Player, Scorer } from '@/domain/types';

/**
 * Byte-perfect `example.json` shape: no wrapper, no `__metadata__`, no
 * extras. Keys are emitted in `example.json` order via an explicit
 * canonicalizer — a plain `JSON.stringify(match)` would tie key order to
 * the `Match` interface declaration, which is fragile.
 */
export function exportSingleAsJson(match: Match): string {
  return JSON.stringify(canonicalizeMatch(match), null, 2);
}

/** Object literal built in `example.json` key order, regardless of input field order. */
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
  // Two literals because key order is `team → player → minute → assist? → type`
  // and `assist` must sit between `minute` and `type` when present (omitted
  // entirely when absent — example.json never emits `null`).
  if (s.assist !== undefined) {
    return { team: s.team, player: s.player, minute: s.minute, assist: s.assist, type: s.type };
  }
  return { team: s.team, player: s.player, minute: s.minute, type: s.type };
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
