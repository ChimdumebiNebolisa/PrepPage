# PrepPage PRD (Lean Tailwind Edition)

## Goal

PrepPage is a minimal web app that generates scouting reports for esports teams. Users select a team, generate a report, and export it as markdown. The app works reliably with minimal dependencies and always falls back to demo data when GRID API fails.

## Non-Goals

- User accounts or authentication
- Database or persistent storage
- Multi-team comparison
- ML/AI predictions
- Mobile app (web-responsive only)
- Complex filtering or advanced features

## User Flow

### Happy Path
1. User lands on page
2. User types team name in search field (calls `/api/teams` with debounce)
3. User selects team from dropdown
4. User clicks "Generate Report"
5. App calls `/api/scout` with teamId
6. Report renders with "LIVE" badge
7. User clicks "Copy" or "Download" to export markdown

### Failure Path (Demo Fallback)
1. User generates report
2. `/api/scout` fails (non-2xx OR `success:false` OR timeout>5s OR missing key)
3. Client automatically fetches `/demo-data.json`
4. Report renders with "DEMO MODE" badge
5. User can still export markdown

## Routes and Endpoints

### GET /api/teams
**Query params:**
- `q` (string): Search query for team name
- `limit` (number, optional, default 10): Max teams to return

**Response (200):**
```json
{
  "success": true,
  "source": "GRID",
  "teams": [
    { "id": "80", "name": "Cloud9" },
    { "id": "123", "name": "Team Liquid" }
  ]
}
```

**Error Response (503/502):**
```json
{
  "success": false,
  "code": "MISSING_API_KEY" | "GRID_FETCH_FAILED",
  "error": "Error message",
  "teams": []
}
```

**Empty query:** Returns `{ "success": true, "source": "GRID", "teams": [] }` (no API call)

### POST /api/scout
**Request body:**
```json
{
  "teamId": "80",
  "game": "lol",
  "daysBack": 30,
  "maxSeries": 8
}
```

**Response (200):**
```json
{
  "success": true,
  "source": "GRID",
  "data": { /* TeamReport object */ }
}
```

**Error Response (400/502/503/504):**
```json
{
  "success": false,
  "code": "TEAM_NOT_FOUND" | "GRID_FETCH_FAILED" | "MISSING_API_KEY" | "NO_SERIES_FOUND" | "PARSE_FAILED",
  "error": "Error message"
}
```

## Data Contracts

### TeamReport
```typescript
{
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
```

### Demo Data Structure
File: `public/demo-data.json`
```json
{
  "teams": {
    "Cloud9": { /* TeamReport object */ },
    "Sentinels": { /* TeamReport object */ }
  }
}
```

Client fetches via `fetch('/demo-data.json')` and extracts team data by teamName.

## Demo Mode Spec

**Trigger conditions (any of):**
- `/api/scout` returns non-2xx status
- `/api/scout` returns `{ "success": false }`
- `/api/scout` timeout > 5 seconds (client-side)
- `GRID_API_KEY` missing (API returns `MISSING_API_KEY`)

**Fallback flow:**
1. Client detects failure (catch error or check `success:false`)
2. Client fetches `fetch('/demo-data.json')`
3. Client extracts team data (use first team or match by name if available)
4. Client renders report with `source: "Demo Mode"`
5. Badge shows "DEMO MODE" instead of "LIVE"

## Export Spec

**Copy Markdown:**
- Button: "Copy as Markdown"
- Copies full report markdown to clipboard
- Shows inline status message "Copied!" (no external toast library)

**Download Markdown:**
- Button: "Download Markdown"
- Creates blob and downloads file
- Filename: `prep_page_{teamName}_{YYYY-MM-DD}.md`

## Setup

### Environment Variables
`.env.example`:
```
GRID_API_KEY=your_key_here
```

**Rules:**
- Server-only: Use `GRID_API_KEY` (never `NEXT_PUBLIC_GRID_API_KEY`)
- Optional: Demo works without env vars
- Route Handlers only: All GRID calls in `src/app/api/*/route.ts`

### Demo Fallback
- Demo works without `GRID_API_KEY`
- Demo data at `public/demo-data.json`
- Fetch via `fetch('/demo-data.json')` (public assets served from root)

## Acceptance Criteria

- [ ] Landing page renders with hero + CTA + "How it works"
- [ ] Team search calls `/api/teams` with debounce (250ms)
- [ ] Team search dropdown supports keyboard navigation (Arrow keys, Enter, Escape)
- [ ] Empty search query does NOT call API (returns empty array immediately)
- [ ] Report generation calls `/api/scout` with teamId
- [ ] Demo fallback triggers on API failure/timeout/missing key
- [ ] Demo fallback fetches `/demo-data.json` and renders with "DEMO MODE" badge
- [ ] Report shows "LIVE" badge when source is "GRID"
- [ ] Report shows "DEMO MODE" badge when source is "Demo Mode"
- [ ] Copy markdown button copies to clipboard and shows status message
- [ ] Download markdown button downloads `.md` file
- [ ] All UI uses Tailwind only (no shadcn/ui, no anime.js, no sonner)
- [ ] `/api/teams` returns empty array for empty `q` query param
- [ ] `/api/scout` timeout is 5 seconds (client-side, triggers demo fallback)
- [ ] App works without `GRID_API_KEY` (demo mode always available)

## Forbidden Patterns

**Must NOT appear in code:**
- `NEXT_PUBLIC_GRID_API_KEY` - Use `GRID_API_KEY` only (server-side)
- `pages/api` - Use `src/app/api/*/route.ts` only (App Router Route Handlers)
- `fetch('public/demo-data.json')` - Use `fetch('/demo-data.json')` only
- `import demoData from 'public/demo-data.json'` - Use `fetch()` in client components
- `animejs` - No animation library, use CSS transitions only
- `@radix-ui/*` - No Radix components, use native HTML + Tailwind
- `sonner` - No toast library, use inline status messages
- `lucide-react` - No icon library, use Unicode symbols or inline SVG if needed
- `shadcn/ui` components - Replace with native HTML + Tailwind classes