# Prep Page

**"Know your opponent in 30 seconds."**

Prep Page is a zero-login, web-based scouting report generator that transforms official GRID match data (League of Legends, Valorant) into actionable tactical intelligence in under 30 seconds.

## Features
- **Landing Hero**: Clear value proposition with smooth animations.
- **Scouting Engine**: Single-input field to fetch opponent data.
- **Automated Reports**: Instant generation of team tendencies, player metrics, and compositions.
- **Demo Mode**: Automatic fallback to local JSON data if GRID is unavailable.
- **Export**: Copy as Markdown or download for easy sharing in team docs.

## Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the app.

## Tools Used
- **JetBrains IDE**: Development environment.
- **Junie**: AI assistant for code generation and debugging.
- **Next.js**: React framework.
- **Tailwind CSS**: Styling.
- **shadcn/ui**: Component library.
- **anime.js**: Micro-interactions and animations.
- **GRID API**: Official esports data source.

## Environment Setup
To use live GRID data, create a `.env.local` file with your API key:
```env
GRID_API_KEY=your_key_here
```

### Important: Security
We use `GRID_API_KEY` (server-side) instead of `NEXT_PUBLIC_GRID_API_KEY`.
- **Local Development**: Set `GRID_API_KEY` in `.env.local`.
- **Production (Vercel)**: Set `GRID_API_KEY` in the Environment Variables section of your project settings for both Preview and Production environments. **Note:** Environment variable changes on Vercel only apply to NEW deployments. After updating variables, you must redeploy for changes to take effect.
- **Why?**: Variables prefixed with `NEXT_PUBLIC_*` are bundled client-side and exposed to the browser, making your API key public. Never use `NEXT_PUBLIC_*` for secrets. Using a server-side only variable ensures your secrets remain secure.

Demo mode works out-of-the-box if the key is missing or GRID fails.

## Architecture
- **Frontend**: Next.js App Router with TypeScript.
- **Backend**: Serverless API routes for secure GRID data fetching.
- **Data**: Static demo JSON for reliability.

## Testing
1. Load the app.
2. Enter "Cloud9" or "Sentinels" in the scouting engine.
3. Click "Generate Report".
4. Verify the report appears with detailed metrics and export options.

## License
Licensed under [MIT](LICENSE).
