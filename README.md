# Prep Page

**"Know your opponent in 30 seconds."**

Prep Page is a minimal web app that generates scouting reports for esports teams. Users select a team, generate a report, and export it as markdown. The app works reliably with minimal dependencies and always falls back to demo data when GRID API fails.

## Features

- **Landing Page**: Hero section with value proposition and "How it works"
- **Team Search**: Typeahead search with debounced API calls (calls `/api/teams` with 250ms debounce). Shows "LIVE SEARCH" indicator when using GRID data. Falls back to demo teams toggle when API key is missing.
- **Report Generation**: Always attempts GRID API first, falls back to demo data only on failure
- **Demo Fallback**: Automatically falls back to demo data when GRID API fails, times out (>5s), or API key is missing. Reports show "LIVE" or "DEMO MODE" badge.
- **Export**: Copy markdown to clipboard or download as `.md` file

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

**Demo mode works without environment variables** - the app will automatically use demo data if GRID API is unavailable.

## Tools Used

- **Next.js**: React framework with App Router
- **Tailwind CSS**: Styling (Tailwind only, no component libraries)
- **GRID API**: Official esports data source (optional, demo mode available)

## Environment Setup

For live GRID data, create a `.env.local` file (or copy from `.env.example`):

```env
GRID_API_KEY=your_key_here
```

**Important:**
- Use `GRID_API_KEY` (server-side only), never `NEXT_PUBLIC_GRID_API_KEY`
- Live search requires `GRID_API_KEY` - without it, you'll see a notice and can toggle to use demo teams
- Demo report generation works without this variable (automatic fallback)
- All GRID API calls happen in Route Handlers (`src/app/api/*/route.ts`)
- API key is never exposed to the browser

## Architecture

- **Routing**: Next.js App Router
- **API Routes**: Route Handlers at `src/app/api/*/route.ts` (no `pages/api`)
- **UI**: Tailwind CSS only (no shadcn/ui, no anime.js, no external UI libraries)
- **Demo Data**: `public/demo-data.json` (fetched via `fetch('/demo-data.json')`)

## API Routes

### `/api/grid/introspect`

Introspects the GRID GraphQL schema to discover field names for `Series`, `SeriesFilter`, and `SeriesOrderBy` types. This endpoint is used internally by the scout query to ensure it uses the correct field names from the actual schema.

**Important Notes:**
- The endpoint makes **3 separate HTTP requests** to GRID's GraphQL API, each with exactly ONE `__type(name: "...")` query
- This is required because GRID's GraphQL server enforces "good-faith introspection" restrictions (from graphql-java) that only allow ONE `__type` or `__schema` field per request
- Results are cached in-memory for 10 minutes to avoid hitting introspection limits during development
- The endpoint only queries whitelisted types (`Series`, `SeriesFilter`, `SeriesOrderBy`) to prevent schema exfiltration

**Response Format:**
```json
{
  "success": true,
  "seriesType": {
    "name": "Series",
    "fields": [{"name": "id", "type": {...}}, ...]
  },
  "seriesFilter": {
    "name": "SeriesFilter",
    "inputFields": [{"name": "teams", "type": {...}}, ...]
  },
  "seriesOrderBy": {
    "name": "SeriesOrderBy",
    "enumValues": ["START_DATE", "END_DATE", ...]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "code": "INTROSPECTION_FAILED",
  "error": "GraphQL error for SeriesFilter: ...",
  "details": {
    "which": "SeriesFilter",
    "httpStatus": 200
  }
}
```

**Testing:**
```bash
# Test introspection endpoint
curl http://localhost:3000/api/grid/introspect
```

## User Flow

1. User types team name in search field (minimum 2 characters recommended)
2. App calls `/api/teams` with debounced query (250ms)
3. If GRID_API_KEY is present: Shows "LIVE SEARCH" indicator with live team results
4. If GRID_API_KEY is missing: Shows notice with option to toggle "Use Demo Teams"
5. User selects team from dropdown
6. User clicks "Generate Report"
7. App always attempts `/api/scout` first (5 second timeout)
8. On success: Report renders with "LIVE" badge
9. On failure/timeout/missing key: App automatically fetches `/demo-data.json` and renders with "DEMO MODE" badge
10. User can copy or download markdown

