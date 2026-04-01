import { Worker, Job } from 'bullmq'
import { createRedisConnection, QUEUE_IMPROVEMENT_PROPOSAL, type ImprovementProposalJobData } from '../index'
import { prisma } from '@/lib/db/client'
import { ai } from '@/lib/ai/client'
import { buildImprovementProposalPrompt } from '@/lib/ai/prompts/content-generation'
import type { ContentObjectType } from '@prisma/client'
import { z } from 'zod'

const ProposalSchema = z.object({
  suggestions: z.array(z.object({
    field: z.string(),
    currentValue: z.string(),
    suggestedValue: z.string(),
    rationale: z.string(),
    evidence: z.string(),
  })),
})

export function startImprovementProposalWorker() {
  const worker = new Worker<ImprovementProposalJobData>(
    QUEUE_IMPROVEMENT_PROPOSAL,
    async (job: Job<ImprovementProposalJobData>) => {
      const { coType, triggeredByDimension, feedbackIds } = job.data

      // Load the relevant feedback
      const feedbackRecords = await prisma.reviewFeedback.findMany({
        where: { id: { in: feedbackIds } },
      })

      const feedbackSummary = feedbackRecords.map((f) => ({
        standardsCompliance: f.standardsCompliance,
        gradeAppropriateness: f.gradeAppropriateness,
        templateAdherence: f.templateAdherence,
        engagementQuality: f.engagementQuality,
        pakistanContextAccuracy: f.pakistanContextAccuracy,
        freeText: f.freeText,
        annotations: f.annotations,
      }))

      // Load current active prompt library and template
      const promptLib = await prisma.promptLibrary.findFirst({
        where: { contentObjectType: coType as ContentObjectType, isActive: true },
      })
      const template = await prisma.contentTemplate.findFirst({
        where: { contentObjectType: coType as ContentObjectType, isActive: true },
      })

      const prompt = buildImprovementProposalPrompt(
        coType as ContentObjectType,
        feedbackSummary,
        promptLib as unknown as Record<string, unknown> ?? {},
        (template?.parsedSchema as Record<string, unknown>) ?? {}
      )

      const result = await ai.completeStructured(prompt, 'Generate improvement proposals now.', ProposalSchema, {
        maxTokens: 2000,
      })

      await prisma.improvementProposal.create({
        data: {
          type: promptLib ? 'PROMPT' : 'TEMPLATE',
          contentObjectType: coType as ContentObjectType,
          status: 'PENDING',
          triggeredByDimension,
          suggestions: result.suggestions,
          triggeredByFeedbackIds: feedbackIds,
        },
      })

      return { coType, proposalCreated: true }
    },
    {
      connection: createRedisConnection(),
      concurrency: 2,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[ImprovementProposalWorker] Job ${job?.id} failed:`, err)
  })

  return worker
}
