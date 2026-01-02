# Prep Page – PRD
## Automated Scouting Report Generator for Sky's the Limit Hackathon

**Category:** Category 2: Automated Scouting Report Generator  
**Product Name:** Prep Page  
**Tagline:** "Know your opponent in 30 seconds."  
**Alternative Taglines:**
- "Scouting intel, instantly."
- "One click. One opponent. One report."
- "From data to strategy in a breath."

---

## 1. Executive Summary

Prep Page is a zero-login, web-based scouting report generator that transforms official GRID match data (League of Legends, Valorant) into actionable tactical intelligence in under 30 seconds. Users input an opponent team name, the app fetches historical match statistics from GRID, and returns a concise, evidence-backed report highlighting team strategies, player tendencies, and meta decisions (champion compositions for LoL; default site setups for Valorant). No accounts, no databases, no complexity—just landing page > scouting engine > report export. Demo Mode (local JSON) ensures the app works offline and independent of GRID availability. Built with Next.js, Tailwind, shadcn/ui, and anime.js micro-interactions. Deployable in minutes; judges can run locally or use hosted Vercel link.

---

## 2. Problem Statement & Target Users

### Problem
Competitive esports teams spend hours manually scouting opponents by reviewing VODs, patch notes, and scattered statistics. This is slow, labor-intensive, and prone to human bias. Tactical preparation requires rapid, data-driven insights into opponent patterns—which GRID data already contains, but is never synthesized into a ready-to-use report.

### Target Users
- **Primary:** Esports team coaches and players (LoL/Valorant) preparing for scrims or tournament matches.
- **Secondary:** Content creators, analysts, and casual competitive players who want quick opponent summaries.

### Why Now
GRID provides the richest official match database for LoL and Valorant. This MVP proves that raw data can be transformed into immediate, tactical value via a stateless web app—no gatekeeping, no credentials, no friction.

---

## 3. User Stories

1. **Scout an opponent quickly**  
   *As a* coach preparing for a match tomorrow,  
   *I want to* enter an opponent team name and instantly see their key patterns,  
   *so that* I can brief my players in under 5 minutes without combing through VODs.

2. **Understand why patterns matter**  
   *As a* player skeptical of scouting reports,  
   *I want to* see concrete evidence (match counts, percentages, recent dates) backing each insight,  
   *so that* I trust the report and adjust my preparation accordingly.

3. **Know your players' tendencies**  
   *As a* support player,  
   *I want to* see the enemy support's top champions and playstyle metrics,  
   *so that* I can counter-pick or mentally prepare for their signature plays.

4. **Get a report even if GRID is slow**  
   *As a* user in a time crunch,  
   *I want* the app to fall back to a demo dataset if GRID times out,  
   *so that* I still get a report (labeled as demo) and can work offline.

5. **Export the report for sharing**  
   *As a* coach,  
   *I want to* copy the scouting report as markdown or download it,  
   *so that* I can paste it into a team doc or Slack channel.

6. **Land on a clear value prop**  
   *As a* first-time visitor,  
   *I want to* immediately understand what this app does and click a CTA,  
   *so that* I'm not confused and go straight to scouting.

7. **See the app work with a realistic example**  
   *As a* judge evaluating the hackathon submission,  
   *I want to* load the app and generate a scouting report without auth or friction,  
   *so that* I can verify the core feature works in under 30 seconds.

8. **Inspect the code and run it locally**  
   *As a* judge or potential contributor,  
   *I want* clear README instructions, an MIT license, and working setup steps,  
   *so that* I can clone, install, and run the project on my machine in 5 minutes.

---

## 4. Success Metrics (MVP-Level)

1. **Core Feature Works:** Report generation completes in ≤5 seconds for a live GRID query; ≤1 second for demo mode.
2. **Fallback Reliability:** If GRID fails, demo mode activates automatically and is labeled clearly as "Demo Data."
3. **Evidence Clarity:** Every team tendency has at least 1 metric (e.g., "67% first-pick Ahri in last 30 days"); player tendency includes 2+ metrics.
4. **UX Fluency:** Landing page to report takes ≤ 3 clicks; scroll/CTA animation is smooth and non-obstructive.
5. **Demo Viability:** Judges can run `npm install && npm run dev` and see a full report in under 2 minutes without env vars (demo mode works out-of-box).
6. **Export Quality:** Markdown export is readable, pasteable, and includes all report sections.
7. **Repo Quality:** MIT license is prominent on README; setup instructions are clear and tested; video demo is ≤3 minutes and shows the full flow.

