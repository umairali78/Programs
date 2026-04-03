import { prisma } from '@/lib/db/client'
import { getAIServiceFromConfig } from '@/lib/ai/client'
import {
  buildResearchBriefSystemPrompt,
  buildResearchBriefUserPrompt,
  ResearchBriefSchema,
} from '@/lib/ai/prompts/research-brief'
import { findRelevantStandardsChunks } from '@/lib/db/standards'
import { stringifyJsonField } from '@/lib/utils/json'

export interface ResearchBriefJobData {
  briefId: string
  sloText: string
  grade: number
  subject: string
  curriculumContext: string
  regenerationFocus?: string
}

export async function processResearchBrief(data: ResearchBriefJobData): Promise<void> {
  const { briefId, sloText, grade, subject, curriculumContext, regenerationFocus } = data

  await prisma.researchBrief.update({
    where: { id: briefId },
    data: { status: 'generating' },
  })

  try {
    const aiService = await getAIServiceFromConfig()

    const chunks = await findRelevantStandardsChunks(sloText, { grade, subject, limit: 8 })
    const chunkTexts = chunks.map((c) => c.content)

    const system = buildResearchBriefSystemPrompt(chunkTexts, grade, subject)
    const user = buildResearchBriefUserPrompt(sloText, grade, subject, curriculumContext, regenerationFocus)

    const briefData = await aiService.completeStructured(system, user, ResearchBriefSchema, {
      maxTokens: 3000,
    })

    await prisma.researchBrief.update({
      where: { id: briefId },
      data: {
        coreConcept: briefData.coreConcept,
        prerequisites: stringifyJsonField(briefData.prerequisites),
        keyVocabulary: stringifyJsonField(briefData.keyVocabulary),
        pakistanExamples: stringifyJsonField(briefData.pakistanExamples),
        commonMisconceptions: stringifyJsonField(briefData.commonMisconceptions),
        bloomsLevel: briefData.bloomsLevel,
        pedagogicalNotes: briefData.pedagogicalNotes,
        status: 'draft',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[processResearchBrief] Error generating brief:', message)
    await prisma.researchBrief.update({
      where: { id: briefId },
      data: { status: 'failed', userNotes: `Generation error: ${message}` },
    }).catch(() => {})
    throw err
  }
}
