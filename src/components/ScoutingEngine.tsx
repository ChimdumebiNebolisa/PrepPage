"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { ScoutResponse, TeamReport } from "@/lib/types";
import { AlertCircle, Loader2, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id?: string;
  name: string;
}

interface TeamsResponse {
  success: boolean;
  code?: string;
  teams: Team[];
}

export default function ScoutingEngine({ onReportGenerated }: { onReportGenerated: (report: TeamReport, source: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const fetchTeams = async (q: string) => {
      try {
        const response = await fetch(`/api/teams?q=${encodeURIComponent(q)}&limit=10`);
        const data: TeamsResponse = await response.json();
        if (data.success) {
          setTeams(data.teams);
        } else {
          // If GRID fails and demo mode is off, show empty list
          if (demoMode) {
            // In demo mode, we can fetch demo teams from a separate endpoint or use local data
            // For now, we'll just show empty and let user know to enable demo mode
            setTeams([]);
          } else {
            setTeams([]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch teams:", err);
        setTeams([]);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchTeams(searchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, demoMode]);

  // Fetch initial teams when popover opens
  const handleInputFocus = useCallback(() => {
    setOpen(true);
    if (teams.length === 0 && searchQuery === "") {
      // Fetch default teams when opening
      fetch(`/api/teams?q=&limit=10`)
        .then((res) => res.json())
        .then((data: TeamsResponse) => {
          if (data.success) {
            setTeams(data.teams);
          } else {
            setTeams([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch teams:", err);
          setTeams([]);
        });
    }
  }, [teams.length, searchQuery]);

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
      setOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
    } else if (e.key === "Escape") {
      setOpen(false);
      setHighlightedIndex(-1);
    }
  }, [open, teams, highlightedIndex]);

  const handleTeamSelect = (team: Team) => {
    setTeamName(team.name);
    setSearchQuery(team.name); // Show selected team in input
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName, game: "lol" }),
      });

      const result: ScoutResponse = await response.json();

      if (result.success && result.data) {
        // Real data from GRID
        onReportGenerated(result.data, result.source || "GRID");
      } else {
        // Explicit failure - only use demo if demo mode is ON
        if (demoMode) {
          try {
            const demoDataResponse = await fetch("/demo-data.json");
            const demoData = await demoDataResponse.json();
            const matchedTeam = demoData.teams[teamName] || demoData.teams["Cloud9"];
            if (matchedTeam) {
              onReportGenerated(matchedTeam, "Demo Mode");
              setError("Live scouting unavailable. Showing demo data (Demo Mode enabled).");
            } else {
              setError("Live scouting failed and no demo data available for this team.");
            }
          } catch (demoErr) {
            setError("Live scouting failed and could not load demo data.");
          }
        } else {
          // Demo mode is OFF - show explicit error
          if (result.code === "MISSING_API_KEY") {
            setError("Live scouting failed: GRID API key not configured. Enable Demo Mode to view demo data.");
          } else if (result.code === "GRID_FETCH_FAILED") {
            setError("Live scouting failed: GRID connection failed. Enable Demo Mode to view demo data.");
          } else if (result.code === "SCOUT_NOT_IMPLEMENTED") {
            setError("Live scouting is not yet implemented. Enable Demo Mode to view demo data.");
          } else {
            setError("Live scouting failed. Enable Demo Mode to view demo data.");
          }
        }
      }
    } catch (err) {
      // Network error or other exception
      if (demoMode) {
        try {
          const demoDataResponse = await fetch("/demo-data.json");
          const demoData = await demoDataResponse.json();
          const matchedTeam = demoData.teams[teamName] || demoData.teams["Cloud9"];
          if (matchedTeam) {
            onReportGenerated(matchedTeam, "Demo Mode");
            setError("Network error. Showing demo data (Demo Mode enabled).");
          } else {
            setError("Network error and no demo data available for this team.");
          }
        } catch (demoErr) {
          setError("Network error and could not load demo data.");
        }
      } else {
        setError("Network error. Enable Demo Mode to view demo data.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-12">
      <CardHeader>
        <CardTitle className="text-2xl">Scouting Engine</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Demo Mode Toggle */}
          <div className="flex items-center gap-2 pb-2 border-b">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-muted-foreground">Demo Mode</span>
            </label>
            {demoMode && (
              <span className="text-xs text-muted-foreground">(Demo data will be used when live scouting fails)</span>
            )}
          </div>

          <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
              <div className="relative flex-1">
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    // Clear team selection when user types something different
                    if (value !== teamName) {
                      setTeamName("");
                    }
                    setOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={handleInputFocus}
                  onKeyDown={handleKeyDown}
                  placeholder="Opponent Team Name (e.g., Cloud9, Sentinels)"
                  className="pl-10 h-12"
                  disabled={loading}
                />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                  sideOffset={4}
                >
                  <Command>
                    <CommandList ref={listRef}>
                      <CommandEmpty>
                        {searchQuery ? "No teams found." : "Type to search teams..."}
                      </CommandEmpty>
                      <CommandGroup>
                        {teams.map((team, index) => (
                          <CommandItem
                            key={team.id || team.name}
                            value={team.name}
                            onSelect={() => handleTeamSelect(team)}
                            className={cn(
                              "cursor-pointer",
                              highlightedIndex === index && "bg-accent"
                            )}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                teamName === team.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {team.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </div>
            </Popover>
            <Button type="submit" size="lg" disabled={loading || !teamName.trim()} className="h-12 px-6">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Report
            </Button>
          </div>


          {loading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground animate-pulse">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing opponent patterns...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
