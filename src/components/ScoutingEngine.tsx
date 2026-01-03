"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ScoutResponse, TeamReport } from "@/lib/types";

interface Team {
  id?: string;
  name: string;
}

interface TeamsResponse {
  success: boolean;
  source?: "GRID" | string;
  code?: string;
  teams: Team[];
}

interface DemoData {
  teams: {
    [key: string]: TeamReport;
  };
}

export default function ScoutingEngine({ onReportGenerated }: { onReportGenerated: (report: TeamReport, source: string, debug?: ScoutResponse["debug"]) => void }) {
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchMode, setSearchMode] = useState<"LIVE" | "DEMO" | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [useDemoTeams, setUseDemoTeams] = useState(false);
  const [selectedTitleId, setSelectedTitleId] = useState<string | null>(null);
  const [selectedTournamentIds, setSelectedTournamentIds] = useState<string[]>([]);
  const [titles, setTitles] = useState<Array<{ id: string; name: string }>>([]);
  const [tournaments, setTournaments] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [loadingTournaments, setLoadingTournaments] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load titles on mount
  useEffect(() => {
    const fetchTitles = async () => {
      setLoadingTitles(true);
      try {
        const response = await fetch("/api/grid/titles");
        const data = await response.json();
        if (data.success && data.titles) {
          setTitles(data.titles);
        }
      } catch (err) {
        console.error("Failed to fetch titles:", err);
      } finally {
        setLoadingTitles(false);
      }
    };
    fetchTitles();
  }, []);

  // Load tournaments when title is selected
  useEffect(() => {
    if (!selectedTitleId) {
      setTournaments([]);
      setSelectedTournamentIds([]);
      return;
    }

    const fetchTournaments = async () => {
      setLoadingTournaments(true);
      try {
        const response = await fetch(`/api/grid/tournaments?titleId=${selectedTitleId}`);
        const data = await response.json();
        if (data.success && data.tournaments) {
          setTournaments(data.tournaments);
          // Auto-select all tournaments by default
          setSelectedTournamentIds(data.tournaments.map((t: any) => t.id));
        }
      } catch (err) {
        console.error("Failed to fetch tournaments:", err);
      } finally {
        setLoadingTournaments(false);
      }
    };
    fetchTournaments();
  }, [selectedTitleId]);

  // Debounced search - only call API if query is not empty
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTeams([]);
      setSearchMode(null);
      setSearchError(null);
      return;
    }

    const fetchTeams = async (q: string) => {
      try {
        const response = await fetch(`/api/teams?q=${encodeURIComponent(q)}&limit=10`);
        const data: TeamsResponse = await response.json();
        if (data.success) {
          setTeams(data.teams);
          setSearchMode("LIVE");
          setSearchError(null);
        } else {
          if (data.code === "MISSING_API_KEY") {
            setSearchMode(null);
            setSearchError("MISSING_API_KEY");
            setTeams([]);
          } else if (data.code === "GRID_FETCH_FAILED") {
            setSearchMode(null);
            setSearchError("GRID_FETCH_FAILED");
            setTeams([]);
          } else {
            setSearchMode(null);
            setSearchError(null);
            setTeams([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setTeams([]);
        setSearchMode(null);
        setSearchError("GRID_FETCH_FAILED");
      }
    };

    const timeoutId = setTimeout(() => {
      fetchTeams(searchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open dropdown on focus
  const handleInputFocus = useCallback(() => {
    setOpen(true);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < teams.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && highlightedIndex >= 0 && teams[highlightedIndex]) {
      e.preventDefault();
      const selectedTeam = teams[highlightedIndex];
      setTeamName(selectedTeam.name);
      setTeamId(selectedTeam.id || null);
      setOpen(false);
      setSearchQuery(selectedTeam.name);
      setHighlightedIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }, [open, teams, highlightedIndex]);

  const handleTeamSelect = (team: Team) => {
    setTeamName(team.name);
    setTeamId(team.id || null);
    setSearchQuery(team.name);
    setOpen(false);
    setHighlightedIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Handle demo team selection
  const handleDemoTeamSelect = (teamName: string) => {
    setTeamName(teamName);
    setTeamId(null); // Demo teams don't have IDs
    setUseDemoTeams(true);
    setSearchQuery(teamName);
    setOpen(false);
    setHighlightedIndex(-1);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Demo fallback function
  const loadDemoData = async (preferredTeamName?: string): Promise<TeamReport | null> => {
    try {
      const response = await fetch("/demo-data.json");
      if (!response.ok) {
        return null;
      }
      const demoData: DemoData = await response.json();
      // Try to match by team name first
      if (preferredTeamName && demoData.teams[preferredTeamName]) {
        return demoData.teams[preferredTeamName];
      }
      // Use first team as fallback
      const teamKeys = Object.keys(demoData.teams);
      if (teamKeys.length > 0) {
        const firstTeam = demoData.teams[teamKeys[0]];
        return firstTeam;
      }
      return null;
    } catch (err) {
      console.error("Failed to load demo data:", err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setError("Please select a team from the dropdown.");
      return;
    }
    // Allow demo teams (no teamId) to proceed
    if (!teamId && !useDemoTeams) {
      setError("Please select a team from the dropdown.");
      return;
    }

    setLoading(true);
    setError(null);

    // If using demo team, skip API call and go straight to demo
    if (useDemoTeams && !teamId) {
      const demoReport = await loadDemoData(teamName);
      if (demoReport) {
        onReportGenerated(demoReport, "Demo Mode");
        setLoading(false);
        return;
      }
      setError("Failed to load demo data.");
      setLoading(false);
      return;
    }

    // Create timeout controller for 30 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const requestBody: any = {
        teamId,
        game: "lol",
        windowDir: "next", // Default to "next" for scouting
        hours: 336, // 14 days default
        debug: true,
      };

      if (selectedTitleId) {
        requestBody.titleId = selectedTitleId;
      }

      if (selectedTournamentIds.length > 0) {
        requestBody.tournamentIds = selectedTournamentIds;
      }

      const response = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is not ok (non-2xx)
      if (!response.ok) {
        // Try demo fallback
        const demoReport = await loadDemoData(teamName);
        if (demoReport) {
          onReportGenerated(demoReport, "Demo Mode");
          setLoading(false);
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const result: ScoutResponse = await response.json();

      // Handle special codes with honest empty states
      if (result.success && result.code === "NO_SERIES_FOUND") {
        setError("No series found for the selected title/tournaments/window. Try widening the time window or selecting different tournaments.");
        setLoading(false);
        return;
      }

      if (result.success && result.code === "NO_IN_GAME_DATA") {
        setError("Series found, but no in-game files/state available. This may be due to access restrictions or the series not having data yet.");
        setLoading(false);
        return;
      }

      if (result.success && result.data) {
        onReportGenerated(result.data, result.source || "GRID", result.debug);
        setLoading(false);
        return;
      }

      // API returned success:false - trigger demo fallback
      const demoReport = await loadDemoData(teamName);
      if (demoReport) {
        onReportGenerated(demoReport, "Demo Mode");
        setLoading(false);
        return;
      }

      setError("Failed to generate report. Demo data unavailable.");
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      // Check if it's an abort (timeout) or network error - try demo fallback
      const error = err as { name?: string; message?: string };
      if (error.name === "AbortError" || error.message?.includes("Failed to fetch")) {
        const demoReport = await loadDemoData(teamName);
        if (demoReport) {
          onReportGenerated(demoReport, "Demo Mode");
          setLoading(false);
          return;
        }
      }

      setError("Failed to generate report. Demo data unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Scouting Engine</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    if (value !== teamName) {
                      setTeamName("");
                      setTeamId(null);
                    }
                    setOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing to search teams..."
                  className="w-full h-12 pl-4 pr-4 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
                  disabled={loading}
                />
              </div>
              {open && (
                <div
                  ref={dropdownRef}
                  className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {searchQuery.trim() === "" ? (
                    <div className="p-3 text-sm text-muted-foreground">Start typing to search teams...</div>
                  ) : searchError === "MISSING_API_KEY" ? (
                    <div className="p-3 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Live search disabled (missing GRID_API_KEY). You can still generate a demo report.
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useDemoTeams}
                          onChange={(e) => setUseDemoTeams(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <span>Use Demo Teams</span>
                      </label>
                      {useDemoTeams && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-2">DEMO SEARCH</div>
                          <div
                            className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                            onClick={() => handleDemoTeamSelect("Cloud9")}
                          >
                            Cloud9
                          </div>
                          <div
                            className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                            onClick={() => handleDemoTeamSelect("Sentinels")}
                          >
                            Sentinels
                          </div>
                        </div>
                      )}
                    </div>
                  ) : searchError === "GRID_FETCH_FAILED" ? (
                    <div className="p-3 space-y-2">
                      <div className="text-sm text-destructive">Live search error. Try again.</div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useDemoTeams}
                          onChange={(e) => setUseDemoTeams(e.target.checked)}
                          className="cursor-pointer"
                        />
                        <span>Use Demo Teams</span>
                      </label>
                      {useDemoTeams && (
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-2">DEMO SEARCH</div>
                          <div
                            className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                            onClick={() => handleDemoTeamSelect("Cloud9")}
                          >
                            Cloud9
                          </div>
                          <div
                            className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                            onClick={() => handleDemoTeamSelect("Sentinels")}
                          >
                            Sentinels
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (!teams || teams.length === 0) ? (
                    <div className="p-3 text-sm text-muted-foreground">No teams found.</div>
                  ) : (
                    <div>
                      {searchMode === "LIVE" && (
                        <div className="px-3 py-1 text-xs text-muted-foreground border-b border-border bg-muted/30">
                          LIVE SEARCH
                        </div>
                      )}
                      {teams.map((team, index) => (
                        <div
                          key={team.id || team.name}
                          onClick={() => handleTeamSelect(team)}
                          onMouseDown={(e) => e.preventDefault()}
                          className={`p-3 cursor-pointer hover:bg-accent ${
                            highlightedIndex === index ? "bg-accent" : ""
                          } ${teamName === team.name ? "font-medium" : ""}`}
                        >
                          {team.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || !teamName.trim() || (!teamId && !useDemoTeams)}
              className="h-12 px-6 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Analyzing opponent patterns...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
