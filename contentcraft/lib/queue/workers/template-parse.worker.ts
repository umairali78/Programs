import { Worker, Job } from 'bullmq'
import { createRedisConnection, QUEUE_TEMPLATE_PARSE, type TemplateParseJobData } from '../index'
import { prisma } from '@/lib/db/client'
import { ai } from '@/lib/ai/client'
import { buildTemplateParseSystemPrompt } from '@/lib/ai/prompts/content-generation'
import { readStoredFile } from '@/lib/storage/local'
import { z } from 'zod'

const TemplateParsedSchemaResult = z.object({
  sections: z.array(z.object({
    name: z.string(),
    order: z.number(),
    targetWordCount: z.number(),
    description: z.string().optional(),
  })),
  toneMarkers: z.array(z.string()),
  formatSignals: z.array(z.string()),
  wordCountTargets: z.record(z.number()),
})

export function startTemplateParseWorker() {
  const worker = new Worker<TemplateParseJobData>(
    QUEUE_TEMPLATE_PARSE,
    async (job: Job<TemplateParseJobData>) => {
      const { templateId, storagePath, fileName } = job.data

      await prisma.contentTemplate.update({
        where: { id: templateId },
        data: { parseStatus: 'parsing' },
      })

      const fileBuffer = await readStoredFile(storagePath)

      // Extract text from file
      let text: string
      if (fileName.endsWith('.docx')) {
        const mammoth = await import('mammoth')
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        text = result.value
      } else if (fileName.endsWith('.pdf')) {
        const pdfParse = (await import('pdf-parse')).default
        const result = await pdfParse(fileBuffer)
        text = result.text
      } else {
        throw new Error(`Unsupported file type: ${fileName}`)
      }

      if (!text || text.trim().length < 50) {
        throw new Error('Extracted text too short — file may be empty or image-based')
      }

      // AI structure extraction
      const system = buildTemplateParseSystemPrompt()
      const user = `Analyze this educational content template document and extract its structure:\n\n${text.slice(0, 8000)}`

      const parsedSchema = await ai.completeStructured(system, user, TemplateParsedSchemaResult, {
        maxTokens: 2000,
      })

      await prisma.contentTemplate.update({
        where: { id: templateId },
        data: {
          parsedSchema: parsedSchema as object,
          parseStatus: 'parsed',
        },
      })

      return { templateId, status: 'parsed', sections: parsedSchema.sections.length }
    },
    {
      connection: createRedisConnection(),
      concurrency: 3,
    }
  )

  worker.on('failed', async (job, err) => {
    console.error(`[TemplateParseWorker] Job ${job?.id} failed:`, err)
    if (job?.data.templateId) {
      await prisma.contentTemplate.update({
        where: { id: job.data.templateId },
        data: { parseStatus: 'failed' },
      }).catch(() => {})
    }
  })

  return worker
}
