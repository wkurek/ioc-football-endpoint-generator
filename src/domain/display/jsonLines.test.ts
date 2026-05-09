import { describe, expect, it } from 'vitest';
import { buildJsonLines } from './jsonLines';
import type { Match } from '@/domain/types';

const sample: Match = {
  competition: { name: 'Olympic Games', season: 'Paris 2024', round: "Men's Group A — Match 1" },
  venue: { name: 'V', city: 'C' },
  kickoff: '2024-07-24T15:00:00+02:00',
  status: 'FT',
  teams: { home: 'A', away: 'B' },
  score: { home: 1, away: 2, halfTime: { home: 0, away: 1 } },
  scorers: [{ team: 'A', player: 'P', minute: 18, type: 'open_play' }],
  lineups: {
    home: { team: 'A', formation: '4-4-2', coach: 'C1', startingXI: [], bench: [] },
    away: { team: 'B', formation: '4-2-3-1', coach: 'C2', startingXI: [], bench: [] },
  },
};

describe('buildJsonLines', () => {
  it('reconstructs the JSON.stringify output line-for-line', () => {
    const lines = buildJsonLines(sample);
    const reconstructed = lines.map((l) => l.text).join('\n');
    expect(reconstructed).toBe(JSON.stringify(sample, null, 2));
  });

  it('tags competition.name as const', () => {
    const lines = buildJsonLines(sample);
    const nameLine = lines.find((l) => l.text.includes('"name": "Olympic Games"'));
    expect(nameLine?.source).toBe('const');
  });

  it('tags competition.season as const', () => {
    const lines = buildJsonLines(sample);
    const seasonLine = lines.find((l) => l.text.includes('"season": "Paris 2024"'));
    expect(seasonLine?.source).toBe('const');
  });

  it('tags competition.round as sch', () => {
    const lines = buildJsonLines(sample);
    const roundLine = lines.find((l) => l.text.includes('"round"'));
    expect(roundLine?.source).toBe('sch');
  });

  it('tags venue.* as sch', () => {
    const lines = buildJsonLines(sample);
    const venueName = lines.find((l) => l.text.includes('"name": "V"'));
    const venueCity = lines.find((l) => l.text.includes('"city": "C"'));
    expect(venueName?.source).toBe('sch');
    expect(venueCity?.source).toBe('sch');
  });

  it('tags kickoff as sch', () => {
    const lines = buildJsonLines(sample);
    const kick = lines.find((l) => l.text.startsWith('  "kickoff"'));
    expect(kick?.source).toBe('sch');
  });

  it('tags status as const (mapping)', () => {
    const lines = buildJsonLines(sample);
    const st = lines.find((l) => l.text.startsWith('  "status"'));
    expect(st?.source).toBe('const');
  });

  it('tags teams.* as res', () => {
    const lines = buildJsonLines(sample);
    const home = lines.find((l) => l.text.includes('"home": "A"'));
    expect(home?.source).toBe('res');
  });

  it('tags score.* and score.halfTime.* as res', () => {
    const lines = buildJsonLines(sample);
    const scoreHome = lines.find((l) => l.text.match(/^    "home": 1,$/));
    const halfHome = lines.find((l) => l.text.match(/^      "home": 0,$/));
    expect(scoreHome?.source).toBe('res');
    expect(halfHome?.source).toBe('res');
  });

  it('tags structural lines (braces) as neutral', () => {
    const lines = buildJsonLines(sample);
    expect(lines[0]?.text).toBe('{');
    expect(lines[0]?.source).toBe('neutral');
    expect(lines[lines.length - 1]?.text).toBe('}');
    expect(lines[lines.length - 1]?.source).toBe('neutral');
  });
});
