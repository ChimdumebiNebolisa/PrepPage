/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/teams/route';
import { NextRequest } from 'next/server';

describe('/api/teams', () => {
  const originalEnv = process.env.GRID_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env.GRID_API_KEY = originalEnv;
  });

  it('returns empty array with source GRID when q is empty', async () => {
    process.env.GRID_API_KEY = 'test-key';
    const req = new NextRequest('http://localhost:3000/api/teams?q=&limit=10');
    const res = await GET(req);
    const data = await res.json();
    expect(data).toEqual({ success: true, source: 'GRID', teams: [] });
  });

  it('returns 503 with MISSING_API_KEY when API key is missing', async () => {
    delete process.env.GRID_API_KEY;
    const req = new NextRequest('http://localhost:3000/api/teams?q=faze');
    const res = await GET(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.code).toBe('MISSING_API_KEY');
  });

  it('returns teams with id+name and source GRID when q is non-empty', async () => {
    process.env.GRID_API_KEY = 'test-key';
    const mockResponseData = {
      data: {
        teams: {
          edges: [
            { node: { id: '1', name: 'Team1' } },
            { node: { id: '2', name: 'Team2' } },
          ],
        },
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockResponseData), { status: 200 })
    ));

    const req = new NextRequest('http://localhost:3000/api/teams?q=faze&limit=10');
    const res = await GET(req);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.source).toBe('GRID');
    expect(data.teams).toHaveLength(2);
    expect(data.teams[0]).toHaveProperty('id');
    expect(data.teams[0]).toHaveProperty('name');
    expect(data.source).not.toBe('Demo');
  });
});