## Testing

```bash
# Run tests
npm test

# Lint
npm run lint

# Build
npm run build
```

### Manual Testing

1. Load the app at http://localhost:3000
2. Type a team name (e.g., "Cloud9")
3. Select a team from dropdown
4. Click "Generate Report"
5. Verify report renders with "LIVE" or "DEMO MODE" badge
6. Test export buttons (Copy and Download)

### Demo Fallback Test

1. Remove or comment out `GRID_API_KEY` in `.env.local`
2. Start dev server: `npm run dev`
3. Generate a report
4. Verify "DEMO MODE" badge appears
5. Verify report content is from demo data

## Runtime Verification

The project includes a verification script that tests the API routes against GRID Central Data to ensure they work correctly.

### Running Verification

**Prerequisites:**
- Development server must be running (`npm run dev`)
- `GRID_API_KEY` must be set in `.env.local`

**Basic Usage (PowerShell):**
```powershell
$env:TEAM_Q="Cloud9"
npm run verify:grid
```

**Basic Usage (Bash):**
```bash
TEAM_Q="Cloud9" npm run verify:grid
```

**Advanced Usage with Options:**
```bash
# With title ID and custom time window (next 14 days by default)
TEAM_Q="CS2-1" TITLE_ID="3" npm run verify:grid

# Look at past series (last 48 hours)
TEAM_Q="Cloud9" WINDOW_DIR="past" HOURS=48 npm run verify:grid

# Look at upcoming series (next 336 hours / 14 days - recommended)
TEAM_Q="Cloud9" WINDOW_DIR="next" HOURS=336 npm run verify:grid

# With explicit time range (overrides WINDOW_DIR and HOURS)
TEAM_Q="Cloud9" GTE="2024-01-01T00:00:00Z" LTE="2024-01-31T23:59:59Z" npm run verify:grid

# Use specific team ID (skip team search)
TEAM_ID="12345" npm run verify:grid

# Strict mode: fail if no series found (default is soft failure)
TEAM_Q="Cloud9" STRICT=1 npm run verify:grid
```

### Environment Variables

- `BASE_URL` (default: `http://localhost:3000`) - API base URL
- `TEAM_Q` (required unless `TEAM_ID` is set) - Team search query
- `TEAM_ID` (optional) - Override to use specific team ID instead of searching
- `TITLE_ID` (optional) - Title ID for filtering teams/series
- `GAME` (optional, default: `lol`) - Game identifier
- `WINDOW_DIR` (optional, default: `next`) - Time window direction: `"past"` or `"next"`
  - `"past"`: Look at past series (gte = now - HOURS, lte = now)
  - `"next"`: Look at upcoming series (gte = now, lte = now + HOURS) - **Recommended for scouting**
- `HOURS` (optional, default: `336` = 14 days) - Hours for time window
- `GTE` (optional) - ISO datetime for start (overrides `HOURS` and `WINDOW_DIR`)
- `LTE` (optional) - ISO datetime for end (overrides `HOURS` and `WINDOW_DIR`)
- `STRICT` (optional) - If set to `"1"`, treat `NO_SERIES_FOUND` as failure (default: soft failure)

### What It Validates

1. **Team Search (`/api/teams`)**:
   - Returns HTTP 200
   - Response contains valid team array with `{ id, name }`
   - At least one team is returned

2. **Scout Endpoint (`/api/scout`)**:
   - Returns HTTP 200 with valid report data
   - Client-side filtering worked correctly
   - Every returned series contains the requested teamId in `teams.baseInfo.id`
   - **Note**: If no series are found in the time window, returns HTTP 200 with `success: true` and `code: "NO_SERIES_FOUND"`. This is treated as a soft failure (exit 0) unless `STRICT=1` is set.

