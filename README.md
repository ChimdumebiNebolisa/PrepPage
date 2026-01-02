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

## License

Licensed under [MIT](LICENSE).
