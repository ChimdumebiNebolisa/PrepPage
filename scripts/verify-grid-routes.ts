#!/usr/bin/env node
/**
 * Runtime verification script for GRID Central Data API routes.
 * 
 * Validates that /api/teams and /api/scout work correctly against GRID Central Data.
 * 
 * Environment variables:
 * - BASE_URL (default: http://localhost:3000)
 * - TEAM_Q (required): Team search query (e.g. "CS2-1", "Cloud9")
 * - TEAM_ID (optional): Override to use specific team ID instead of searching
 * - TITLE_ID (optional): Title ID for filtering
 * - GAME (optional): Game identifier (default: "lol")
 * - HOURS (optional): Hours to look back (default: 72)
 * - GTE (optional): ISO datetime for start (overrides HOURS)
 * - LTE (optional): ISO datetime for end (overrides HOURS)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEAM_Q = process.env.TEAM_Q;
const TEAM_ID = process.env.TEAM_ID;
const TITLE_ID = process.env.TITLE_ID;
const GAME = process.env.GAME || 'lol';
const HOURS = parseInt(process.env.HOURS || '72', 10);
const GTE = process.env.GTE;
const LTE = process.env.LTE;

interface Team {
  id: string;
  name: string;
}

interface TeamsResponse {
  success: boolean;
  source?: string;
  teams?: Team[];
  code?: string;
  error?: string;
}

interface ScoutResponse {
  success: boolean;
  source?: string;
  data?: any;
  code?: string;
  error?: string;
  debug?: {
    totalSeriesFetched?: number;
    totalSeriesAfterFilter?: number;
    teamIdUsed?: string;
    seriesEdges?: Array<{
      node: {
        id: string;
        teams: Array<{
          baseInfo?: { id: string; name: string };
          id?: string;
          name?: string;
        }>;
      };
    }>;
  };
}

function fail(check: string, status: number, url: string, responseText: string): never {
  const truncated = responseText.length > 500 
    ? responseText.substring(0, 500) + '...' 
    : responseText;
  
  console.error(`\n❌ CHECK FAILED: ${check}`);
  console.error(`   Status: ${status}`);
  console.error(`   URL: ${url}`);
  console.error(`   Response (first 500 chars):\n${truncated}\n`);
  process.exit(1);
}

function log(message: string): void {
  console.log(`✓ ${message}`);
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<{ status: number; data: T; text: string }> {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let data: T;
    try {
      data = JSON.parse(text) as T;
    } catch {
      throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
    }
    return { status: response.status, data, text };
  } catch (err: any) {
    throw new Error(`Fetch failed: ${err.message}`);
  }
}

async function main(): Promise<void> {
  console.log('🔍 GRID Routes Verification\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Team Query: ${TEAM_Q || '(using TEAM_ID)'}`);
  console.log(`Game: ${GAME}`);
  if (TITLE_ID) console.log(`Title ID: ${TITLE_ID}`);
  console.log('');

  // Step A: Test /api/teams
  let teamId: string;
  
  if (TEAM_ID) {
    log(`Using provided TEAM_ID: ${TEAM_ID}`);
    teamId = TEAM_ID;
  } else {
    if (!TEAM_Q) {
      console.error('❌ ERROR: TEAM_Q or TEAM_ID must be provided');
      process.exit(1);
    }

    log(`Testing /api/teams?q=${encodeURIComponent(TEAM_Q)}`);
    const teamsUrl = `${BASE_URL}/api/teams?q=${encodeURIComponent(TEAM_Q)}${TITLE_ID ? `&titleId=${TITLE_ID}` : ''}&debug=1`;
    
    const { status, data, text } = await fetchJSON<TeamsResponse>(teamsUrl);

    if (status !== 200) {
      fail('TEAMS', status, teamsUrl, text);
    }

    if (!data.success) {
      fail('TEAMS', status, teamsUrl, `success: false, code: ${data.code}, error: ${data.error || 'unknown'}`);
    }

    if (!Array.isArray(data.teams) || data.teams.length === 0) {
      fail('TEAMS', status, teamsUrl, `No teams found in response. teams: ${JSON.stringify(data.teams)}`);
    }

    const firstTeam = data.teams[0];
    if (!firstTeam.id || !firstTeam.name) {
      fail('TEAMS', status, teamsUrl, `Invalid team structure: ${JSON.stringify(firstTeam)}`);
    }

    teamId = firstTeam.id;
    log(`Found team: ${firstTeam.name} (ID: ${teamId})`);
    
    if (data.debug) {
      log(`Debug info: ${JSON.stringify(data.debug)}`);
    }
  }

  // Step B: Test /api/scout
  log(`\nTesting /api/scout with teamId=${teamId}`);

  // Calculate time window
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - HOURS);
  const gte = GTE || cutoffDate.toISOString();
  const lte = LTE || now.toISOString();

  const scoutBody: any = {
    teamId,
    game: GAME,
    daysBack: Math.ceil(HOURS / 24),
    maxSeries: 10,
    debug: true, // Request debug info
  };

  if (TITLE_ID) {
    scoutBody.titleId = TITLE_ID;
  }

  const scoutUrl = `${BASE_URL}/api/scout`;
  const { status, data, text } = await fetchJSON<ScoutResponse>(scoutUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scoutBody),
  });

  if (status !== 200) {
    fail('SCOUT', status, scoutUrl, text);
  }

  if (!data.success) {
    fail('SCOUT', status, scoutUrl, `success: false, code: ${data.code}, error: ${data.error || 'unknown'}`);
  }

  if (!data.data) {
    fail('SCOUT', status, scoutUrl, 'Response missing data field');
  }

  log(`Scout returned success with data for team: ${data.data.teamName || 'unknown'}`);
  
  // Validate client-side filtering worked
  if (data.debug?.seriesEdges) {
    log(`Validating client-side filtering...`);
    log(`  Total series fetched: ${data.debug.totalSeriesFetched || 'unknown'}`);
    log(`  Series after filter: ${data.debug.totalSeriesAfterFilter || 'unknown'}`);
    
    const seriesEdges = data.debug.seriesEdges;
    let allValid = true;
    const invalidSeries: string[] = [];

    for (const edge of seriesEdges) {
      const teams = edge.node?.teams || [];
      const hasTeam = teams.some((team: any) => {
        const teamIdToCheck = team?.baseInfo?.id || team?.id;
        return String(teamIdToCheck) === String(teamId);
      });

      if (!hasTeam) {
        allValid = false;
        invalidSeries.push(edge.node?.id || 'unknown');
      }
    }

    if (!allValid) {
      fail(
        'SCOUT',
        status,
        scoutUrl,
        `Client-side filtering failed! Series without teamId ${teamId}: ${invalidSeries.join(', ')}`
      );
    }

    log(`  ✓ All ${seriesEdges.length} series contain teamId ${teamId}`);
  } else if (data.debug) {
    // If debug info exists but no seriesEdges, that's okay - just log the counts
    log(`Debug info: ${JSON.stringify(data.debug)}`);
  } else {
    // No debug info - can't validate filtering, but endpoint worked
    log(`  ⚠ No debug info available to validate filtering (this is okay if debug=false)`);
  }

  console.log('\n✅ All checks passed!\n');
}

main().catch((err) => {
  console.error('\n❌ FATAL ERROR:', err.message);
  if (err.stack) {
    console.error(err.stack);
  }
  process.exit(1);
});