### Debug Mode

Add `debug=1` query parameter to API calls to get additional debugging information:

```bash
# Teams endpoint with debug
curl "http://localhost:3000/api/teams?q=Cloud9&debug=1"

# Scout endpoint with debug (in request body)
curl -X POST http://localhost:3000/api/scout \
  -H "Content-Type: application/json" \
  -d '{"teamId":"123","debug":true}'
```

Debug responses include:
- **Teams**: Query name, edge count, returned count
- **Scout**: Total series fetched, series after filter, teamId used, series edges with team data

### Troubleshooting

**"No teams found"**
- Check `TEAM_Q` matches actual team names in GRID
- Try different search terms
- Verify `GRID_API_KEY` is set correctly

**"NO_SERIES_FOUND"**
- Adjust `HOURS` or `GTE`/`LTE` to widen time window
- Check if team has recent matches in the specified time range
- Try different `TITLE_ID` if filtering by title

**"Client-side filtering failed"**
- This indicates a bug in the filtering logic
- Check that series responses include `teams.baseInfo.id` structure
- Verify the teamId format matches between search and scout endpoints

## Golden Path Validation

The golden path validation sequence provides an end-to-end proof that:
1. We can fetch Central Data series IDs for a real title/tournament/window
2. We can pick a teamId that actually appears in those series (not by name search)
3. At least one seriesId has File Download and/or Series State evidence

### Prerequisites

- Development server must be running (`npm run dev`)
- `GRID_API_KEY` must be set in `.env.local` (or environment)

### Validation Sequence (PowerShell)

```powershell
# 1) Choose a title/tournaments/window that returns series (your UI can do this too).
# Optional: Set TITLE_ID, TOURNAMENT_IDS, WINDOW_DIR, HOURS
# Defaults: WINDOW_DIR="next", HOURS=336 (14 days)

# 2) Pick a real team from a real series:
npm run pick:grid:team

# Output will show:
# PICKED_SERIES_ID=...
# PICKED_TEAM_ID=...
# PICKED_TEAM_NAME=...

# 3) Run strict verification using the picked teamId:
$env:STRICT="1"
$env:MIN_SERIES="1"
$env:MIN_EVIDENCE="1"
$env:WINDOW_DIR="past"
$env:HOURS="17520"
# Set TEAM_ID from the picker output:
$env:TEAM_ID="<<PICKED_TEAM_ID>>"
npm run verify:grid

# 4) Prove File Download exists for at least one seriesId:
$env:SERIES_ID="<<PICKED_SERIES_ID>>"
npm run prove:file-download
```

### Validation Sequence (Bash)

```bash
# 1) Choose a title/tournaments/window that returns series
# Optional: Set TITLE_ID, TOURNAMENT_IDS, WINDOW_DIR, HOURS
# Defaults: WINDOW_DIR="next", HOURS=336 (14 days)

# 2) Pick a real team from a real series:
npm run pick:grid:team

# Output will show:
# PICKED_SERIES_ID=...
# PICKED_TEAM_ID=...
# PICKED_TEAM_NAME=...

# 3) Run strict verification using the picked teamId:
STRICT=1 MIN_SERIES=1 MIN_EVIDENCE=1 WINDOW_DIR=past HOURS=17520 TEAM_ID=<<PICKED_TEAM_ID>> npm run verify:grid

# 4) Prove File Download exists for at least one seriesId:
SERIES_ID=<<PICKED_SERIES_ID>> npm run prove:file-download
```

### Scripts Reference

#### `pick:grid:team`

Fetches series from Central Data (without team filtering) and picks a real teamId from the first series that has evidence (files or state) and teams.

