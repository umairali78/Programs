import { Worker, Job } from 'bullmq'
import { createRedisConnection, QUEUE_RESEARCH_BRIEF, type ResearchBriefJobData } from '../index'
import { prisma } from '@/lib/db/client'
import { ai } from '@/lib/ai/client'
import {
  buildResearchBriefSystemPrompt,
  buildResearchBriefUserPrompt,
  ResearchBriefSchema,
} from '@/lib/ai/prompts/research-brief'
import { findRelevantStandardsChunks } from '@/lib/db/standards'

export function startResearchBriefWorker() {
  const worker = new Worker<ResearchBriefJobData>(
    QUEUE_RESEARCH_BRIEF,
    async (job: Job<ResearchBriefJobData>) => {
      const { briefId, sloText, grade, subject, curriculumContext, regenerationFocus } = job.data

      await prisma.researchBrief.update({
        where: { id: briefId },
        data: { status: 'generating' },
      })

      // Retrieve relevant standards chunks via pgvector similarity
      const chunks = await findRelevantStandardsChunks(sloText, { grade, subject, limit: 8 })
      const chunkTexts = chunks.map((c) => c.content)

      const system = buildResearchBriefSystemPrompt(chunkTexts, grade, subject)
      const user = buildResearchBriefUserPrompt(sloText, grade, subject, curriculumContext, regenerationFocus)

      const briefData = await ai.completeStructured(system, user, ResearchBriefSchema, {
        maxTokens: 3000,
      })

      await prisma.researchBrief.update({
        where: { id: briefId },
        data: {
          coreConcept: briefData.coreConcept,
          prerequisites: briefData.prerequisites,
          keyVocabulary: briefData.keyVocabulary,
          pakistanExamples: briefData.pakistanExamples,
          commonMisconceptions: briefData.commonMisconceptions,
          bloomsLevel: briefData.bloomsLevel,
          pedagogicalNotes: briefData.pedagogicalNotes,
          status: 'draft',
        },
      })

      return { briefId, status: 'complete' }
    },
    {
      connection: createRedisConnection(),
      concurrency: 5,
    }
  )

  worker.on('failed', async (job, err) => {
    console.error(`[ResearchBriefWorker] Job ${job?.id} failed:`, err)
    if (job?.data.briefId) {
      await prisma.researchBrief.update({
        where: { id: job.data.briefId },
        data: { status: 'failed' },
      }).catch(() => {})
    }
  })

  return worker
}
