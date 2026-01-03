#!/usr/bin/env node
/**
 * Picks a real teamId from a real series in Central Data.
 *
 * This script fetches series from GRID Central Data (without team filtering),
 * picks the first series that has teams, and outputs a teamId from that series.
 * This ensures we're using actual teams that appear in real series, not just
 * team names that might not exist in the selected title/tournament/window.
 *
 * Environment variables:
 * - BASE_URL (default: http://localhost:3000) - Not used, calls GRID directly
 * - TITLE_ID (optional): Title ID for filtering
 * - TOURNAMENT_IDS (optional): Comma-separated tournament IDs
 * - WINDOW_DIR (optional, default: "next"): Time window direction - "past" or "next"
 * - HOURS (optional, default: 336): Hours for time window
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";
const GRID_API_KEY = process.env.GRID_API_KEY;
const TITLE_ID = process.env.TITLE_ID;
const TOURNAMENT_IDS = process.env.TOURNAMENT_IDS ? process.env.TOURNAMENT_IDS.split(',').map(id => id.trim()) : [];
const WINDOW_DIR = process.env.WINDOW_DIR || 'next';
const HOURS = parseInt(process.env.HOURS || '336', 10);

if (!GRID_API_KEY || GRID_API_KEY === "YOUR_GRID_API_KEY") {
  console.error('❌ ERROR: GRID_API_KEY must be set in environment');
  process.exit(1);
}

// Calculate time window
const now = new Date();
let gte: string;
let lte: string;

if (WINDOW_DIR === 'past') {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - HOURS);
  gte = cutoffDate.toISOString();
  lte = now.toISOString();
} else {
  const futureDate = new Date();
  futureDate.setHours(futureDate.getHours() + HOURS);
  gte = now.toISOString();
  lte = futureDate.toISOString();
}

async function fetchSeries(): Promise<any[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    let seriesQuery: string;
    let variables: any = { gte, lte };

    if (TOURNAMENT_IDS.length > 0) {
      // Query by tournament (use first tournament for simplicity)
      const tournamentId = TOURNAMENT_IDS[0];
      seriesQuery = `
        query GetSeriesByTournaments($tournamentId: ID!, $gte: String!, $lte: String!) {
          allSeries(
            filter: {
              tournament: { id: { in: [$tournamentId] }, includeChildren: { equals: true } }
              startTimeScheduled: { gte: $gte, lte: $lte }
            }
            orderBy: StartTimeScheduled
            first: 50
          ) {
            totalCount
            edges {
              node {
                id
                startTimeScheduled
                teams {
                  baseInfo {
                    id
                    name
                  }
                }
                tournament {
                  id
                  name
                }
              }
            }
          }
        }
      `;
      variables.tournamentId = tournamentId;
    } else if (TITLE_ID) {
      // Query by title
      seriesQuery = `
        query GetSeriesByTitle($titleId: String!, $gte: String!, $lte: String!) {
          allSeries(
            filter: {
              titleId: $titleId
              startTimeScheduled: { gte: $gte, lte: $lte }
            }
            orderBy: StartTimeScheduled
            first: 50
          ) {
            totalCount
            edges {
              node {
                id
                startTimeScheduled
                teams {
                  baseInfo {
                    id
                    name
                  }
                }
                tournament {
                  id
                  name
                }
              }
            }
          }
        }
      `;
      variables.titleId = TITLE_ID;
    } else {
      // Query all series in time window
      seriesQuery = `
        query GetSeries($gte: String!, $lte: String!) {
          allSeries(
            filter: {
              startTimeScheduled: { gte: $gte, lte: $lte }
            }
            orderBy: StartTimeScheduled
            first: 50
          ) {
            totalCount
            edges {
              node {
                id
                startTimeScheduled
                teams {
                  baseInfo {
                    id
                    name
                  }
                }
                tournament {
                  id
                  name
                }
              }
            }
          }
        }
      `;
    }

    const response = await fetch(GRID_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GRID_API_KEY,
      },
      body: JSON.stringify({
        query: seriesQuery,
        variables,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
    }

    return data.data?.allSeries?.edges || [];
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

async function main(): Promise<void> {
  console.log('🔍 Picking team from real series...\n');
  console.log(`Window: ${WINDOW_DIR} (${HOURS} hours)`);
  console.log(`Time range: ${gte} to ${lte}`);
  if (TITLE_ID) console.log(`Title ID: ${TITLE_ID}`);
  if (TOURNAMENT_IDS.length > 0) console.log(`Tournament IDs: ${TOURNAMENT_IDS.join(', ')}`);
  console.log('');

  try {
    const seriesEdges = await fetchSeries();

    if (seriesEdges.length === 0) {
      console.error('❌ ERROR: No series found in the specified time window');
      console.error('   Suggestions:');
      console.error(`   - Increase HOURS (current: ${HOURS})`);
      console.error(`   - Change WINDOW_DIR (current: ${WINDOW_DIR})`);
      console.error('   - Try specifying TITLE_ID or TOURNAMENT_IDS');
      process.exit(1);
    }

    // Find first series with teams
    let selectedSeries: any = null;
    for (const edge of seriesEdges) {
      const teams = edge.node?.teams || [];
      if (teams.length > 0 && teams.some((team: any) => team?.baseInfo?.id)) {
        selectedSeries = edge.node;
        break;
      }
    }

    if (!selectedSeries) {
      console.error('❌ ERROR: No series found with valid teams');
      process.exit(1);
    }

    const teams = selectedSeries.teams || [];
    const firstTeam = teams.find((team: any) => team?.baseInfo?.id);

    if (!firstTeam?.baseInfo) {
      console.error('❌ ERROR: Series has no valid team structure');
      process.exit(1);
    }

    const seriesId = selectedSeries.id;
    const teamId = firstTeam.baseInfo.id;
    const teamName = firstTeam.baseInfo.name;

    console.log('✅ Found series and team:');
    console.log(`   Series ID: ${seriesId}`);
    console.log(`   Team ID: ${teamId}`);
    console.log(`   Team Name: ${teamName}`);
    console.log('');

    // Output in format suitable for environment variables
    console.log('PICKED_SERIES_ID=' + seriesId);
    console.log('PICKED_TEAM_ID=' + teamId);
    console.log('PICKED_TEAM_NAME=' + teamName);
  } catch (err: any) {
    console.error('\n❌ FATAL ERROR:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();

