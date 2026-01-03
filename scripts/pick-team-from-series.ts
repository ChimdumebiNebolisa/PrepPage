#!/usr/bin/env node
/**
 * Picks a real teamId from a real series in Central Data that has evidence (files or state).
 *
 * This script fetches series from GRID Central Data (without team filtering),
 * checks each series for File Download files or Series State evidence,
 * picks the first series that has evidence and teams, and outputs a teamId from that series.
 * This ensures we're using actual teams that appear in real series with in-game data available.
 *
 * Environment variables:
 * - BASE_URL (default: http://localhost:3000) - Not used, calls GRID directly
 * - TITLE_ID (optional): Title ID for filtering
 * - TOURNAMENT_IDS (optional): Comma-separated tournament IDs
 * - WINDOW_DIR (optional, default: "past"): Time window direction - "past" or "next"
 * - HOURS (optional, default: 17520): Hours for time window (17520 = ~2 years, aligned with hackathon scope)
 * - MAX_SERIES_TO_CHECK (optional, default: 50): Maximum number of series to check for evidence
 * - STRICT (optional): If "1", exit non-zero if no evidence found
 */

import { loadEnvConfig } from "@next/env";
import { getDefaultTournamentIds } from "../src/lib/hackathon-tournaments";
import { getSeriesStateGraphqlUrl, getSeriesStateTier } from "../src/lib/grid-endpoints";
loadEnvConfig(process.cwd());

