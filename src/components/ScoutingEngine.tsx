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
  source?: "GRID" | string;
  code?: string;
  teams: Team[];
}

export default function ScoutingEngine({ onReportGenerated }: { onReportGenerated: (report: TeamReport, source: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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
          setTeams([]);
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
  }, [searchQuery]);

  // Open popover on focus (no API call - just show "Start typing..." message)
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
    setSearchQuery(team.name); // Show selected team in input
    setOpen(false);
    setHighlightedIndex(-1);
    // Focus back to input after selection
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !teamId) {
      setError("Please select a team from the dropdown.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, game: "lol" }),
      });

      const result: ScoutResponse = await response.json();

      if (result.success && result.data) {
        onReportGenerated(result.data, result.source || "GRID");
      } else {
        // Show explicit error based on code
        if (result.code === "MISSING_API_KEY") {
          setError("Live scouting failed: GRID API key not configured.");
        } else if (result.code === "GRID_FETCH_FAILED") {
          setError("Live scouting failed: GRID connection failed.");
        } else if (result.code === "TEAM_NOT_FOUND") {
          setError("Team not found in GRID database.");
        } else if (result.code === "NO_SERIES_FOUND") {
          setError("No recent series found for this team.");
        } else if (result.code === "PARSE_FAILED") {
          setError("Failed to parse match data. Please try again.");
        } else if (result.code === "SCOUT_NOT_IMPLEMENTED") {
          setError("Live scouting is not yet implemented.");
        } else {
          setError(result.error || "Live scouting failed. Please try again.");
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
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
                      setTeamId(null);
                    }
                    setOpen(true);
                    setHighlightedIndex(-1);
                  }}
                  onFocus={handleInputFocus}
                  onBlur={(e) => {
                    // Don't close popover on blur - let onInteractOutside handle it
                    // This prevents flash-close when clicking items
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing to search teams..."
                  className="pl-10 h-12"
                  disabled={loading}
                />
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0 w-[var(--radix-popover-trigger-width)]"
                  align="start"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    // Don't close if clicking inside the popover content or on the input trigger
                    const target = e.target as HTMLElement;
                    const popoverContent = e.currentTarget;
                    if (
                      popoverContent.contains(target) ||
                      target === inputRef.current ||
                      target.closest('input')
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <Command>
                    <CommandList ref={listRef}>
                      <CommandEmpty>
                        {searchQuery ? "No teams found." : "Start typing to search teams..."}
                      </CommandEmpty>
                      <CommandGroup>
                        {teams.map((team, index) => (
                          <CommandItem
                            key={team.id || team.name}
                            value={team.name}
                            onSelect={() => handleTeamSelect(team)}
                            onMouseDown={(e) => {
                              // Prevent input blur from closing popover before click completes
                              e.preventDefault();
                            }}
                            onClick={(e) => {
                              // Ensure click triggers selection
                              e.preventDefault();
                              handleTeamSelect(team);
                            }}
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
            <Button type="submit" size="lg" disabled={loading || !teamName.trim() || !teamId} className="h-12 px-6">
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
