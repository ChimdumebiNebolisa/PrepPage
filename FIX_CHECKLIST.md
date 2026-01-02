# Fix Checklist - BLOCKER and HIGH Issues

This document provides the minimal set of code changes to remove all BLOCKER and HIGH severity issues identified in the audit.

## BLOCKER Issues

### 1. Demo Mode Fallback Missing

**File:** `src/components/ScoutingEngine.tsx`

**Current code (lines 146-150):**
```typescript
} catch (err) {
  setError("Network error. Please check your connection and try again.");
} finally {
  setLoading(false);
}
```

**Replace with:**
```typescript
} catch (err) {
  // Try demo fallback when GRID fails
  try {
    const demoResponse = await fetch('/demo-data.json');
    if (!demoResponse.ok) throw new Error('Demo data not found');

    const demoJson = await demoResponse.json();
    // Try to find team in demo data, fallback to Cloud9
    const teamKey = Object.keys(demoJson.teams).find(
      key => key.toLowerCase() === teamName.toLowerCase()
    ) || 'Cloud9';

    const teamData = demoJson.teams[teamKey];
    if (teamData) {
      // Transform demo JSON structure to TeamReport format
      const report: TeamReport = {
        teamName: teamData.teamName || teamKey,
        region: teamData.region || 'Unknown',
        lastUpdated: teamData.lastUpdated || new Date().toISOString().split('T')[0],
        sampleSize: teamData.sampleSize || 0,
        dateRange: teamData.dateRange || 'Last 30 days',
        tendencies: teamData.tendencies || [],
        players: teamData.players || [],
        compositions: teamData.compositions || [],
        evidence: teamData.evidence || [],
      };
      onReportGenerated(report, 'Demo Mode');
      return; // Success, don't show error
    }
  } catch (demoErr) {
    console.error('Demo fallback failed:', demoErr);
  }
  setError("Network error. Please check your connection and try again.");
} finally {
  setLoading(false);
}
```

**Also update error handling to attempt demo fallback:**
**Current code (lines 129-144):**
```typescript
} else {
  // Show explicit error based on code
  if (result.code === "MISSING_API_KEY") {
    setError("Live scouting failed: GRID API key not configured.");
  } else if (result.code === "GRID_FETCH_FAILED") {
    setError("Live scouting failed: GRID connection failed.");
  } else if (result.code === "TEAM_NOT_FOUND") {
    setError("Team not found in GRID database.");
  } else if (result.code === "NO_SERIES_FOUND") {
    setError("No recent series found for this team.");
  } else if (result.code === "PARSE_FAILED") {
    setError("Failed to parse match data. Please try again.");
  } else if (result.code === "SCOUT_NOT_IMPLEMENTED") {
    setError("Live scouting is not yet implemented.");
  } else {
    setError(result.error || "Live scouting failed. Please try again.");
  }
}
```

**Replace with:**
```typescript
} else {
  // Try demo fallback for GRID failures
  if (result.code === "GRID_FETCH_FAILED" ||
      result.code === "MISSING_API_KEY" ||
      result.code === "TEAM_NOT_FOUND" ||
      result.code === "NO_SERIES_FOUND") {
    try {
      const demoResponse = await fetch('/demo-data.json');
      if (!demoResponse.ok) throw new Error('Demo data not found');

      const demoJson = await demoResponse.json();
      const teamKey = Object.keys(demoJson.teams).find(
        key => key.toLowerCase() === teamName.toLowerCase()
      ) || 'Cloud9';

      const teamData = demoJson.teams[teamKey];
      if (teamData) {
        const report: TeamReport = {
          teamName: teamData.teamName || teamKey,
          region: teamData.region || 'Unknown',
          lastUpdated: teamData.lastUpdated || new Date().toISOString().split('T')[0],
          sampleSize: teamData.sampleSize || 0,
          dateRange: teamData.dateRange || 'Last 30 days',
          tendencies: teamData.tendencies || [],
          players: teamData.players || [],
          compositions: teamData.compositions || [],
          evidence: teamData.evidence || [],
        };
        onReportGenerated(report, 'Demo Mode');
        return; // Success, don't show error
      }
    } catch (demoErr) {
      console.error('Demo fallback failed:', demoErr);
    }
  }

  // Show explicit error only if demo fallback failed or error is not fallback-able
  if (result.code === "MISSING_API_KEY") {
    setError("Live scouting failed: GRID API key not configured. Demo mode unavailable.");
  } else if (result.code === "GRID_FETCH_FAILED") {
    setError("Live scouting failed: GRID connection failed. Demo mode unavailable.");
  } else if (result.code === "TEAM_NOT_FOUND") {
    setError("Team not found in GRID database.");
  } else if (result.code === "NO_SERIES_FOUND") {
    setError("No recent series found for this team.");
  } else if (result.code === "PARSE_FAILED") {
    setError("Failed to parse match data. Please try again.");
  } else if (result.code === "SCOUT_NOT_IMPLEMENTED") {
    setError("Live scouting is not yet implemented.");
  } else {
    setError(result.error || "Live scouting failed. Please try again.");
  }
}
```

