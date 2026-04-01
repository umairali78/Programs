# ContentCraft AI Engine — Setup Guide

## Prerequisites

Install the following before running the project:

```bash
# 1. Install Node.js (via Homebrew — recommended on macOS)
brew install node

# 2. Install Redis
brew install redis
brew services start redis
```

## First-Time Setup

### 1. Install dependencies
```bash
cd contentcraft
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — fill in DATABASE_URL, AI credentials, and NextAuth secret
# Minimum required for local dev:
# DATABASE_URL="file:./prisma/dev.db"
# OPENAI_API_KEY="sk-..."
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 3. Create the SQLite database and Prisma client
```bash
npm run db:push       # push schema to DB (dev)
npm run db:generate   # generate Prisma client
```

### 4. Seed the database (creates admin user)
```bash
npx prisma db seed
# Admin credentials: admin@contentcraft.app / Admin1234!
```

## Running the App

You need **two terminals** — one for Next.js, one for the BullMQ worker:

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — BullMQ worker (processes AI jobs)
npm run worker
```

Open http://localhost:3000 and log in with `admin@contentcraft.app` / `Admin1234!`

## First Steps After Login

1. **Upload Standards Guide** → Admin → Standards → Upload your General Standards Guide PDF/DOCX → wait ~2 min for embedding → Activate
2. **Upload Templates** → Admin → Templates → Upload .docx or .pdf template for each CO type → wait ~60s for parsing → Activate
3. **Set up Prompt Libraries** → Admin → Prompt Library → Edit master prompts for each content object type
4. **Create Users** → Admin → Users → Add instructional designers, writers, reviewers
5. **Generate Content** → New Generation → Enter SLO → Review Brief → Approve → View Scripts

## Local Storage

Uploaded templates and standards guides are stored on disk under `STORAGE_DIR` (defaults to `./storage` inside the app).

## AI Providers

- Default setup uses OpenAI with `AI_PROVIDER="openai"` and `OPENAI_API_KEY`.
- Anthropic is still supported with `AI_PROVIDER="anthropic"` and `ANTHROPIC_API_KEY`.
- Embeddings are independently configurable with `AI_EMBED_PROVIDER="openai" | "voyage" | "none"`.
- If no embedding provider is configured, the app falls back to zero vectors and keyword overlap for standards retrieval.

## Architecture Notes

- **Next.js** handles the web UI and API routes
- **BullMQ worker** (separate process) handles all AI jobs asynchronously
- **SSE** (`/api/runs/[id]/stream`) pushes generation progress to the browser in real time
- Standards guides and templates are stored on disk for local development
- All prompts are stored in the database — never hardcoded
