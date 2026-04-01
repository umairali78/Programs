import { Worker, Job } from 'bullmq'
import { createRedisConnection, QUEUE_CONTENT_GENERATION, complianceCheckQueue, type ContentGenerationJobData } from '../index'
import { prisma } from '@/lib/db/client'
import { ai } from '@/lib/ai/client'
import {
  buildContentGenerationSystemPrompt,
  buildContentGenerationUserPrompt,
  buildComplianceCheckPrompt,
  type GenerationContext,
} from '@/lib/ai/prompts/content-generation'
import { findRelevantStandardsChunks } from '@/lib/db/standards'
import type { ContentObjectType } from '@prisma/client'
import { z } from 'zod'

const ComplianceSummarySchema = z.object({
  results: z.array(z.object({
    criterion: z.string(),
    status: z.enum(['pass', 'flag']),
    note: z.string(),
  })),
})

export function startContentGenerationWorker() {
  const worker = new Worker<ContentGenerationJobData>(
    QUEUE_CONTENT_GENERATION,
    async (job: Job<ContentGenerationJobData>) => {
      const { scriptId, runId, coType, briefId, regenerationInstruction } = job.data

      await prisma.generatedScript.update({
        where: { id: scriptId },
        data: { generationMetadata: { ...((await prisma.generatedScript.findUnique({ where: { id: scriptId }, select: { generationMetadata: true } }))?.generationMetadata as object ?? {}), status: 'generating' } },
      })

      // Load research brief
      const brief = await prisma.researchBrief.findUnique({ where: { id: briefId } })
      if (!brief) throw new Error(`Brief ${briefId} not found`)

      // Load active template schema
      const template = await prisma.contentTemplate.findFirst({
        where: { contentObjectType: coType as ContentObjectType, isActive: true },
      })

      // Load active prompt library
      const promptLib = await prisma.promptLibrary.findFirst({
        where: { contentObjectType: coType as ContentObjectType, isActive: true },
      })
      if (!promptLib) throw new Error(`No active prompt library for ${coType}`)

      // Load relevant standards chunks
      const chunks = await findRelevantStandardsChunks(brief.sloText, {
        grade: brief.grade,
        subject: brief.subject,
        coType: coType as ContentObjectType,
        limit: 6,
      })

      const ctx: GenerationContext = {
        researchBrief: brief as unknown as Record<string, unknown>,
        templateSchema: (template?.parsedSchema as Record<string, unknown>) ?? {},
        promptLibrary: {
          masterPrompt: promptLib.masterPrompt,
          structuralRules: promptLib.structuralRules,
          outputFormat: promptLib.outputFormat,
          qualityCriteria: promptLib.qualityCriteria,
        },
        standardsChunks: chunks.map((c) => c.content),
        regenerationInstruction,
      }

      const system = buildContentGenerationSystemPrompt(coType as ContentObjectType, ctx)
      const user = buildContentGenerationUserPrompt(ctx)

      const scriptText = await ai.complete(system, user, { maxTokens: 6000 })

      // Run compliance check
      const complianceSystem = buildComplianceCheckPrompt(scriptText, chunks.map((c) => c.content))
      let complianceSummary: unknown[] = []
      try {
        const result = await ai.completeStructured(
          complianceSystem,
          `Check this script:\n\n${scriptText.slice(0, 3000)}`,
          ComplianceSummarySchema,
          { maxTokens: 1000 }
        )
        complianceSummary = result.results
      } catch (err) {
        console.warn('[ContentGenWorker] Compliance check failed:', err)
      }

      // Build generation metadata
      const run = await prisma.generationRun.findUnique({ where: { id: runId } })
      const metadata = {
        sloText: brief.sloText,
        grade: brief.grade,
        subject: brief.subject,
        curriculumContext: brief.curriculumContext,
        templateVersion: template?.version ?? null,
        standardsVersion: run?.standardsVersionUsed ?? null,
        briefVersion: brief.version,
        modelId: process.env.AI_MODEL ?? 'claude-sonnet-4-6',
        generatedAt: new Date().toISOString(),
      }

      await prisma.generatedScript.update({
        where: { id: scriptId },
        data: {
          scriptText,
          complianceSummary,
          generationMetadata: metadata,
          templateId: template?.id,
        },
      })

      // Update run status if all scripts are done
      await checkAndCompleteRun(runId)

      return { scriptId, status: 'complete' }
    },
    {
      connection: createRedisConnection(),
      concurrency: 10,
    }
  )

  worker.on('failed', async (job, err) => {
    console.error(`[ContentGenWorker] Job ${job?.id} failed:`, err)
    if (job?.data.scriptId) {
      await prisma.generatedScript.update({
        where: { id: job.data.scriptId },
        data: { generationMetadata: { status: 'failed', error: String(err) } },
      }).catch(() => {})
      await checkAndCompleteRun(job.data.runId)
    }
  })

  return worker
}

async function checkAndCompleteRun(runId: string) {
  const scripts = await prisma.generatedScript.findMany({
    where: { runId },
    select: { generationMetadata: true },
  })

  const allDone = scripts.every((s) => {
    const meta = s.generationMetadata as Record<string, string>
    return meta?.status === 'failed' || meta?.generatedAt
  })

  if (allDone) {
    const anyFailed = scripts.some((s) => {
      const meta = s.generationMetadata as Record<string, string>
      return meta?.status === 'failed'
    })
    await prisma.generationRun.update({
      where: { id: runId },
      data: {
        status: anyFailed ? 'COMPLETE' : 'COMPLETE',
        completedAt: new Date(),
      },
    })
  }
}
