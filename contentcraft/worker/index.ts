/**
 * Standalone BullMQ worker process.
 * Run with: npm run worker
 * This must run separately from the Next.js server.
 */

import { startResearchBriefWorker } from '@/lib/queue/workers/research-brief.worker'
import { startContentGenerationWorker } from '@/lib/queue/workers/content-generation.worker'
import { startTemplateParseWorker } from '@/lib/queue/workers/template-parse.worker'
import { startStandardsEmbedWorker } from '@/lib/queue/workers/standards-embed.worker'
import { startImprovementProposalWorker } from '@/lib/queue/workers/improvement-proposal.worker'

async function main() {
  console.log('[Worker] Starting ContentCraft workers...')

  const workers = [
    startResearchBriefWorker(),
    startContentGenerationWorker(),
    startTemplateParseWorker(),
    startStandardsEmbedWorker(),
    startImprovementProposalWorker(),
  ]

  console.log(`[Worker] ${workers.length} workers started`)

  const shutdown = async () => {
    console.log('[Worker] Shutting down...')
    await Promise.all(workers.map((w) => w.close()))
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

main().catch((err) => {
  console.error('[Worker] Fatal error:', err)
  process.exit(1)
})
