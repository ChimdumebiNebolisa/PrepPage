export interface Champion {
  name: string;
  winRate: number;
  frequency: number;
}

export interface Player {
  name: string;
  role: string;
  champions: Champion[];
}

export interface Tendency {
  title: string;
  evidence: string;
  confidence: "high" | "medium" | "low";
}

export interface Composition {
  comp: string;
  frequency: number;
  description: string;
}

export interface EvidenceItem {
  metric: string;
  value: string;
  sampleSize: string;
}

export interface TeamReport {
  teamName: string;
  region: string;
  lastUpdated: string;
  sampleSize: number;
  dateRange: string;
  tendencies: Tendency[];
  players: Player[];
  compositions: Composition[];
  evidence: EvidenceItem[];
}

export interface ScoutResponse {
  success: boolean;
  ok?: boolean;
  data?: TeamReport;
  source?: "GRID" | "Demo Mode" | string;
  error?: string;
  code?: string;
}
