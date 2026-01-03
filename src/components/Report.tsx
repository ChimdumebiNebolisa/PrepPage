"use client";

import { useState } from "react";
import { TeamReport } from "@/lib/types";

export default function Report({ report, source, debug }: { report: TeamReport; source: string; debug?: any }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const generateMarkdown = () => {
    let md = `# Scouting Report: ${report.teamName}\n`;
    md += `**Region:** ${report.region} | **Sample:** ${report.sampleSize} matches | **Range:** ${report.dateRange} | **Source:** ${source}\n\n`;

    md += `## Team Tendencies\n`;
    report.tendencies.forEach(t => {
      md += `- **${t.title}**: ${t.evidence} (Confidence: ${t.confidence})\n`;
    });

    md += `\n## Player Tendencies\n`;
    md += `| Player | Role | Top Champs | Win Rate | Freq |\n`;
    md += `|--------|------|------------|----------|------|\n`;
    report.players.forEach(p => {
      const champs = p.champions.map(c => c.name).join(", ");
      const winRates = p.champions.map(c => `${(c.winRate * 100).toFixed(0)}%`).join(", ");
      const freqs = p.champions.map(c => `${(c.frequency * 100).toFixed(0)}%`).join(", ");
      md += `| ${p.name} | ${p.role} | ${champs} | ${winRates} | ${freqs} |\n`;
    });

    md += `\n## Compositions\n`;
    report.compositions.forEach(c => {
      md += `- **${c.comp}** (${(c.frequency * 100).toFixed(0)}%): ${c.description}\n`;
    });

    return md;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(null), 2000);
    } catch (error) {
      setCopyStatus("Failed to copy");
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateMarkdown()], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `prep_page_${report.teamName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Determine data readiness badge
  let dataReadiness: "Ready" | "Partial" | "Empty" = "Empty";
  let dataReadinessClass = "bg-gray-500 text-white";

  if (debug) {
    const hasFilesOrState = (debug.seriesWithFilesCount || 0) > 0 || (debug.seriesWithStateCount || 0) > 0;
    const hasSeries = (debug.seriesAfterTeamFilter || 0) > 0;

    if (hasFilesOrState) {
      dataReadiness = "Ready";
      dataReadinessClass = "bg-green-500 text-white";
    } else if (hasSeries) {
      dataReadiness = "Partial";
      dataReadinessClass = "bg-yellow-500 text-white";
    }
  } else if (report.sampleSize > 0) {
    dataReadiness = "Ready";
    dataReadinessClass = "bg-green-500 text-white";
  }

  const badgeText = source === "GRID" ? "LIVE" : "DEMO MODE";
  const badgeClass = source === "GRID"
    ? "bg-primary text-primary-foreground"
    : "bg-secondary text-secondary-foreground";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-row items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold">{report.teamName}</h2>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Region: {report.region}</span>
              <span>•</span>
              <span>{report.sampleSize} matches</span>
              <span>•</span>
              <span>{report.dateRange}</span>
              {debug && (
                <>
                  <span>•</span>
                  <span>Before filter: {debug.seriesFetchedBeforeTeamFilter || 0}</span>
                  <span>•</span>
                  <span>After filter: {debug.seriesAfterTeamFilter || 0}</span>
                  {(debug.seriesWithFilesCount !== undefined || debug.seriesWithStateCount !== undefined) && (
                    <>
                      <span>•</span>
                      <span>With files: {debug.seriesWithFilesCount || 0}</span>
                      <span>•</span>
                      <span>With state: {debug.seriesWithStateCount || 0}</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeClass}`}>
              {badgeText}
            </span>
            {debug && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${dataReadinessClass}`}>
                Data: {dataReadiness}
              </span>
            )}
          </div>
        </div>

        {/* Empty State Messages */}
        {report.sampleSize === 0 && (
          <div className="mb-6 p-4 border border-yellow-500 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <h3 className="font-semibold mb-2">No Data Available</h3>
            {debug?.seriesAfterTeamFilter === 0 ? (
              <p className="text-sm">
                No series found for the selected title/tournaments/time window.
                Try widening the time window or selecting different tournaments.
              </p>
            ) : (
              <p className="text-sm">
                Series found, but no in-game files/state available.
                This may be due to access restrictions or the series not having data yet.
              </p>
            )}
          </div>
        )}

        {report.sampleSize > 0 && (
        <div className="space-y-8">
          {/* Team Tendencies */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Team Tendencies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.tendencies.map((tendency, i) => (
                <div key={i} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{tendency.title}</span>
                    {tendency.confidence === 'high' && <span className="text-yellow-400">★</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{tendency.evidence}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Player Tendencies */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Player Tendencies</h3>
            <div className="rounded-md border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Player</th>
                    <th className="px-4 py-2 text-left font-medium">Role</th>
                    <th className="px-4 py-2 text-left font-medium">Top Champs</th>
                    <th className="px-4 py-2 text-right font-medium">Win Rate</th>
                    <th className="px-4 py-2 text-right font-medium">Freq</th>
                  </tr>
                </thead>
                <tbody>
                  {report.players.map((player, idx) => (
                    <tr key={player.name} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className="px-4 py-2 font-medium">{player.name}</td>
                      <td className="px-4 py-2">{player.role}</td>
                      <td className="px-4 py-2">{player.champions.map(c => c.name).join(", ")}</td>
                      <td className="px-4 py-2 text-right">
                        {player.champions.map(c => `${(c.winRate * 100).toFixed(0)}%`).join(", ")}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {player.champions.map(c => `${(c.frequency * 100).toFixed(0)}%`).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Compositions */}
          <section>
            <h3 className="text-lg font-semibold mb-4">Common Compositions</h3>
            <div className="space-y-3">
              {report.compositions.map((comp, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{comp.comp}</span>
                    <span className="px-2 py-1 text-xs border rounded">
                      {(comp.frequency * 100).toFixed(0)}% Frequency
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence Table */}
          <section>
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full flex justify-between items-center px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
            >
              <span>{showEvidence ? "Hide Evidence" : "View Evidence"}</span>
              <span>{showEvidence ? "▲" : "▼"}</span>
            </button>

            {showEvidence && (
              <div className="mt-4 rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Metric</th>
                      <th className="px-4 py-2 text-left font-medium">Value</th>
                      <th className="px-4 py-2 text-left font-medium">Sample Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.evidence.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                        <td className="px-4 py-2 font-medium">{item.metric}</td>
                        <td className="px-4 py-2">{item.value}</td>
                        <td className="px-4 py-2">{item.sampleSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
        )}
      </div>

      <div className="flex gap-4 justify-center items-center">
        <button
          onClick={handleCopy}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center gap-2"
        >
          <span>📋</span>
          Copy as Markdown
        </button>
        <button
          onClick={handleDownload}
          className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors flex items-center gap-2"
        >
          <span>⬇</span>
          Download Markdown
        </button>
        {copyStatus && (
          <span className="text-sm text-muted-foreground">{copyStatus}</span>
        )}
      </div>
    </div>
  );
}
