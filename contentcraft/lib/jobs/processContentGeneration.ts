import { prisma } from '@/lib/db/client'
import { getAIServiceFromConfig, getConfiguredAIModel } from '@/lib/ai/client'
import {
  buildContentGenerationSystemPrompt,
  buildContentGenerationUserPrompt,
  buildComplianceCheckPrompt,
  type GenerationContext,
} from '@/lib/ai/prompts/content-generation'
import { findRelevantStandardsChunks } from '@/lib/db/standards'
import type { ContentObjectType } from '@/lib/domain/types'
import { parseJsonField, stringifyJsonField } from '@/lib/utils/json'
import { z } from 'zod'

const ComplianceSummarySchema = z.object({
  results: z.array(z.object({
    criterion: z.string(),
    status: z.enum(['pass', 'flag']),
    note: z.string(),
  })),
})

export interface ContentGenerationJobData {
  scriptId: string
  runId: string
  coType: string
  briefId: string
  regenerationInstruction?: string
}

export async function processContentGeneration(data: ContentGenerationJobData): Promise<void> {
  const { scriptId, runId, coType, briefId, regenerationInstruction } = data

  await prisma.generatedScript.update({
    where: { id: scriptId },
    data: { generationMetadata: stringifyJsonField({ status: 'generating' }) },
  })

  try {
    const aiService = await getAIServiceFromConfig()

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
    if (!promptLib) throw new Error(`No active prompt library for ${coType}. Please seed or configure it in the admin panel.`)

    // Load relevant standards chunks
    const chunks = await findRelevantStandardsChunks(brief.sloText, {
      grade: brief.grade,
      subject: brief.subject,
      coType: coType as ContentObjectType,
      limit: 6,
    })

    // Parse brief JSON fields for use in generation context
    const briefForContext = {
      ...brief,
      prerequisites: parseJsonField<string[]>(brief.prerequisites, []),
      keyVocabulary: parseJsonField<{ term: string; definition: string; gradeAppropriateExample: string }[]>(brief.keyVocabulary, []),
      pakistanExamples: parseJsonField<string[]>(brief.pakistanExamples, []),
      commonMisconceptions: parseJsonField<string[]>(brief.commonMisconceptions, []),
    }

    const ctx: GenerationContext = {
      researchBrief: briefForContext as unknown as Record<string, unknown>,
      templateSchema: template?.parsedSchema
        ? parseJsonField<Record<string, unknown>>(template.parsedSchema, {})
        : {},
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

    const scriptText = await aiService.complete(system, user, { maxTokens: 6000 })

    // Run compliance check
    const complianceSystem = buildComplianceCheckPrompt(scriptText, chunks.map((c) => c.content))
    let complianceSummary: unknown[] = []
    try {
      const result = await aiService.completeStructured(
        complianceSystem,
        `Check this script:\n\n${scriptText.slice(0, 3000)}`,
        ComplianceSummarySchema,
        { maxTokens: 1000 }
      )
      complianceSummary = result.results
    } catch (err) {
      console.warn('[processContentGeneration] Compliance check failed:', err)
    }

    // Build generation metadata
    const run = await prisma.generationRun.findUnique({ where: { id: runId } })
    const metadata = {
      status: 'complete',
      sloText: brief.sloText,
      grade: brief.grade,
      subject: brief.subject,
      curriculumContext: brief.curriculumContext,
      templateVersion: template?.version ?? null,
      standardsVersion: run?.standardsVersionUsed ?? null,
      briefVersion: brief.version,
      modelId: getConfiguredAIModel(),
      generatedAt: new Date().toISOString(),
    }

    await prisma.generatedScript.update({
      where: { id: scriptId },
      data: {
        scriptText,
        complianceSummary: stringifyJsonField(complianceSummary),
        generationMetadata: stringifyJsonField(metadata),
        templateId: template?.id,
      },
    })
  } catch (err) {
    console.error(`[processContentGeneration] Error generating ${coType}:`, err)
    await prisma.generatedScript.update({
      where: { id: scriptId },
      data: { generationMetadata: stringifyJsonField({ status: 'failed', error: String(err) }) },
    }).catch(() => {})
    throw err
  } finally {
    // Always check if run is complete regardless of success/failure
    await checkAndCompleteRun(runId)
  }
}

async function checkAndCompleteRun(runId: string) {
  try {
    const scripts = await prisma.generatedScript.findMany({
      where: { runId },
      select: { generationMetadata: true },
    })

    const allDone = scripts.every((s) => {
      const meta = parseJsonField<Record<string, string>>(s.generationMetadata, {})
      return meta?.status === 'failed' || meta?.generatedAt
    })

    if (allDone) {
      await prisma.generationRun.update({
        where: { id: runId },
        data: { status: 'COMPLETE', completedAt: new Date() },
      })
    }
  } catch (err) {
    console.error('[checkAndCompleteRun]', err)
  }
}
