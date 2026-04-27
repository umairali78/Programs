# Ten Strands — Climate Learning Exchange (Web)

Next.js web app version of the Ten Strands Climate Learning Exchange, converted from the original Electron desktop app for deployment on Vercel.

## Prerequisites

- Node.js 18+
- A [Turso](https://turso.tech) account (free tier works)
- An [Anthropic](https://console.anthropic.com) API key (optional — can also be set in-app via Settings)

## Local Development

1. **Clone and install**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
   ```

3. **Initialize the database**
   ```bash
   # After starting the dev server, hit this endpoint once to create all tables:
   curl -X POST http://localhost:3000/api/init
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

### 1. Create a Turso database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso

# Create a database
turso db create tenstrand

# Get the URL and auth token
turso db show tenstrand --url
turso db tokens create tenstrand
```

### 2. Deploy to Vercel

```bash
npx vercel
```

When prompted, set these environment variables in the Vercel dashboard (or via CLI):

| Variable | Description |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso auth token from step 1 |
| `ANTHROPIC_API_KEY` | (Optional) Claude API key |

### 3. Initialize the database

After the first deployment, visit:
```
https://your-app.vercel.app/api/init
```
(GET request — opens in the browser)

This creates all the database tables. You only need to do this once.

### 4. Configure the app

1. Open the deployed app → **Settings**
2. Set your Claude API key (if not set as an env var)
3. Go to **Admin** → **Import** to load partner/program/school data from CSV

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TURSO_DATABASE_URL` | Yes | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Yes (remote) | Turso auth token (not needed for local `file:` URL) |
| `ANTHROPIC_API_KEY` | No | Claude API key (can be set in Settings page instead) |

## Architecture

- **Frontend**: React + React Router SPA, rendered client-side via Next.js dynamic import
- **Backend**: Next.js API routes at `/api/[...slug]` — all original Electron IPC channels are mapped 1:1
- **Database**: Turso (LibSQL/SQLite-compatible), accessed via `@libsql/client` + Drizzle ORM
- **AI**: Anthropic Claude via `@anthropic-ai/sdk`
- **Maps**: Leaflet with dynamic import (SSR disabled)
