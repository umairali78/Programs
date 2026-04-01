import { prisma } from './client'
import { improvementProposalQueue } from '@/lib/queue'
import type { ContentObjectType } from '@/lib/domain/types'
import { parseJsonField } from '@/lib/utils/json'

const FEEDBACK_DIMENSIONS = [
  'standardsCompliance',
  'gradeAppropriateness',
  'templateAdherence',
  'engagementQuality',
  'pakistanContextAccuracy',
] as const

type FeedbackDimension = typeof FEEDBACK_DIMENSIONS[number]

export async function getAverageScores(
  coType: ContentObjectType,
  lastN: number = 20
): Promise<Record<FeedbackDimension, number>> {
  const feedback = await prisma.reviewFeedback.findMany({
    where: {
      script: { contentObjectType: coType },
    },
    orderBy: { createdAt: 'desc' },
    take: lastN,
  })

  if (feedback.length === 0) {
    return Object.fromEntries(FEEDBACK_DIMENSIONS.map((d) => [d, 0])) as Record<FeedbackDimension, number>
  }

  const totals = Object.fromEntries(FEEDBACK_DIMENSIONS.map((d) => [d, 0])) as Record<FeedbackDimension, number>
  for (const f of feedback) {
    for (const dim of FEEDBACK_DIMENSIONS) {
      totals[dim] += f[dim]
    }
  }

  return Object.fromEntries(
    FEEDBACK_DIMENSIONS.map((d) => [d, Math.round((totals[d] / feedback.length) * 10) / 10])
  ) as Record<FeedbackDimension, number>
}

export async function checkImprovementTrigger(
  scriptId: string,
  coType: ContentObjectType
): Promise<void> {
  const config = await getSystemConfig()
  const threshold = config.improvementTriggerThreshold ?? 3.5
  const cycleCount = config.improvementCycleCount ?? 10

  const recentFeedback = await prisma.reviewFeedback.findMany({
    where: { script: { contentObjectType: coType } },
    orderBy: { createdAt: 'desc' },
    take: cycleCount,
  })

  if (recentFeedback.length < cycleCount) return // Not enough data yet

  const averages = await getAverageScores(coType, cycleCount)

  for (const [dimension, avg] of Object.entries(averages)) {
    if (avg < threshold) {
      // Check if we already have a pending proposal for this dimension
      const existing = await prisma.improvementProposal.findFirst({
        where: {
          contentObjectType: coType,
          triggeredByDimension: dimension,
          status: 'PENDING',
        },
      })
      if (existing) continue

      const feedbackIds = recentFeedback.map((f) => f.id)
      await improvementProposalQueue.add(`proposal-${coType}-${dimension}`, {
        coType,
        triggeredByDimension: dimension,
        feedbackIds,
      })

      console.log(`[FeedbackTrigger] Enqueued improvement proposal for ${coType}.${dimension} (avg: ${avg})`)
    }
  }
}

async function getSystemConfig(): Promise<Record<string, number>> {
  const configs = await prisma.systemConfig.findMany()
  return Object.fromEntries(
    configs.map((c) => {
      const parsed = parseJsonField<{ value?: number }>(c.value, {})
      return [c.key, parsed.value ?? Number(c.value)]
    })
  )
}
