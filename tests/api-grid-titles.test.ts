/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/grid/titles/route';
import { NextRequest } from 'next/server';

describe('/api/grid/titles', () => {
  const originalEnv = process.env.GRID_API_KEY;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GRID_API_KEY = 'test-api-key';
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    process.env.GRID_API_KEY = originalEnv;
  });

  it('should return titles as array (not edges/totalCount)', async () => {
    const mockTitlesResponse = {
      data: {
        titles: [
          { id: '1', name: 'League of Legends' },
          { id: '2', name: 'Counter-Strike 2' },
        ],
      },
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockTitlesResponse), { status: 200 })
    );

    const request = new NextRequest('http://localhost/api/grid/titles');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.titles).toEqual([
      { id: '1', name: 'League of Legends' },
      { id: '2', name: 'Counter-Strike 2' },
    ]);
    expect(Array.isArray(data.titles)).toBe(true);
    expect(data.titles).toHaveLength(2);
    // Should not have totalCount (titles is not a connection type)
    expect(data.totalCount).toBeUndefined();
  });

  it('should return empty array when no titles found', async () => {
    const mockTitlesResponse = {
      data: {
        titles: [],
      },
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockTitlesResponse), { status: 200 })
    );

    const request = new NextRequest('http://localhost/api/grid/titles');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.titles).toEqual([]);
    expect(Array.isArray(data.titles)).toBe(true);
  });

  it('should return error when API key is missing', async () => {
    delete process.env.GRID_API_KEY;

    const request = new NextRequest('http://localhost/api/grid/titles');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.code).toBe('MISSING_API_KEY');
    expect(response.status).toBe(503);
  });

  it('should return error when GraphQL returns errors', async () => {
    const mockErrorResponse = {
      errors: [{ message: 'GraphQL error' }],
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockErrorResponse), { status: 200 })
    );

    const request = new NextRequest('http://localhost/api/grid/titles');
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.code).toBe('GRID_FETCH_FAILED');
    expect(response.status).toBe(502);
  });

  it('should send correct GraphQL query (array format, not edges)', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { titles: [] } }), { status: 200 })
    );

    const request = new NextRequest('http://localhost/api/grid/titles');
    await GET(request);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api-op.grid.gg/central-data/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-api-key': 'test-api-key',
        }),
        body: expect.stringContaining('titles'),
      })
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.query).toContain('titles {');
    expect(callBody.query).toContain('id');
    expect(callBody.query).toContain('name');
    // Should NOT contain edges/node structure
    expect(callBody.query).not.toContain('edges');
    expect(callBody.query).not.toContain('node');
    expect(callBody.query).not.toContain('totalCount');
  });
});

