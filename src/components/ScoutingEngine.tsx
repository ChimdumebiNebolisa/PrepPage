"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoutResponse, TeamReport } from "@/lib/types";
import { AlertCircle, Loader2, Search } from "lucide-react";

export default function ScoutingEngine({ onReportGenerated }: { onReportGenerated: (report: TeamReport, source: string) => void }) {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        onReportGenerated(result.data, result.source || "GRID");
      } else {
        // Fallback to demo data
        const demoDataResponse = await fetch("/demo-data.json");
        const demoData = await demoDataResponse.json();
        
        // Find matching team in demo data or default to Cloud9
        const matchedTeam = demoData.teams[teamName] || demoData.teams["Cloud9"];
        
        if (result.error === "timeout") {
            setError("GRID API timed out. Using demo data instead.");
        } else {
            setError("GRID unavailable. Showing demo data instead.");
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Opponent Team Name (e.g., Cloud9, Sentinels)"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="pl-10 h-12"
                disabled={loading}
              />
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