**Environment Variables:**
- `TITLE_ID` (optional): Title ID for filtering
- `TOURNAMENT_IDS` (optional): Comma-separated tournament IDs (defaults to Hackathon whitelist if not provided)
- `WINDOW_DIR` (optional, default: `"past"`): Time window direction - `"past"` or `"next"`
- `HOURS` (optional, default: `17520`): Hours for time window (17520 = ~2 years, aligned with hackathon scope)
- `MAX_SERIES_TO_CHECK` (optional, default: `50`): Maximum number of series to check for evidence
- `STRICT` (optional): If `"1"`, exit non-zero if no evidence found

**Output:**
- `PICKED_SERIES_ID=...`
- `PICKED_TEAM_ID=...`
- `PICKED_TEAM_NAME=...`
- `PICKED_EVIDENCE=...` (values: "files", "state", or "files+state")
- `PICKED_TOURNAMENT_IDS_USED=...` (first few tournament IDs used)

#### `prove:file-download`

Calls `/api/grid/file-download/list?seriesId=SERIES_ID` and verifies at least 1 file is returned. If empty, automatically tries the next 3 seriesIds from `SAMPLE_SERIES_IDS`.

**Environment Variables:**
- `BASE_URL` (optional, default: `http://localhost:3000`): API base URL
- `SERIES_ID` (required): Series ID to check
- `SAMPLE_SERIES_IDS` (optional): Comma-separated list of alternative series IDs to try

**Output:**
- Success: Lists file IDs, fileNames, and statuses
- Failure: Clear conclusion message if no files found for any seriesId

### Direct File Download Probe (No App Involved)

You can directly test the File Download API without going through the app to verify that files are available for a specific series ID. This helps diagnose entitlement issues independently of the application code.

#### Using the npm script:

```bash
# Set SERIES_ID and run the probe
SERIES_ID="your-series-id-here" npm run probe:file-download:direct
```

**PowerShell Example:**
```powershell
$env:SERIES_ID="your-series-id-here"
npm run probe:file-download:direct
```

#### Manual PowerShell probe:

```powershell
$seriesId = "your-series-id-here"
$apiKey = $env:GRID_API_KEY

$response = Invoke-WebRequest -Uri "https://api.grid.gg/file-download/list/$seriesId" `
  -Headers @{ "x-api-key" = $apiKey } `
  -Method GET

$files = $response.Content | ConvertFrom-Json
Write-Host "Files found: $($files.Count)"
```

#### Response Interpretation:

- **HTTP 200 with files**: Files are available - if the app/proxy still fails, it indicates a selection bug in the application logic
- **HTTP 200 with empty array (`[]`)**: Content not available for this `seriesId` - the series exists in Central Data but has no associated file downloads (see File Download API documentation for more details)
- **HTTP 403**: Entitlement/scope issue - your API key doesn't have access to file downloads for this series
- **HTTP 401**: Authentication failed - check your GRID_API_KEY

**Exit Codes (npm script):**
- `0`: HTTP 200 (even if empty array)
- `2`: HTTP 403 (FORBIDDEN)
- `3`: HTTP 401 (UNAUTHORIZED)
- `4`: Other error

**Note:** Do not include API keys or secrets in documentation or commit them to version control.

### Strict Mode Enhancements

When `STRICT=1` is set in `verify:grid`:
- `MIN_SERIES` defaults to `1` if not explicitly set
- `MIN_EVIDENCE` defaults to `1` if not explicitly set
- Fails (exit 1) if `seriesFetchedBeforeTeamFilter < MIN_SERIES`
- Fails (exit 1) if `seriesAfterTeamFilter < MIN_SERIES`
- Fails (exit 1) if `(seriesWithFilesCount + seriesWithStateCount) < MIN_EVIDENCE`
- Prints debug counters: `seriesFetchedBeforeTeamFilter`, `seriesAfterTeamFilter`, `seriesWithFilesCount`, `seriesWithStateCount`, `totalEvidenceCount`, `MIN_EVIDENCE threshold`, `sampleSeriesIds`

**Note:** The `MIN_EVIDENCE` check ensures that series not only exist, but also have in-game data (files or state) available. This prevents false positives where series exist in Central Data but have no associated file downloads or series state.

## License

Licensed under [MIT](LICENSE).
