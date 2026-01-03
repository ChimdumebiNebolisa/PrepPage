/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/grid/introspect/route';
import { clearIntrospectionCache } from '@/lib/grid-introspection';

describe('/api/grid/introspect', () => {
  const originalEnv = process.env.GRID_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearIntrospectionCache(); // Clear cache before each test
  });

  afterEach(() => {
    process.env.GRID_API_KEY = originalEnv;
    clearIntrospectionCache(); // Clear cache after each test
  });

  it('returns 503 with MISSING_API_KEY when API key is missing', async () => {
    delete process.env.GRID_API_KEY;
    const res = await GET();
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  it('returns introspection data for Series, SeriesFilter, and SeriesOrderBy', async () => {
    process.env.GRID_API_KEY = 'test-key';

    // Mock three separate fetch calls (one per type)
    const mockSeriesResponse = {
      data: {
        __type: {
          name: 'Series',
          fields: [
            {
              name: 'id',
              type: { kind: 'NON_NULL', name: null, ofType: { kind: 'SCALAR', name: 'ID' } },
            },
            {
              name: 'startDate',
              type: { kind: 'SCALAR', name: 'Date' },
            },
            {
              name: 'endDate',
              type: { kind: 'SCALAR', name: 'Date' },
            },
          ],
        },
      },
    };

    const mockSeriesFilterResponse = {
      data: {
        __type: {
          name: 'SeriesFilter',
          inputFields: [
            {
              name: 'teams',
              type: { kind: 'INPUT_OBJECT', name: 'TeamFilter' },
            },
            {
              name: 'game',
              type: { kind: 'SCALAR', name: 'String' },
            },
            {
              name: 'startDate',
              type: { kind: 'INPUT_OBJECT', name: 'DateFilter' },
            },
          ],
        },
      },
    };

    const mockSeriesOrderByResponse = {
      data: {
        __type: {
          name: 'SeriesOrderBy',
          enumValues: [
            { name: 'START_DATE' },
            { name: 'END_DATE' },
            { name: 'ID' },
          ],
        },
      },
    };

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      let responseData;
      if (callCount === 1) {
        responseData = mockSeriesResponse;
      } else if (callCount === 2) {
        responseData = mockSeriesFilterResponse;
      } else {
        responseData = mockSeriesOrderByResponse;
      }
      return Promise.resolve(
        new Response(JSON.stringify(responseData), { status: 200 })
      );
    }));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.seriesType).toBeDefined();
    expect(data.seriesType.name).toBe('Series');
    expect(data.seriesType.fields).toHaveLength(3);
    expect(data.seriesFilter).toBeDefined();
    expect(data.seriesFilter.name).toBe('SeriesFilter');
    expect(data.seriesFilter.inputFields).toHaveLength(3);
    expect(data.seriesOrderBy).toBeDefined();
    expect(data.seriesOrderBy.name).toBe('SeriesOrderBy');
    expect(data.seriesOrderBy.enumValues).toHaveLength(3);
    expect(data.seriesOrderBy.enumValues).toContain('START_DATE');

    // Verify three separate fetch calls were made
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  });

  it('returns error when one introspection call fails', async () => {
    process.env.GRID_API_KEY = 'test-key';

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        // Fail the SeriesFilter call with GraphQL error
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: null,
              errors: [{ message: 'Type SeriesFilter not found' }],
            }),
            { status: 200 }
          )
        );
      }
      // Success for Series and SeriesOrderBy
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              __type: {
                name: callCount === 1 ? 'Series' : 'SeriesOrderBy',
                fields: callCount === 1 ? [{ name: 'id', type: { kind: 'SCALAR', name: 'ID' } }] : undefined,
                enumValues: callCount === 3 ? [{ name: 'START_DATE' }] : undefined,
              },
            },
          }),
          { status: 200 }
        )
      );
    }));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.success).toBe(false);
    expect(data.code).toBe('INTROSPECTION_FAILED');
    expect(data.details).toBeDefined();
    expect(data.details.which).toBe('SeriesFilter');
  });

  it('caches introspection results', async () => {
    process.env.GRID_API_KEY = 'test-key';

    const mockSeriesResponse = {
      data: {
        __type: {
          name: 'Series',
          fields: [{ name: 'id', type: { kind: 'SCALAR', name: 'ID' } }],
        },
      },
    };

    const mockSeriesFilterResponse = {
      data: {
        __type: {
          name: 'SeriesFilter',
          inputFields: [{ name: 'teams', type: { kind: 'INPUT_OBJECT', name: 'TeamFilter' } }],
        },
      },
    };

    const mockSeriesOrderByResponse = {
      data: {
        __type: {
          name: 'SeriesOrderBy',
          enumValues: [{ name: 'START_DATE' }],
        },
      },
    };

    let callCount = 0;
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount++;
      let responseData;
      if (callCount === 1) {
        responseData = mockSeriesResponse;
      } else if (callCount === 2) {
        responseData = mockSeriesFilterResponse;
      } else {
        responseData = mockSeriesOrderByResponse;
      }
      return Promise.resolve(
        new Response(JSON.stringify(responseData), { status: 200 })
      );
    }));

    // First call - should make 3 fetch calls
    const res1 = await GET();
    expect(res1.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);

    // Reset call count
    callCount = 0;
    vi.mocked(fetch).mockClear();

    // Second call - should use cache, so no new fetch calls
    const res2 = await GET();
    expect(res2.status).toBe(200);
    // Cache should prevent new fetch calls
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(0);
  });
});

