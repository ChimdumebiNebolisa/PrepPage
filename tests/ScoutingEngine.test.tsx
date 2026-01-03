import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoutingEngine from '@/components/ScoutingEngine';

describe('ScoutingEngine', () => {
  const mockOnReportGenerated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock titles endpoint - called on mount
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, titles: [] }),
      ok: true,
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  it('shows start typing message when dropdown is open and query is empty', async () => {
    // Mock fetch to handle titles call immediately
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({ success: true, teams: [] }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    
    // Wait for titles fetch to complete - titles call happens immediately on mount
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/grid/titles'));
    }, { timeout: 2000 });

    // Wait a bit for state updates to settle
    await new Promise(resolve => setTimeout(resolve, 100));

    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.click(input);
    
    await waitFor(() => {
      expect(screen.getByText(/start typing to search teams/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('triggers /api/teams call when typing', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      // Handle titles fetch on mount
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      // Handle teams search
      return Promise.resolve({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/teams?q=fa'));
    });
  });

  it('shows LIVE SEARCH indicator when /api/teams returns success:true', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText('LIVE SEARCH')).toBeInTheDocument();
      expect(screen.getByText('Team1')).toBeInTheDocument();
    });
  });

  it('shows MISSING_API_KEY notice when API key is missing', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          json: async () => ({ success: false, code: 'MISSING_API_KEY', teams: [] }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({}),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText(/Live search disabled.*missing GRID_API_KEY/i)).toBeInTheDocument();
    });
  });

  it('does not call API when query is empty', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      // Allow titles fetch on mount (expected)
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      // Should not be called for teams when query is empty
      return Promise.resolve({
        json: async () => ({ success: true, teams: [] }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.click(input);

    // Wait a bit to ensure no teams API call
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should only have titles call, no teams call
    const calls = mockFetch.mock.calls.map(([url]) => url);
    const teamsCalls = calls.filter((url: string) => url?.includes('/api/teams'));
    expect(teamsCalls.length).toBe(0);
  });

  it('selects team and closes dropdown on click', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText('Team1')).toBeInTheDocument();
    });

    const teamItem = screen.getByText('Team1');
    await userEvent.click(teamItem);

    await waitFor(() => {
      expect(input).toHaveValue('Team1');
    });
  });

  it('sends POST /api/scout with teamId on Generate Report', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
          ok: true,
        });
      }
      if (url.includes('/api/scout') && options?.method === 'POST') {
        return Promise.resolve({
          json: async () => ({ success: true, source: 'GRID', data: { teamName: 'Team1', region: 'NA', lastUpdated: '2026-01-01', sampleSize: 10, dateRange: 'Last 30 days', tendencies: [], players: [], compositions: [], evidence: [] } }),
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({}),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText('Team1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Team1'));
    await userEvent.click(screen.getByText(/generate report/i));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/scout', expect.objectContaining({
        method: 'POST',
      }));
      expect(mockOnReportGenerated).toHaveBeenCalled();
      const callArgs = mockOnReportGenerated.mock.calls[0];
      expect(callArgs[0]).toMatchObject({ teamName: 'Team1' });
      expect(callArgs[1]).toBe('GRID');
      // debug is optional third parameter
    });
  });

  it('uses /api/scout first and only falls back to demo if it fails', async () => {
    const mockDemoData = {
      teams: {
        Cloud9: {
          teamName: 'Cloud9',
          region: 'NA',
          lastUpdated: '2026-01-01',
          sampleSize: 15,
          dateRange: 'Last 30 days',
          tendencies: [],
          players: [],
          compositions: [],
          evidence: [],
        },
      },
    };

    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
          ok: true,
        });
      }
      if (url.includes('/api/scout') && options?.method === 'POST') {
        return Promise.resolve({
          json: async () => ({ success: false, code: 'GRID_FETCH_FAILED' }),
          ok: false,
        });
      }
      if (url.includes('/demo-data.json')) {
        return Promise.resolve({
          json: async () => mockDemoData,
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({}),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText('Team1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Team1'));
    await userEvent.click(screen.getByText(/generate report/i));

    await waitFor(() => {
      // Verify /api/scout was called first
      expect(mockFetch).toHaveBeenCalledWith('/api/scout', expect.objectContaining({
        method: 'POST',
      }));
      // Verify demo fallback was used
      expect(mockOnReportGenerated).toHaveBeenCalledWith(
        expect.objectContaining({ teamName: 'Cloud9' }),
        'Demo Mode'
      );
    });
  });

  it('triggers demo fallback when /api/scout fails', async () => {
    const mockDemoData = {
      teams: {
        Cloud9: {
          teamName: 'Cloud9',
          region: 'NA',
          lastUpdated: '2026-01-01',
          sampleSize: 15,
          dateRange: 'Last 30 days',
          tendencies: [],
          players: [],
          compositions: [],
          evidence: [],
        },
      },
    };

    const mockFetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/grid/titles')) {
        return Promise.resolve({
          json: async () => ({ success: true, titles: [] }),
          ok: true,
        });
      }
      if (url.includes('/api/teams')) {
        return Promise.resolve({
          json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
          ok: true,
        });
      }
      if (url.includes('/api/scout') && options?.method === 'POST') {
        return Promise.resolve({
          json: async () => ({ success: false, code: 'GRID_FETCH_FAILED' }),
          ok: false,
        });
      }
      if (url.includes('/demo-data.json')) {
        return Promise.resolve({
          json: async () => mockDemoData,
          ok: true,
        });
      }
      return Promise.resolve({
        json: async () => ({}),
        ok: true,
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(screen.getByText('Team1')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Team1'));
    await userEvent.click(screen.getByText(/generate report/i));

    await waitFor(() => {
      expect(mockOnReportGenerated).toHaveBeenCalledWith(
        expect.objectContaining({ teamName: 'Cloud9' }),
        'Demo Mode'
      );
    });
  });
});
