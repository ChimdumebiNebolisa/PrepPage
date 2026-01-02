"use client";

import { useRef, useState } from "react";
import LandingHero from "@/components/LandingHero";
import ScoutingEngine from "@/components/ScoutingEngine";
import Report from "@/components/Report";
import { TeamReport } from "@/lib/types";

export default function Home() {
  const [report, setReport] = useState<{ data: TeamReport; source: string } | null>(null);
  const engineRef = useRef<HTMLDivElement>(null);

  const scrollToEngine = () => {
    engineRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReportGenerated = (data: TeamReport, source: string) => {
    setReport({ data, source });
  };

  return (
    <main className="min-h-screen">
      <LandingHero onStartScouting={scrollToEngine} />
      
      <div ref={engineRef} className="container mx-auto px-4 py-20 min-h-screen flex flex-col items-center">
        <ScoutingEngine onReportGenerated={handleReportGenerated} />
        
        {report && (
          <Report report={report.data} source={report.source} />
        )}
      </div>

      <footer className="py-10 text-center text-muted-foreground border-t">
        <p>© 2026 Prep Page | Sky's the Limit Hackathon | Built with Junie</p>
      </footer>
    </main>
  );
}
