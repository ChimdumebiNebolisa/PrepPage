/** @vitest-environment node */
import { describe, it, expect } from 'vitest';
import { filterSeriesByTeam } from '@/app/api/scout/route';

describe('filterSeriesByTeam', () => {
  it('filters series to only include those with the specified teamId', () => {
    const teamId = '123';
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
            { baseInfo: { id: '456', name: 'Team B' } },
          ],
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '456', name: 'Team B' } },
            { baseInfo: { id: '789', name: 'Team C' } },
          ],
        },
      },
      {
        node: {
          id: 'series3',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
          ],
        },
      },
    ];

    const result = filterSeriesByTeam(seriesEdges, teamId);

    expect(result).toHaveLength(2);
    expect(result[0].node.id).toBe('series1');
    expect(result[1].node.id).toBe('series3');
  });

  it('handles teamId as string or number', () => {
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          teams: [
            { baseInfo: { id: 123, name: 'Team A' } },
          ],
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
          ],
        },
      },
    ];

    const result1 = filterSeriesByTeam(seriesEdges, '123');
    expect(result1).toHaveLength(2);

    const result2 = filterSeriesByTeam(seriesEdges, 123);
    expect(result2).toHaveLength(2);
  });

  it('handles teams without baseInfo structure (fallback to direct id)', () => {
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          teams: [
            { id: '123', name: 'Team A' },
          ],
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
          ],
        },
      },
    ];

    const result = filterSeriesByTeam(seriesEdges, '123');
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no series match the teamId', () => {
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          teams: [
            { baseInfo: { id: '456', name: 'Team B' } },
          ],
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '789', name: 'Team C' } },
          ],
        },
      },
    ];

    const result = filterSeriesByTeam(seriesEdges, '123');
    expect(result).toHaveLength(0);
  });

  it('handles series with empty teams array', () => {
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          teams: [],
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
          ],
        },
      },
    ];

    const result = filterSeriesByTeam(seriesEdges, '123');
    expect(result).toHaveLength(1);
    expect(result[0].node.id).toBe('series2');
  });

  it('handles series with missing teams field', () => {
    const seriesEdges = [
      {
        node: {
          id: 'series1',
          // teams field missing
        },
      },
      {
        node: {
          id: 'series2',
          teams: [
            { baseInfo: { id: '123', name: 'Team A' } },
          ],
        },
      },
    ];

    const result = filterSeriesByTeam(seriesEdges, '123');
    expect(result).toHaveLength(1);
    expect(result[0].node.id).toBe('series2');
  });
});

