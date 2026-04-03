import { prisma } from '@/lib/db/client'
import { getAIServiceFromConfig } from '@/lib/ai/client'
import { buildImprovementProposalPrompt } from '@/lib/ai/prompts/content-generation'
import type { ContentObjectType } from '@/lib/domain/types'
import { parseJsonField, stringifyJsonField } from '@/lib/utils/json'
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

export interface ImprovementProposalJobData {
  coType: string
  triggeredByDimension: string
  feedbackIds: string[]
}

export async function processImprovementProposal(data: ImprovementProposalJobData): Promise<void> {
  const { coType, triggeredByDimension, feedbackIds } = data

  const aiService = await getAIServiceFromConfig()
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
    annotations: parseJsonField(f.annotations, []),
  }))

  const promptLib = await prisma.promptLibrary.findFirst({
    where: { contentObjectType: coType as ContentObjectType, isActive: true },
  })
  const template = await prisma.contentTemplate.findFirst({
    where: { contentObjectType: coType as ContentObjectType, isActive: true },
  })

  const prompt = buildImprovementProposalPrompt(
    coType as ContentObjectType,
    feedbackSummary,
    (promptLib as unknown as Record<string, unknown>) ?? {},
    template?.parsedSchema ? parseJsonField<Record<string, unknown>>(template.parsedSchema, {}) : {}
  )

  const result = await aiService.completeStructured(prompt, 'Generate improvement proposals now.', ProposalSchema, {
    maxTokens: 2000,
  })

  await prisma.improvementProposal.create({
    data: {
      type: promptLib ? 'PROMPT' : 'TEMPLATE',
      contentObjectType: coType,
      status: 'PENDING',
      triggeredByDimension,
      suggestions: stringifyJsonField(result.suggestions),
      triggeredByFeedbackIds: stringifyJsonField(feedbackIds),
    },
  })
}