const GRID_GRAPHQL_ENDPOINT = "https://api-op.grid.gg/central-data/graphql";
const GRID_API_KEY = process.env.GRID_API_KEY;
const TITLE_ID = process.env.TITLE_ID;
const TOURNAMENT_IDS_ENV = process.env.TOURNAMENT_IDS ? process.env.TOURNAMENT_IDS.split(',').map(id => id.trim()) : [];
// Use env override if provided, otherwise use Hackathon whitelist default
const TOURNAMENT_IDS = TOURNAMENT_IDS_ENV.length > 0 ? TOURNAMENT_IDS_ENV : getDefaultTournamentIds();
const TOURNAMENT_IDS_SOURCE = TOURNAMENT_IDS_ENV.length > 0 ? 'env override' : 'Hackathon whitelist default';
const WINDOW_DIR = process.env.WINDOW_DIR || 'past';
const HOURS = parseInt(process.env.HOURS || '17520', 10);
const MAX_SERIES_TO_CHECK = parseInt(process.env.MAX_SERIES_TO_CHECK || '50', 10);
const STRICT = process.env.STRICT === '1';
const GRID_FILE_DOWNLOAD_BASE = "https://api.grid.gg/file-download";

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
    let allEdges: any[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;
    const pageSize = 100;

    while (hasNextPage && allEdges.length < MAX_SERIES_TO_CHECK) {
      let seriesQuery: string;
      let variables: any = { gte, lte };

      if (TOURNAMENT_IDS.length > 0) {
        // Milestone B: Match Quickstart query shape exactly with pagination
        // Per Quickstart: filter: { tournament: { id: { in: <ID> }, includeChildren: { equals: true } } }
        seriesQuery = `
          query GetSeriesByTournaments($tournamentIds: [ID!]!, $gte: String!, $lte: String!, $first: Int, $after: String) {
            allSeries(
              filter: {
                tournament: { id: { in: $tournamentIds }, includeChildren: { equals: true } }
                startTimeScheduled: { gte: $gte, lte: $lte }
              }
              orderBy: StartTimeScheduled
              first: $first
              after: $after
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
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        `;
        variables.tournamentIds = TOURNAMENT_IDS;
        variables.first = Math.min(pageSize, MAX_SERIES_TO_CHECK - allEdges.length);
        if (cursor) {
          variables.after = cursor;
        }
      } else if (TITLE_ID) {
        // Query by title (not using tournament filter, so no includeChildren needed)
        seriesQuery = `
          query GetSeriesByTitle($titleId: String!, $gte: String!, $lte: String!, $first: Int, $after: String) {
            allSeries(
              filter: {
                titleId: $titleId
                startTimeScheduled: { gte: $gte, lte: $lte }
              }
              orderBy: StartTimeScheduled
              first: $first
              after: $after
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
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        `;
        variables.titleId = TITLE_ID;
        variables.first = Math.min(pageSize, MAX_SERIES_TO_CHECK - allEdges.length);
        if (cursor) {
          variables.after = cursor;
        }
      } else {
        // Query all series in time window
        seriesQuery = `
          query GetSeries($gte: String!, $lte: String!, $first: Int, $after: String) {
            allSeries(
              filter: {
                startTimeScheduled: { gte: $gte, lte: $lte }
              }
              orderBy: StartTimeScheduled
              first: $first
              after: $after
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
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        `;
        variables.first = Math.min(pageSize, MAX_SERIES_TO_CHECK - allEdges.length);
        if (cursor) {
          variables.after = cursor;
        }
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${data.errors.map((e: any) => e.message).join(', ')}`);
      }

      const edges = data.data?.allSeries?.edges || [];
      allEdges.push(...edges);
      
      const pageInfo = data.data?.allSeries?.pageInfo;
      hasNextPage = pageInfo?.hasNextPage || false;
      cursor = pageInfo?.endCursor || null;

      // If we got fewer results than requested, we've reached the end
      if (edges.length < pageSize) {
        hasNextPage = false;
      }
    }

    clearTimeout(timeoutId);
    return allEdges;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  }
}

async function checkFileDownload(seriesId: string): Promise<{ hasFiles: boolean; status: number }> {
  try {
    const response = await fetch(`${GRID_FILE_DOWNLOAD_BASE}/list/${seriesId}`, {
      method: 'GET',
      headers: {
        'x-api-key': GRID_API_KEY!,
      },
    });

    if (response.status === 403) {
      return { hasFiles: false, status: 403 };
    }

    if (!response.ok) {
      return { hasFiles: false, status: response.status };
    }

    const fileList = await response.json();
    const hasFiles = Array.isArray(fileList) && fileList.length > 0;
    return { hasFiles, status: response.status };
  } catch (err) {
    return { hasFiles: false, status: 0 };
  }
}

async function checkSeriesState(seriesId: string): Promise<{ hasState: boolean; status: number }> {
  try {
    const query = `
      query GetSeriesState($seriesId: ID!) {
        seriesState(seriesId: $seriesId) {
          seriesId
          state
          timestamp
        }
      }
    `;

    const seriesStateUrl = getSeriesStateGraphqlUrl();
    const response = await fetch(seriesStateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': GRID_API_KEY!,
      },
      body: JSON.stringify({
        query,
        variables: { seriesId },
      }),
    });

    if (!response.ok) {
      return { hasState: false, status: response.status };
    }

    const data = await response.json();
    // Evidence exists if we got a response without errors and with state data
    const hasState = !data.errors && !!data.data?.seriesState;
    return { hasState, status: response.status };
  } catch (err) {
    return { hasState: false, status: 0 };
  }
}

async function main(): Promise<void> {
  console.log('🔍 Picking team from series with evidence (files or state)...\n');
  console.log(`Window: ${WINDOW_DIR} (${HOURS} hours)`);
  console.log(`Time range: ${gte} to ${lte}`);
  if (TITLE_ID) console.log(`Title ID: ${TITLE_ID}`);
  console.log(`Tournament IDs (${TOURNAMENT_IDS_SOURCE}): ${TOURNAMENT_IDS.slice(0, 5).join(', ')}${TOURNAMENT_IDS.length > 5 ? ` ... (${TOURNAMENT_IDS.length} total)` : ''}`);
  console.log(`Max series to check: ${MAX_SERIES_TO_CHECK}`);
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

    console.log(`Found ${seriesEdges.length} series. Checking for evidence...\n`);

    // Check series for evidence (files or state)
    let selectedSeries: any = null;
    let selectedEvidence: string = '';
    let checkedCount = 0;
    let seriesWithFilesCount = 0;
    let seriesWithStateCount = 0;
    const fileDownloadStatusCounts: Record<number, number> = {};
    const seriesStateStatusCounts: Record<number, number> = {};

    const seriesToCheck = seriesEdges.slice(0, MAX_SERIES_TO_CHECK);

    for (const edge of seriesToCheck) {
      const series = edge.node;
      const seriesId = series.id;
      const teams = series?.teams || [];

      // Skip if no teams
      if (!teams.length || !teams.some((team: any) => team?.baseInfo?.id)) {
        continue;
      }

      checkedCount++;

      // Check File Download
      const fileCheck = await checkFileDownload(seriesId);
      fileDownloadStatusCounts[fileCheck.status] = (fileDownloadStatusCounts[fileCheck.status] || 0) + 1;
      const hasFiles = fileCheck.hasFiles;
      if (hasFiles) {
        seriesWithFilesCount++;
      }

      // Check Series State
      const stateCheck = await checkSeriesState(seriesId);
      seriesStateStatusCounts[stateCheck.status] = (seriesStateStatusCounts[stateCheck.status] || 0) + 1;
      const hasState = stateCheck.hasState;
      if (hasState) {
        seriesWithStateCount++;
      }

      // Select first series with evidence
      if ((hasFiles || hasState) && !selectedSeries) {
        selectedSeries = series;
        if (hasFiles && hasState) {
          selectedEvidence = 'files+state';
        } else if (hasFiles) {
          selectedEvidence = 'files';
        } else {
          selectedEvidence = 'state';
        }
        break; // Found one with evidence, stop checking
      }
    }

    if (!selectedSeries) {
      // No evidence found - print distribution summary
      console.error('❌ ERROR: No series found with evidence (files or state)');
      console.error('\nDistribution summary:');

      // File Download distribution
      const fileDownload403 = fileDownloadStatusCounts[403] || 0;
      const fileDownload200Empty = (fileDownloadStatusCounts[200] || 0) - seriesWithFilesCount;
      const fileDownload200Files = seriesWithFilesCount;
      const fileDownloadOther = Object.entries(fileDownloadStatusCounts)
        .filter(([status]) => status !== '200' && status !== '403')
        .reduce((sum, [, count]) => sum + count, 0);
      console.error(`  fileDownload: { http403: ${fileDownload403}, http200Empty: ${fileDownload200Empty}, http200Files: ${fileDownload200Files}, other: ${fileDownloadOther} }`);

      // Series State distribution
      const seriesState403 = seriesStateStatusCounts[403] || 0;
      const seriesState200NoState = (seriesStateStatusCounts[200] || 0) - seriesWithStateCount;
      const seriesState200HasState = seriesWithStateCount;
      const seriesStateOther = Object.entries(seriesStateStatusCounts)
        .filter(([status]) => status !== '200' && status !== '403')
        .reduce((sum, [, count]) => sum + count, 0);
      console.error(`  seriesState: { http403: ${seriesState403}, http200NoState: ${seriesState200NoState}, http200HasState: ${seriesState200HasState}, other: ${seriesStateOther} }`);

      console.error('\n  Suggestions:');
      console.error(`   - Increase HOURS (current: ${HOURS})`);
      console.error(`   - Change WINDOW_DIR (current: ${WINDOW_DIR})`);
      console.error('   - Try specifying TITLE_ID or TOURNAMENT_IDS');
      console.error('   - Verify API key has access to file-download and series-state endpoints');

      if (STRICT) {
        process.exit(1);
      } else {
        console.error('\n⚠️  Exiting with status 0 (STRICT mode not enabled)');
        process.exit(0);
      }
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
    const seriesStateTier = getSeriesStateTier();

    console.log('✅ Found series with evidence:');
    console.log(`   Series ID: ${seriesId}`);
    console.log(`   Team ID: ${teamId}`);
    console.log(`   Team Name: ${teamName}`);
    console.log(`   Evidence: ${selectedEvidence}`);
    console.log(`   Series State Tier: ${seriesStateTier}`);
    console.log('');

    // Output in format suitable for environment variables
    console.log('PICKED_SERIES_ID=' + seriesId);
    console.log('PICKED_TEAM_ID=' + teamId);
    console.log('PICKED_TEAM_NAME=' + teamName);
    console.log('PICKED_EVIDENCE=' + selectedEvidence);
    console.log('PICKED_SERIES_STATE_TIER=' + seriesStateTier);
    console.log('PICKED_TOURNAMENT_IDS_USED=' + TOURNAMENT_IDS.slice(0, 3).join(','));
  } catch (err: any) {
    console.error('\n❌ FATAL ERROR:', err.message);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();

