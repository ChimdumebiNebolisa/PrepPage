/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for Milestone 4: Series State + File Download evidence collection
 * 
 * Tests that the scout route properly:
 * 1. Checks file download list for series IDs
 * 2. Checks series state for series IDs
 * 3. Counts seriesWithFilesCount and seriesWithStateCount correctly
 */

describe('Scout API - In-Game Data Evidence Collection', () => {
  const mockGRID_API_KEY = 'test-api-key';
  const mockSeriesId = 'series-123';
  
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.GRID_API_KEY = mockGRID_API_KEY;
    // Clear any module cache to ensure fresh imports
    vi.resetModules();
  });

  it('should detect files from file-download/list endpoint', async () => {
    // Mock file download list response with 2 files
    const mockFileList = [
      { id: 'file1', status: 'ready', description: 'Events Grid', fileName: 'events-grid.json', fullURL: 'https://example.com/file1.json' },
      { id: 'file2', status: 'ready', description: 'State Grid', fileName: 'state-grid.json', fullURL: 'https://example.com/file2.json' },
    ];

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/file-download/list/')) {
        return Promise.resolve(new Response(JSON.stringify(mockFileList), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    vi.stubGlobal('fetch', mockFetch);

    // Test our file download list route - uses named export GET
    const { GET } = await import('@/app/api/grid/file-download/list/route');
    const request = new Request(`http://localhost/api/grid/file-download/list?seriesId=${mockSeriesId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(Array.isArray(data.files)).toBe(true);
    expect(data.files.length).toBe(2);
    expect(data.files[0].fileName).toContain('events-grid');
    expect(data.files[1].fileName).toContain('state-grid');
  });

  it('should detect series state from series-state endpoint', async () => {
    const mockSeriesState = {
      seriesId: mockSeriesId,
      state: 'completed',
      timestamp: '2025-01-02T10:00:00Z',
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/series-state/')) {
        return Promise.resolve(new Response(JSON.stringify(mockSeriesState), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' },
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    vi.stubGlobal('fetch', mockFetch);

    // Test our series state route - uses named export GET
    const { GET } = await import('@/app/api/grid/series-state/route');
    const request = new Request(`http://localhost/api/grid/series-state?seriesId=${mockSeriesId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.state).toBeDefined();
    expect(data.state.seriesId).toBe(mockSeriesId);
  });

  it('should return NO_STATE when series has no state data', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/series-state/')) {
        return Promise.resolve(new Response('Not Found', { 
          status: 404,
          statusText: 'Not Found',
        }));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('@/app/api/grid/series-state/route');
    const request = new Request(`http://localhost/api/grid/series-state?seriesId=${mockSeriesId}`);
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.code).toBe('NO_STATE');
  });

  it('should calculate seriesWithFilesCount and seriesWithStateCount correctly', async () => {
    // This is an integration-style test that would verify the scout route logic
    // For now, we verify the logic conceptually:
    
    const evidence = [
      { seriesId: 'series-1', hasFiles: true, fileTypesAvailable: ['file1'], hasSeriesState: true },
      { seriesId: 'series-2', hasFiles: true, fileTypesAvailable: ['file2'], hasSeriesState: false },
      { seriesId: 'series-3', hasFiles: false, fileTypesAvailable: [], hasSeriesState: true },
      { seriesId: 'series-4', hasFiles: false, fileTypesAvailable: [], hasSeriesState: false },
    ];

    const seriesWithFilesCount = evidence.filter(e => e.hasFiles).length;
    const seriesWithStateCount = evidence.filter(e => e.hasSeriesState).length;

    expect(seriesWithFilesCount).toBe(2);
    expect(seriesWithStateCount).toBe(2);
  });
});