**Add import at top of file:**
```typescript
import { TeamReport } from "@/lib/types";
```

---

### 2. Create .env.example File

**File:** `.env.example` (new file)

**Content:**
```
GRID_API_KEY=your_key_here
```

---

### 3. Update README to Match PRD

**File:** `README.md`

**Line 9 - Current:**
```
- **Scouting Engine**: Typeahead team search with real-time GRID data. Type to search teams - no demo data, only live GRID results.
```

**Replace with:**
```
- **Scouting Engine**: Typeahead team search with real-time GRID data. Automatically falls back to demo data if GRID is unavailable.
```

**Add new section after line 45 (after "All GRID API calls happen only in Route Handlers"):**

```markdown
## Demo Mode

If the GRID API is unavailable (timeout, network error, or missing API key), Prep Page automatically falls back to demo data from `public/demo-data.json`. Reports generated from demo data are clearly labeled with a "Demo Mode" badge in the report header.

Demo mode ensures the app works offline and independent of GRID availability, making it easy for judges to test the app without API credentials.
```

---

## HIGH Issues

### 4. Add Request Cancellation

**File:** `src/components/ScoutingEngine.tsx`

**Add at top of component (after state declarations, around line 36):**
```typescript
const abortControllerRef = useRef<AbortController | null>(null);
```

**Update the debounced search effect (lines 38-59):**
```typescript
// Debounced search
useEffect(() => {
  // Cancel previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }

  const fetchTeams = async (q: string) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`/api/teams?q=${encodeURIComponent(q)}&limit=10`, {
        signal: controller.signal,
      });
      const data: TeamsResponse = await response.json();
      if (data.success) {
        setTeams(data.teams);
      } else {
        setTeams([]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error("Failed to fetch teams:", err);
      setTeams([]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const timeoutId = setTimeout(() => {
    fetchTeams(searchQuery);
  }, 250);

  return () => {
    clearTimeout(timeoutId);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };
}, [searchQuery]);
```

**Update handleSubmit to use AbortController (around line 117):**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!teamName.trim() || !teamId) {
    setError("Please select a team from the dropdown.");
    return;
  }

  // Cancel any pending team search
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }

  setLoading(true);
  setError(null);

  const controller = new AbortController();

  try {
    const response = await fetch("/api/scout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, game: "lol" }),
      signal: controller.signal,
    });

    const result: ScoutResponse = await response.json();
    // ... rest of existing code ...
  } catch (err: any) {
    if (err.name === 'AbortError') {
      // Request was cancelled, don't show error
      return;
    }
    // ... existing demo fallback code ...
  } finally {
    setLoading(false);
  }
};
```

**Add cleanup on unmount (add useEffect at end of component):**
```typescript
useEffect(() => {
  return () => {
    // Cleanup: cancel any pending requests on unmount
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

---

### 5. Add Input Validation

**File:** `src/app/api/teams/route.ts`

**Add after line 8:**
```typescript
// Validate and sanitize search query
const sanitizedQuery = q.trim().slice(0, 100); // Max 100 chars
if (sanitizedQuery.length === 0 && q.trim().length > 0) {
  return NextResponse.json(
    {
      success: false,
      code: "INVALID_INPUT",
      error: "Search query too long or invalid",
      teams: [],
    },
    { status: 400 }
  );
}
```

**Update line 65 to use sanitizedQuery:**
```typescript
variables: {
  search: sanitizedQuery,
  first: limit,
},
```

**File:** `src/app/api/scout/route.ts`

**Add at top of file (after imports):**
```typescript
// Simple validation schema (can be replaced with Zod later)
function validateScoutRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  if (!body.teamId || typeof body.teamId !== 'string' || body.teamId.trim().length === 0) {
    return { valid: false, error: 'teamId is required and must be a non-empty string' };
  }
  if (body.game && typeof body.game !== 'string') {
    return { valid: false, error: 'game must be a string' };
  }
  if (body.daysBack && (typeof body.daysBack !== 'number' || body.daysBack < 1 || body.daysBack > 365)) {
    return { valid: false, error: 'daysBack must be between 1 and 365' };
  }
  if (body.maxSeries && (typeof body.maxSeries !== 'number' || body.maxSeries < 1 || body.maxSeries > 50)) {
    return { valid: false, error: 'maxSeries must be between 1 and 50' };
  }
  return { valid: true };
}
```

**Update POST function (after line 11):**
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const validation = validateScoutRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, code: "INVALID_INPUT", error: validation.error },
        { status: 400 }
      );
    }

    const { teamId, game = "lol", daysBack = 30, maxSeries = 8 } = body;
    // ... rest of existing code ...
