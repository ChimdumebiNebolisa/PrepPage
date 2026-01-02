"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TeamReport } from "@/lib/types";
import { ChevronDown, ChevronUp, Copy, Download, Star } from "lucide-react";

export default function Report({ report, source }: { report: TeamReport; source: string }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      animate(containerRef.current, {
        translateY: [20, 0],
        opacity: [0, 1],
        easing: "easeOutQuad",
        duration: 500,
      });
    }
  }, [report]);

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

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    alert("Copied to clipboard!"); // Replace with Toast if sonner is available
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([generateMarkdown()], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = `prep_page_${report.teamName.toLowerCase()}_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div ref={containerRef} className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold">{report.teamName}</CardTitle>
            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
              <span>Region: {report.region}</span>
              <span>•</span>
              <span>{report.sampleSize} matches</span>
              <span>•</span>
              <span>{report.dateRange}</span>
            </div>
          </div>
          <Badge variant={source === "GRID" ? "default" : "secondary"} className="text-sm">
            {source}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Team Tendencies */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Team Tendencies
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.tendencies.map((tendency, i) => (
                <div key={i} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{tendency.title}</span>
                    {tendency.confidence === 'high' && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Top Champs</TableHead>
                    <TableHead className="text-right">Win Rate</TableHead>
                    <TableHead className="text-right">Freq</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.players.map((player) => (
                    <TableRow key={player.name}>
                      <TableCell className="font-medium">{player.name}</TableCell>
                      <TableCell>{player.role}</TableCell>
                      <TableCell>{player.champions.map(c => c.name).join(", ")}</TableCell>
                      <TableCell className="text-right">
                        {player.champions.map(c => `${(c.winRate * 100).toFixed(0)}%`).join(", ")}
                      </TableCell>
                      <TableCell className="text-right">
                        {player.champions.map(c => `${(c.frequency * 100).toFixed(0)}%`).join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                      <Badge variant="outline">{(comp.frequency * 100).toFixed(0)}% Frequency</Badge>
                   </div>
                   <p className="text-sm text-muted-foreground">{comp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Evidence Table */}
          <section>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowEvidence(!showEvidence)}
              className="w-full justify-between"
            >
              <span>{showEvidence ? "Hide Evidence" : "View Evidence"}</span>
              {showEvidence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showEvidence && (
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Sample Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.evidence.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{item.metric}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell>{item.sampleSize}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center">
        <Button onClick={handleCopy} variant="outline" className="gap-2">
          <Copy className="h-4 w-4" /> Copy as Markdown
        </Button>
        <Button onClick={handleDownload} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Download Markdown
        </Button>
      </div>
    </div>
  );
}
