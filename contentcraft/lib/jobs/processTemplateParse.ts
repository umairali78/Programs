import { prisma } from '@/lib/db/client'
import { getAIServiceFromConfig } from '@/lib/ai/client'
import { buildTemplateParseSystemPrompt } from '@/lib/ai/prompts/content-generation'
import { readStoredFile } from '@/lib/storage/local'
import { stringifyJsonField } from '@/lib/utils/json'
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

export interface TemplateParseJobData {
  templateId: string
  storagePath: string
  fileName: string
}

export async function processTemplateParse(data: TemplateParseJobData): Promise<void> {
  const { templateId, storagePath, fileName } = data

  await prisma.contentTemplate.update({
    where: { id: templateId },
    data: { parseStatus: 'parsing' },
  })

  try {
    const aiService = await getAIServiceFromConfig()
    const fileBuffer = await readStoredFile(storagePath)

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

    const system = buildTemplateParseSystemPrompt()
    const user = `Analyze this educational content template document and extract its structure:\n\n${text.slice(0, 8000)}`

    const parsedSchema = await aiService.completeStructured(system, user, TemplateParsedSchemaResult, {
      maxTokens: 2000,
    })

    await prisma.contentTemplate.update({
      where: { id: templateId },
      data: {
        parsedSchema: stringifyJsonField(parsedSchema),
        parseStatus: 'parsed',
      },
    })
  } catch (err) {
    console.error('[processTemplateParse]', err)
    await prisma.contentTemplate.update({
      where: { id: templateId },
      data: { parseStatus: 'failed' },
    }).catch(() => {})
    throw err
  }
}