---

## 5. Scope: Must-Have vs. Nice-to-Have

### MUST-HAVE (MVP Scope)
- [x] Landing page with hero, one-line value prop, "How it works" (3 bullets), and CTA button.
- [x] Single scouting input (opponent team name as text field or dropdown).
- [x] Report generation from GRID OR demo fallback.
- [x] Report sections: snapshot, 3–5 team tendencies, 2+ player tendencies, comps/site setups, evidence table.
- [x] Markdown export (copy or download).
- [x] Anime.js micro-interactions: hero entrance, CTA hover/press, smooth scroll to scout section, report reveal.
- [x] Serverless API route protecting GRID API key.
- [x] Demo Mode JSON (local, realistic data).
- [x] Error state handling (GRID fails → demo mode + label).
- [x] Public GitHub repo with MIT license, clear README, setup instructions.
- [x] ~3 minute demo video showing landing → input → report → export.
- [x] Deployment on Vercel or equivalent (free tier, no credits required for judges).

### NICE-TO-HAVE (Post-MVP, Out of Scope)
- [ ] Compare two teams side-by-side.
- [ ] Advanced filters (date range, patch version, role-specific tendencies).
- [ ] Caching layer or Redis for repeated queries.
- [ ] Multi-game support (DOTA 2, CS:GO, etc.).
- [ ] User accounts or saved reports.
- [ ] Real-time match streaming or live data ingestion.
- [ ] Predictive modeling or AI-powered recommendations.
- [ ] Admin dashboard or analytics.

---

## 6. UX Specification

### Information Architecture
**Single-page app with two logical sections (route structure: Option A preferred)**

**Option A (Preferred):** Single route `/` with two sections and smooth scroll-down CTA.
- **Section 1:** Landing Hero (viewport height 100vh or 80vh)
- **Section 2:** Scouting Engine (viewport height 100vh+, scrolls into view)

**Option B (Fallback):** Two routes `/` (landing) and `/scout` (scouting engine), with CTA linking via `<Link>` or smooth scroll.  
*Choose Option A for minimal complexity.*

---

### Landing Hero Section
**Components:**
- App logo/name: "Prep Page" (large, bold, possibly gradient or accent color).
- One-line value prop: "Know your opponent in 30 seconds." (center-aligned, max 50px font on desktop).
- "How it works" (3 bullets max, left-aligned or centered, 16px font):
  1. "Enter an opponent team."
  2. "We fetch their GRID match history."
  3. "You get a tactical scouting report instantly."
- Single CTA button: "Start Scouting" (rounded, primary color, anime.js hover-scale and press-pulse on click).
- Background: subtle gradient or hero image (no autoplay video; must be lightweight).
- Micro-interactions (anime.js):
  - Hero text fades in and slides down on load (200ms).
  - CTA button has hover scale (1.05x) and subtle glow (box-shadow pulse).
  - On CTA click: button press animation (scale 0.95, 50ms) + smooth scroll to scouting section (easing: easeInOutQuad, 600ms).

---

### Scouting Engine Section
**Components:**
- **Input card:**
  - Text field label: "Opponent Team Name" (e.g., "Cloud9", "Sentinels").
  - Text input (shadcn/ui input component).
  - Submit button: "Generate Report" (primary color, disabled while loading).
  - Optional: small dropdown of common team names (autocomplete nice-to-have; text-only is MVP).
  - Micro-interaction: button press animation on submit.

- **State: Loading**
  - Spinner or skeleton card (shadcn/ui skeleton).
  - Text: "Analyzing opponent patterns..." or similar.
  - Duration: show for ≥1 second (do not flash).

