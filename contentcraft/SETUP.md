# ContentCraft AI Engine — Setup Guide

## Prerequisites

Install the following before running the project:

```bash
# 1. Install Node.js (via Homebrew — recommended on macOS)
brew install node

# 2. Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# 3. Install Redis
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
# Edit .env — fill in DATABASE_URL, ANTHROPIC_API_KEY, S3_* credentials
# Minimum required for local dev:
# DATABASE_URL="postgresql://$(whoami)@localhost:5432/contentcraft"
# ANTHROPIC_API_KEY="sk-ant-..."
# NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

### 3. Create database
```bash
createdb contentcraft
```

### 4. Enable pgvector extension
```bash
psql contentcraft -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### 5. Run migrations & generate Prisma client
```bash
npm run db:push       # push schema to DB (dev)
npm run db:generate   # generate Prisma client
```

### 6. Seed the database (creates admin user)
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

## S3 Storage

For local development you can use **MinIO** as a local S3-compatible server:

```bash
brew install minio
minio server ~/minio-data --console-address ":9001"
# Console: http://localhost:9001 (minioadmin / minioadmin)
# Set in .env:
# S3_ENDPOINT="http://localhost:9000"
# S3_ACCESS_KEY_ID="minioadmin"
# S3_SECRET_ACCESS_KEY="minioadmin"
# S3_BUCKET="contentcraft"
# S3_REGION="us-east-1"
```

## Embeddings (Vector Search)

The app uses Voyage AI for embeddings (Anthropic's recommended partner):

1. Get a free API key at https://www.voyageai.com
2. Add to `.env`: `VOYAGE_API_KEY="pa-..."`

Without `VOYAGE_API_KEY`, the app falls back to zero vectors (vector search disabled) — generation still works but standards retrieval will return random chunks.

## Architecture Notes

- **Next.js** handles the web UI and API routes
- **BullMQ worker** (separate process) handles all AI jobs asynchronously
- **SSE** (`/api/runs/[id]/stream`) pushes generation progress to the browser in real time
- **pgvector** enables cosine similarity search over standards guide chunks
- All prompts are stored in the database — never hardcoded
