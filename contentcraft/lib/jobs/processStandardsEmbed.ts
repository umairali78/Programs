import { prisma } from '@/lib/db/client'
import { getAIServiceFromConfig } from '@/lib/ai/client'
import { readStoredFile } from '@/lib/storage/local'
import { stringifyJsonField } from '@/lib/utils/json'

export interface StandardsEmbedJobData {
  standardsGuideId: string
  storagePath: string
}

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

export async function processStandardsEmbed(data: StandardsEmbedJobData): Promise<void> {
  const { standardsGuideId, storagePath } = data

  const aiService = await getAIServiceFromConfig()
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
  await prisma.standardsChunk.deleteMany({ where: { standardsGuideId } })

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const embedding = await aiService.embed(chunk)
    await prisma.standardsChunk.create({
      data: {
        standardsGuideId,
        content: chunk,
        embedding: stringifyJsonField(embedding),
        chunkIndex: i,
        tags: stringifyJsonField({}),
      },
    })
  }
}