- **State: Error**
  - Error message (e.g., "GRID unavailable. Showing demo data instead.").
  - "Retry" button.
  - Report still renders below error (with "Demo Mode" badge in snapshot).

- **State: Success (Report Rendered)**
  - Micro-interaction: report container fades and slides up on reveal (anime.js, 300ms).
  - Report structure (see below).
  - Export buttons below report.

---

### Report Layout

**Report Container:** shadcn/ui Card or custom bordered div, max-width 800px, light background (white or gray-50 in light mode; dark in dark mode).

**Sections (in order):**

1. **Snapshot (metadata)**
   - Team name, region, sample size (e.g., "15 matches"), date range (e.g., "Last 30 days"), data source (e.g., "GRID" or "Demo Mode").
   - Simple layout: 2-3 rows of key-value pairs.

2. **Team Tendencies (3–5 insights)**
   - Each as a card or collapsible section.
   - Format: **Insight title** (e.g., "Heavy on first-pick Ahri") + **Evidence** (e.g., "67% of games, past 30 days").
   - Icon or badge (e.g., ★ for high confidence).
   - Concise prose, max 2 sentences.

3. **Player Tendencies (2+ players)**
   - Table or stacked card layout.
   - Columns/fields: Player name, role, top 2 champions, win rate on those champs, play frequency.
   - Example:
     ```
     | Player   | Role    | Top Champs      | Win Rate | Frequency |
     |-----------|---------|-----------------|----------|-----------|
     | Fudge     | Top     | Jayce, Ornn     | 62%, 55% | 42%, 38%  |
     | Blaber    | Jungle  | Lee Sin, Wukong | 58%, 54% | 50%, 35%  |
     ```

4. **Comps / Site Setups (game-dependent)**
   - **Valorant:** "Default site setups: 60% Split-A executes, 40% Mid-control stalls. Frequent agent combo: Omen + Sova."
   - **LoL:** "Most common compositions: 68% Bruiser-ADC (last 14 days), 45% Poke-Control, 35% Engage (when behind)."
   - Simple bullet list or 2–3 rows.

5. **Evidence Table (optional collapsible)**
   - Backup data: raw match counts, percentages, date ranges.
   - Minimal table: 10–20 rows max, 3–4 columns (metric, value, sample size, date).
   - Collapsed by default (show "View Evidence" toggle).

---

### Export & Action Buttons
Below the report:
- **"Copy as Markdown"** button: copies entire report to clipboard; toast notification "Copied!" (shadcn/ui Toast).
- **"Download Markdown"** button: triggers download of `.md` file named `prep_page_[teamname]_[date].md`.

---

### Responsive Design
- **Mobile (< 640px):** Single column, input field full-width, report card full-width, larger touch targets (44px min).
- **Tablet & Desktop (≥ 640px):** Hero section centered, report card max-width 800px, input field 60% width.
- **Dark mode:** Support via Tailwind `dark:` utilities; prefer `prefers-color-scheme` + manual toggle (optional; light mode only for MVP if time-constrained).

---

## 7. Data Specification

### GRID Data Conceptually (Do Not Invent Endpoints)
Prep Page assumes GRID exposes (via public API or data endpoint) the following *concepts*:
- **Match history for a team:** List of recent matches with outcome, opponent, date, patch.
- **Champion/agent selection:** For each match, team's selections and bans.
- **Player stats:** Per-player performance (KDA, gold, etc.) per match.
- **Meta snapshots:** Patch-level composition frequencies, agent win rates, site pick rates (Valorant).

**MVP will use conceptual GRID queries; actual endpoint URLs depend on GRID's public API documentation (assumed available during hackathon or provided via SDK).**

---

### Demo Mode Dataset (Local JSON)

**File:** `public/demo-data.json` (checked into repo; not gitignored).

