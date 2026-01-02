"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScoutResponse, TeamReport } from "@/lib/types";
import { AlertCircle, Loader2, Search, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Team {
  id?: string;
  name: string;
}

interface TeamsResponse {
  success: boolean;
  source: "GRID" | "Demo";
  teams: Team[];
}

export default function ScoutingEngine({ onReportGenerated }: { onReportGenerated: (report: TeamReport, source: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsSource, setTeamsSource] = useState<"GRID" | "Demo">("Demo");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounced search
  useEffect(() => {
    const fetchTeams = async (q: string) => {
      try {
        const response = await fetch(`/api/teams?q=${encodeURIComponent(q)}&limit=10`);
        const data: TeamsResponse = await response.json();
        setTeams(data.teams);
        setTeamsSource(data.source);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchTeams(searchQuery);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Fetch initial teams when combobox opens
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && teams.length === 0) {
      // Fetch default teams when opening
      fetch(`/api/teams?q=&limit=10`)
        .then((res) => res.json())
        .then((data: TeamsResponse) => {
          setTeams(data.teams);
          setTeamsSource(data.source);
        })
        .catch((err) => console.error("Failed to fetch teams:", err));
    }
  }, [teams.length]);

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
      const isSuccessful = result.success;

      if (isSuccessful) {
        // Success (potentially simulated if data is null)
        const demoDataResponse = await fetch("/demo-data.json");
        const demoData = await demoDataResponse.json();

        // Use result data if present, otherwise fallback to matching demo team
        const reportData = result.data || demoData.teams[teamName] || demoData.teams["Cloud9"];

        onReportGenerated(reportData, result.source || "GRID");
      } else {
        // Fallback to demo data on explicit failure
        const demoDataResponse = await fetch("/demo-data.json");
        const demoData = await demoDataResponse.json();

        // Find matching team in demo data or default to Cloud9
        const matchedTeam = demoData.teams[teamName] || demoData.teams["Cloud9"];

        if (result.code === "MISSING_API_KEY") {
            setError("GRID API key not configured. Using Demo Mode.");
        } else if (result.code === "GRID_FETCH_FAILED") {
            setError("GRID connection failed. Using Demo Mode.");
        } else if (result.error === "timeout") {
            setError("GRID API timed out. Using Demo Mode.");
        } else if (result.error) {
            setError(`${result.error}. Using Demo Mode.`);
        } else {
            setError("GRID unavailable. Using Demo Mode.");
        }

        onReportGenerated(matchedTeam, "Demo Mode");
      }
    } catch (err) {
      // Catch-all fallback
      const demoDataResponse = await fetch("/demo-data.json");
      const demoData = await demoDataResponse.json();
      onReportGenerated(demoData.teams["Cloud9"], "Demo Mode");
      setError("An error occurred. Showing demo data instead.");
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
            <div className="relative flex-1">
              <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-12 pl-10"
                    type="button"
                    disabled={loading}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Search className="absolute left-3 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className={cn("ml-6 truncate", !teamName && "text-muted-foreground")}>
                        {teamName || "Opponent Team Name (e.g., Cloud9, Sentinels)"}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-0"
                  align="start"
                  sideOffset={4}
                >
                <Command>
                  <CommandInput
                    placeholder="Search teams..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No teams found.</CommandEmpty>
                    <CommandGroup>
                      {teams.map((team) => (
                        <CommandItem
                          key={team.id || team.name}
                          value={team.name}
                          onSelect={() => {
                            setTeamName(team.name);
                            setOpen(false);
                            setSearchQuery("");
                          }}
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
                {teamsSource === "Demo" && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                    Demo list
                  </div>
                )}
              </PopoverContent>
            </Popover>
            </div>
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