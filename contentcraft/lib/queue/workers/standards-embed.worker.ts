import { Worker, Job } from 'bullmq'
import { createRedisConnection, QUEUE_STANDARDS_EMBED, type StandardsEmbedJobData } from '../index'
import { prisma } from '@/lib/db/client'
import { ai } from '@/lib/ai/client'
import { readStoredFile } from '@/lib/storage/local'
import { stringifyJsonField } from '@/lib/utils/json'

// Chunk text into ~500-token segments (approx 400 words)
function chunkText(text: string, maxWords = 400): string[] {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20)
  const chunks: string[] = []
  let current = ''

  for (const para of paragraphs) {
    const words = (current + ' ' + para).split(/\s+/).length
    if (words > maxWords && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export function startStandardsEmbedWorker() {
  const worker = new Worker<StandardsEmbedJobData>(
    QUEUE_STANDARDS_EMBED,
    async (job: Job<StandardsEmbedJobData>) => {
      const { standardsGuideId, storagePath } = job.data

      const fileBuffer = await readStoredFile(storagePath)
      const guide = await prisma.standardsGuide.findUnique({ where: { id: standardsGuideId } })
      if (!guide) throw new Error(`Standards guide ${standardsGuideId} not found`)

      let text: string
      if (guide.fileName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        text = result.value
      } else {
        const pdfParse = (await import('pdf-parse')).default
        const result = await pdfParse(fileBuffer)
        text = result.text
      }

      const chunks = chunkText(text)

      // Delete old chunks for this guide version
      await prisma.standardsChunk.deleteMany({ where: { standardsGuideId } })

      // Embed and store each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await ai.embed(chunk)
        await prisma.standardsChunk.create({
          data: {
            standardsGuideId,
            content: chunk,
            embedding: stringifyJsonField(embedding),
            chunkIndex: i,
            tags: stringifyJsonField({}),
          },
        })

        // Progress update every 10 chunks
        if (i % 10 === 0) {
          await job.updateProgress(Math.round((i / chunks.length) * 100))
        }
      }

      return { standardsGuideId, chunksProcessed: chunks.length }
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[StandardsEmbedWorker] Job ${job?.id} failed:`, err)
  })

  return worker
}