**Structure Example:**
```json
{
  "teams": {
    "Cloud9": {
      "region": "NA",
      "lastUpdated": "2026-01-01",
      "sampleSize": 15,
      "dateRange": "Last 30 days",
      "tendencies": [
        {
          "title": "Heavy on first-pick Ahri",
          "evidence": "67% of games in last 30 days",
          "confidence": "high"
        }
      ],
      "players": [
        {
          "name": "Fudge",
          "role": "Top",
          "champions": [
            { "name": "Jayce", "winRate": 0.62, "frequency": 0.42 },
            { "name": "Ornn", "winRate": 0.55, "frequency": 0.38 }
          ]
        }
      ],
      "compositions": [
        { "comp": "Bruiser-ADC", "frequency": 0.68, "description": "Heavy scaling" }
      ],
      "evidence": [
        { "metric": "Ahri first-picks", "value": "10/15 games", "sampleSize": "15 matches" }
      ]
    }
  }
}
```

**Usage:** On the frontend, if `fetch()` to the API route times out or returns 5xx, immediately load demo JSON via `import` or `fetch('public/demo-data.json')` and render with a "Demo Mode" badge in the snapshot.

---

### Serverless API Route (Next.js)

**Route:** `pages/api/scout.ts` (or `app/api/scout/route.ts` if using App Router).

**Purpose:** Protect the GRID API key; proxy requests from frontend to GRID.

**Spec:**
- **Method:** POST
- **Request body:**
  ```json
  {
    "teamName": "Cloud9",
    "game": "lol" // or "valorant"
  }
  ```
- **Response:** 
  ```json
  {
    "success": true,
    "data": { /* report object matching demo JSON structure */ },
    "source": "GRID"
  }
  ```
- **Error handling:**
  - Timeout (>5 seconds): return `{ "success": false, "error": "timeout" }`.
  - Rate limit (429): return `{ "success": false, "error": "rate_limit" }`.
  - Invalid team: return `{ "success": false, "error": "team_not_found" }`.
  - Frontend receives error → shows toast + falls back to demo mode.

**Environment Variable:** `GRID_API_KEY` (secret, server-side only). Store in `.env.local` and never expose via `NEXT_PUBLIC_`.

---

## 8. Technical Architecture & Constraints

### Frontend Stack
- **Framework:** Next.js (TypeScript)
- **Styling:** Tailwind CSS
- **Component Library:** shadcn/ui (Button, Card, Input, Toast, Skeleton, Table)
- **Animations:** anime.js (lightweight, for micro-interactions only; NOT for page transitions)
- **State Management:** React hooks (useState, useEffect); no Redux/Zustand/Context for MVP.
- **HTTP client:** native `fetch()` (no axios for MVP).

### Backend Stack
- **API:** Next.js API route (serverless, single endpoint)
- **Database:** None (stateless)
- **Caching:** None (stateless)
- **Auth:** None (public)
- **Third-party integrations:** GRID API (read-only)

### Deployment
- **Platform:** Vercel (free tier, no credits needed for judges)
- **Environment variables:**
  - `GRID_API_KEY` (server-side only)
  - Judges provided with these via `.env.example` in repo or via Vercel project setup link (password-protected is OK if provided in submission notes; not ideal for judges but acceptable if necessary)
- **Build:** `next build` → `next start`
- **Local dev:** `npm install && npm run dev` → `http://localhost:3000`

### Hard Constraints
- **No database:** Stateless only.
- **No persistent user data:** No accounts, no cookies beyond session-level.
- **No auth:** Public app.
- **API key protection:** GRID key only in `.env.local` (local dev) or Vercel environment (production); never in browser bundle.
- **Demo mode fallback:** Fully functional without GRID (uses local JSON).
- **File size:** Aim for <5MB total JS bundle (anime.js + shadcn/ui are small).
- **Build tools:** Next.js (includes webpack/turbopack); no manual webpack config unless unavoidable.

---

## 9. Implementation Notes (Workflow & Tools)

### JetBrains IDE + Junie
- **IDE:** IntelliJ IDEA Community (free) or WebStorm (if subscription available).
- **Junie:** LLM-powered assistant within JetBrains; use for code generation, PR reviews, and debugging (mention in README under "Tools used").