```

---

### 6. Add ARIA Labels

**File:** `src/components/ScoutingEngine.tsx`

**Update Input component (line 166-189):**
```typescript
<Input
  ref={inputRef}
  type="text"
  value={searchQuery}
  onChange={(e) => {
    // ... existing onChange code ...
  }}
  onFocus={handleInputFocus}
  onBlur={(e) => {
    // ... existing onBlur code ...
  }}
  onKeyDown={handleKeyDown}
  placeholder="Start typing to search teams..."
  className="pl-10 h-12"
  disabled={loading}
  aria-label="Search for opponent team name"
  aria-autocomplete="list"
  aria-expanded={open}
  aria-controls="team-search-list"
  aria-activedescendant={highlightedIndex >= 0 ? `team-option-${highlightedIndex}` : undefined}
/>
```

**Update CommandItem (line 218-245):**
```typescript
{teams.map((team, index) => (
  <CommandItem
    key={team.id || team.name}
    value={team.name}
    onSelect={() => handleTeamSelect(team)}
    onMouseDown={(e) => {
      e.preventDefault();
    }}
    onClick={(e) => {
      e.preventDefault();
      handleTeamSelect(team);
    }}
    id={`team-option-${index}`}
    role="option"
    aria-selected={teamName === team.name}
    className={cn(
      "cursor-pointer",
      highlightedIndex === index && "bg-accent"
    )}
  >
    {/* ... existing content ... */}
  </CommandItem>
))}
```

**Update CommandList (line 213):**
```typescript
<CommandList ref={listRef} id="team-search-list" role="listbox">
```

**File:** `src/components/Report.tsx`

**Update collapsible button (line 161-169):**
```typescript
<Button
  variant="ghost"
  size="sm"
  onClick={() => setShowEvidence(!showEvidence)}
  className="w-full justify-between"
  aria-expanded={showEvidence}
  aria-controls="evidence-table"
>
  <span>{showEvidence ? "Hide Evidence" : "View Evidence"}</span>
  {showEvidence ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
</Button>
```

**Update evidence table container (line 171):**
```typescript
{showEvidence && (
  <div id="evidence-table" className="mt-4 rounded-md border" role="region" aria-label="Evidence table">
    {/* ... existing table ... */}
  </div>
)}
```

---

## Summary

**Files to create:**
1. `.env.example`

**Files to edit:**
1. `src/components/ScoutingEngine.tsx` - Demo fallback, request cancellation, ARIA labels
2. `src/app/api/teams/route.ts` - Input validation
3. `src/app/api/scout/route.ts` - Request validation
4. `src/components/Report.tsx` - ARIA labels
5. `README.md` - Update demo mode documentation

**Testing checklist:**
- [ ] Demo fallback works when GRID API fails
- [ ] Demo fallback works when API key is missing
- [ ] Request cancellation prevents race conditions
- [ ] Input validation rejects invalid requests
- [ ] ARIA labels improve screen reader experience
- [ ] `.env.example` file exists
- [ ] README accurately describes demo mode

