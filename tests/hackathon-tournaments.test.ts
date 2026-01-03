/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import {
  HACKATHON_TOURNAMENT_IDS_LOL,
  HACKATHON_TOURNAMENT_IDS_VAL,
  HACKATHON_TOURNAMENT_IDS_ALL,
  getDefaultTournamentIds,
} from '@/lib/hackathon-tournaments';

describe('hackathon-tournaments', () => {
  it('exports non-empty LoL tournament IDs array', () => {
    expect(Array.isArray(HACKATHON_TOURNAMENT_IDS_LOL)).toBe(true);
    expect(HACKATHON_TOURNAMENT_IDS_LOL.length).toBeGreaterThan(0);
  });

  it('exports non-empty VAL tournament IDs array', () => {
    expect(Array.isArray(HACKATHON_TOURNAMENT_IDS_VAL)).toBe(true);
    expect(HACKATHON_TOURNAMENT_IDS_VAL.length).toBeGreaterThan(0);
  });

  it('exports ALL as concatenation of LoL and VAL', () => {
    expect(Array.isArray(HACKATHON_TOURNAMENT_IDS_ALL)).toBe(true);
    expect(HACKATHON_TOURNAMENT_IDS_ALL.length).toBe(
      HACKATHON_TOURNAMENT_IDS_LOL.length + HACKATHON_TOURNAMENT_IDS_VAL.length
    );
    expect(HACKATHON_TOURNAMENT_IDS_ALL).toEqual([
      ...HACKATHON_TOURNAMENT_IDS_LOL,
      ...HACKATHON_TOURNAMENT_IDS_VAL,
    ]);
  });

  it('getDefaultTournamentIds returns ALL tournament IDs', () => {
    const defaultIds = getDefaultTournamentIds();
    expect(Array.isArray(defaultIds)).toBe(true);
    expect(defaultIds).toEqual(HACKATHON_TOURNAMENT_IDS_ALL);
    expect(defaultIds.length).toBeGreaterThan(0);
  });

  it('all tournament IDs are strings', () => {
    const allIds = [
      ...HACKATHON_TOURNAMENT_IDS_LOL,
      ...HACKATHON_TOURNAMENT_IDS_VAL,
    ];
    allIds.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});