### Recommended folder structure:
```
prep-page/
├── public/
│   ├── demo-data.json
│   └── favicon.ico
├── pages/
│   ├── _app.tsx
│   ├── index.tsx          # Landing + Scouting (single-page)
│   └── api/
│       └── scout.ts       # API route
├── components/
│   ├── LandingHero.tsx
│   ├── ScoutingEngine.tsx
│   ├── Report.tsx
│   └── ui/                # shadcn/ui components (auto-generated)
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   └── utils.ts           # Helper functions
├── styles/
│   └── globals.css        # Tailwind globals
├── .env.local             # (gitignored)
├── .env.example           # Template for judges
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── README.md
├── LICENSE                # MIT
└── .github/
    └── workflows/
        └── ci.yml         # Optional: linting on PR
```

---

## 10. Demo Plan (~3 Minutes)

### Video Script (Tight; 180 seconds max)

**Intro (0–15 seconds):**
- Camera on app landing page (Prep Page hero visible).
- Narration: "This is Prep Page—a scouting report generator for esports. In 30 seconds, we'll go from landing page to a full opponent analysis."

**Landing Page (15–30 seconds):**
- Show hero section: "Prep Page" title, value prop, "How it works" bullets, "Start Scouting" CTA.
- Highlight anime.js micro-interactions: CTA hover scale, press animation.
- Click CTA.
- Narration: "The app has a clean landing page with a single CTA. Clicking it scrolls to the scouting engine below."

**Scouting Input (30–50 seconds):**
- Input field comes into view (scrolled down).
- Type opponent team name (e.g., "Cloud9").
- Show any autocomplete or dropdown (if available).
- Click "Generate Report" button.
- Narration: "Enter an opponent team name and click Generate. The app fetches their recent match data from GRID."

**Report Generation (50–100 seconds):**
- Loading state visible briefly (spinner, 2–3 seconds).
- Report appears with fade-in animation.
- Scroll through report sections:
  - Snapshot (team, region, sample size).
  - Team tendencies (3 key insights with evidence).
  - Player tendencies (table of player data).
  - Comps/site setups (game-specific summary).
  - Evidence table (collapse/expand toggle).
- Narration: "Here's the report. We surface team tendencies backed by real statistics—composition preferences, player tendencies, and a detailed evidence table. All generated in under 5 seconds."

**Export (100–120 seconds):**
- Scroll to report buttons.
- Click "Copy as Markdown."
- Show toast notification "Copied!".
- Show "Download Markdown" button (optional demo, or mention it).
- Narration: "The report can be copied as markdown or downloaded, so you can paste it into your team docs instantly."

**Demo Mode Fallback (120–150 seconds, ONLY if time allows; otherwise cut):**
- (Optional: show fallback gracefully by simulating GRID timeout or showing error state, then report renders with "Demo Mode" badge.)
- Narration: "If GRID is unavailable, the app automatically falls back to demo data, ensuring you always get a report."

**Closing (150–180 seconds):**
- Back to top of app.
- Show GitHub repo link (in README or footer).
- Narration: "Prep Page is open-source, MIT-licensed, and runs anywhere. Judges can clone it, run `npm install`, and try it locally in minutes. Code and instructions are in the repo."
- End card: "Prep Page by [Team Name] — Sky's the Limit Hackathon, Category 2."

---

## 11. Repository & Submission Checklist

### Deliverables (All must be in public GitHub repo)

#### 📁 Code & Assets
- [ ] **All source code:** Next.js app with TypeScript, no secrets in committed code.
- [ ] **Demo data:** `public/demo-data.json` (realistic, shows report structure).
- [ ] **Environment template:** `.env.example` with `GRID_API_KEY` placeholder.
- [ ] **Public assets:** favicon, logo (if any), minimal branding.

#### 📋 Documentation
- [ ] **README.md** (400–600 words, covers):
  - **What:** One-liner + problem/solution.
  - **Quick start:** `npm install && npm run dev` → `http://localhost:3000`.
  - **Features:** List (landing page, single-team scout, demo fallback, export).
  - **Architecture:** Frontend (Next.js + Tailwind + shadcn + anime.js), backend (API route), demo mode.
  - **Environment setup:** How to get GRID API key and set `GRID_API_KEY` in `.env.local`.
  - **Testing:** "Load app, enter 'Cloud9', click Generate, report should appear in <5 seconds. If GRID times out, demo mode will show."
  - **Tools used:** JetBrains WebStorm/IntelliJ IDEA, Junie assistant, Next.js, Tailwind, shadcn/ui, anime.js, GRID API.
  - **Judges/Contributors:** Clear steps to run locally; no signup required.
  - **License:** "Licensed under MIT (see LICENSE file)."

