import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScoutingEngine from '@/components/ScoutingEngine';

describe('ScoutingEngine', () => {
  const mockOnReportGenerated = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps dropdown open on focus and shows start typing message', async () => {
    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.click(input);
    expect(screen.getByText(/start typing to search teams/i)).toBeInTheDocument();
  });

  it('triggers /api/teams call when typing', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<ScoutingEngine onReportGenerated={mockOnReportGenerated} />);
    const input = screen.getByPlaceholderText(/start typing/i);
    await userEvent.type(input, 'fa');

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/teams?q=fa'));
    });
  });

  it('selects team and closes popover on click', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true, source: 'GRID', teams: [{ id: '1', name: 'Team1' }] }),
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
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, source: 'GRID', data: {} }),
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
        body: JSON.stringify({ teamId: '80', game: 'lol' }),
      }));
    });
  });
});

