import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoutingEngine from '@/components/ScoutingEngine';

describe('ScoutingEngine', () => {
  const mockOnReportGenerated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows start typing message when dropdown is open and query is empty', async () => {
    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.click(input);
    expect(screen.getByText(/start typing to search teams/i)).toBeInTheDocument();
  });

  it('triggers /api/teams call when typing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
      ok: true,
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
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
      ok: true,
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
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: false, code: 'MISSING_API_KEY', teams: [] }),
      ok: true,
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
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.click(input);

    // Wait a bit to ensure no API call
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('selects team and closes dropdown on click', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
      ok: true,
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
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, source: 'GRID', data: { teamName: 'Team1', region: 'NA', lastUpdated: '2026-01-01', sampleSize: 10, dateRange: 'Last 30 days', tendencies: [], players: [], compositions: [], evidence: [] } }),
        ok: true,
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
      expect(mockOnReportGenerated).toHaveBeenCalledWith(
        expect.objectContaining({ teamName: 'Team1' }),
        'GRID'
      );
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

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: false, code: 'GRID_FETCH_FAILED' }),
        ok: false,
      })
      .mockResolvedValueOnce({
        json: async () => mockDemoData,
        ok: true,
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

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        json: async () => ({ success: true, source: 'GRID', teams: [{ id: '80', name: 'Team1' }] }),
        ok: true,
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: false, code: 'GRID_FETCH_FAILED' }),
        ok: false,
      })
      .mockResolvedValueOnce({
        json: async () => mockDemoData,
        ok: true,
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