- [ ] **SETUP.md or troubleshooting (optional but recommended):**
  - Minimum Node version.
  - Known issues (e.g., "GRID API requires VPN in some regions").
  - How to replace demo data with custom data.

- [ ] **CODE_OF_CONDUCT.md (optional; quick template is fine for MVP).**

#### ⚖️ Legal
- [ ] **LICENSE file (MIT):** Standard MIT boilerplate, with `[Year]` and `[Your Name/Team]` filled in.
  ```
  MIT License

  Copyright (c) 2026 [Team Name]

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  ...
  ```
- [ ] **License visibility:** MIT file listed in repo root (GitHub auto-detects and shows on main page).

#### 🎥 Demo Video
- [ ] **Video file or link:** Upload to YouTube (unlisted or public), Vimeo, or Facebook Video.
  - Duration: 2–3 minutes (strict).
  - Quality: 720p minimum.
  - Audio: Clear narration; no background music required (but OK if non-intrusive).
  - Content: Landing → input → report generation → export + demo mode (optional fallback).
  - Link: Provide in submission form or repo README.

#### 🚀 Deployment
- [ ] **Hosted instance:** Vercel, Netlify, or equivalent (free tier).
  - URL: Judges can visit and test without local setup.
  - No login required.
  - Works with demo data out-of-box; optional GRID integration.

#### 📝 Testing & Validation
- [ ] **Local testing checklist (in README or separate TESTING.md):**
  ```
  1. Clone repo: `git clone <repo>`
  2. Install: `npm install`
  3. Setup env: `cp .env.example .env.local` and add GRID_API_KEY (optional; demo works without it)
  4. Run: `npm run dev`
  5. Open: `http://localhost:3000`
  6. Test landing page and CTA
  7. Enter opponent team (use demo team if GRID unavailable)
  8. Verify report generates
  9. Test export buttons
  10. Expected: Full flow in <2 minutes; no errors
  ```

#### 🏷️ Submission Metadata
- [ ] **Repo README includes:**
  - Category: "Category 2: Automated Scouting Report Generator"
  - Hackathon: "Sky's the Limit (Cloud9 × JetBrains)"
  - Product name: "Prep Page"
  - Demo video link (YouTube/Vimeo URL)
  - Hosted app URL (Vercel or similar)
  - Setup time estimate: "5 minutes local setup; 30 seconds to demo"

---

## 12. Naming & Branding

### Product Name
**Prep Page** ✓ (locked in)
- Short, actionable, no hyphen or special chars.
- Easy to remember and Google.
- Domain availability: preppage.dev or similar likely available; optional for MVP.

### Primary Tagline
**"Know your opponent in 30 seconds."**
- Emphasizes speed and simplicity.
- Matches MVP scope (single report, no complex features).

### Alternate Taglines (Nice-to-Have Branding)
1. **"Scouting intel, instantly."**  
   Focus: speed and on-demand.
2. **"One click. One opponent. One report."**  
   Focus: simplicity and singular purpose.
3. **"From data to strategy in a breath."**  
   Focus: elegance, minimalism, actionability.

### Visual Identity (Optional; MVP can skip if time-constrained)
- **Color:** Teal, blue, or purple (esports-friendly, high-contrast).
- **Font:** Open Sans or Inter (simple, clean, accessible).
- **Logo:** Minimal (e.g., stylized "P" or clipboard icon + "Prep Page" logotype).

---

## 13. Non-Goals (Explicitly Out of Scope)

❌ **Accounts & Authentication**  
❌ **User profiles or saved reports**  
❌ **Persistent database (Postgres, MongoDB, etc.)**  
❌ **Caching layers, queues, or message brokers**  
❌ **ML/AI-powered predictions or ML feature engineering**  
❌ **Multi-team comparison dashboards**  
❌ **Admin panels or analytics engines**  
❌ **Real-time live match streaming**  
❌ **Patch-specific deep dives or complex filtering**  
❌ **Multi-language support**  
❌ **Mobile-specific app (web-responsive is sufficient)**  

---

## 14. Launch Readiness Checklist (Hackathon Submission)

- [ ] **Code repo is PUBLIC** (not private).
- [ ] **MIT license is VISIBLE** on GitHub (LICENSE file in root; auto-detected).
- [ ] **README is complete** (setup, features, architecture, judging notes).
- [ ] **Demo video is UPLOADED** (YouTube/Vimeo, ≤3 min, unlisted or public link provided).
- [ ] **Hosted instance is LIVE** (Vercel or equivalent, judges can test immediately).
- [ ] **Local setup TESTED** (`npm install && npm run dev` works for judge).
- [ ] **Demo Mode WORKS** without GRID API key (JSON loads, report renders).
- [ ] **No secrets in code** (API keys in `.env.example`, not committed).
- [ ] **Category is SPECIFIED** (Category 2 in README or submission form).
- [ ] **JetBrains tooling is MENTIONED** (IDE + Junie in README "Tools Used" section).
- [ ] **All features DEMO properly** (landing, input, report, export, error handling, demo fallback).
- [ ] **Submission is COMPLETE** (repo link, video link, hosted URL, README, all files present).

---

## 15. Success Definition

**MVP is complete and ready for judging when:**

1. **Core feature works:** User enters opponent team → report generates in <5 seconds with team tendencies, player tendencies, and evidence.
2. **Landing UX flows:** Hero page + CTA → smooth scroll/navigation to scouting section; no friction.
3. **Animations are tasteful:** anime.js micro-interactions are visible (hero entrance, button hover, report reveal) but non-blocking and smooth.
4. **Fallback is robust:** GRID timeout → demo mode activates silently with badge; no broken state.
5. **Export works:** "Copy as Markdown" and "Download Markdown" buttons both function; markdown is readable and pasteable.
6. **Repo is auditable:** Judges can clone, run in 5 minutes, and test; MIT license and README are clear.
7. **Demo video is tight:** ≤3 minutes, shows all above features, judges see the app work end-to-end.
8. **Deployment is zero-friction:** Judges can visit hosted URL or `npm run dev` without signup, VPN, or credentials (demo mode works out-of-box).

**If all 8 are true, MVP is DONE. Ship it.**

---

## 16. Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| GRID API is slow/unavailable during demo | High | Demo Mode JSON as primary fallback; test with simulated 5s timeout. |
| Judges can't get GRID API key in time | Medium | `.env.example` shows optional setup; demo mode works without it; clearly document. |
| anime.js causes performance issues | Low | Use only 3–4 lightweight micro-interactions (hero entrance, CTA press, report reveal); test on low-end devices. |
| Report doesn't fit in viewport on mobile | Medium | Test responsive design; report card max-width 95vw, scrollable. |
| Markdown export has formatting issues | Low | Test copy-to-clipboard and download; validate markdown syntax. |
| Video exceeds 3 minutes | Low | Script tightly; cut demo-mode section if time-constrained (demo mode is fallback, not primary demo). |
| Judges miss MIT license | Low | Put LICENSE in repo root; mention in README; GitHub auto-detects. |

---

## 17. Questions for Clarification (Pre-Build)

1. **GRID API:** Does the hackathon provide API docs or an SDK? Is API key public or secret?
2. **Game focus:** MVP covers LoL and Valorant; which is primary for demo?
3. **Team data:** Should demo JSON include 5+ teams or just 2–3 examples?
4. **Hosting:** Can Vercel be used, or must it be a different platform?
5. **Credentials:** Should GRID API key be in `.env.local` or provided separately to judges?

---

**END OF PRD**

---

**Document Info**
- **Author:** [Your Team Name]
- **Date:** 2026-01-01
- **Status:** LOCKED FOR MVP BUILD
- **Next Step:** Develop → Test locally → Deploy to Vercel → Record demo video → Submit repo + video + deployment URL to hackathon platform.
