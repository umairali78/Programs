import { prisma } from './client'
import { ai } from '@/lib/ai/client'
import type { ContentObjectType } from '@prisma/client'

interface FindChunksOptions {
  grade?: number
  subject?: string
  coType?: ContentObjectType
  limit?: number
  activeOnly?: boolean
}

export async function findRelevantStandardsChunks(
  query: string,
  options: FindChunksOptions = {}
): Promise<{ id: string; content: string; tags: unknown }[]> {
  const { limit = 8, grade, coType, activeOnly = true } = options

  let embedding: number[]
  try {
    embedding = await ai.embed(query)
  } catch {
    // Dev fallback: return first N chunks from active guide (no vector search)
    return prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
      SELECT sc.id, sc.content, sc.tags
      FROM "StandardsChunk" sc
      JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
      WHERE sg."isActive" = true
      LIMIT ${limit}
    `
  }

  const vectorLiteral = `[${embedding.join(',')}]`
  const gradeBand = grade ? getGradeBand(grade) : null

  // Build query based on optional filters. We use separate queries to avoid
  // dynamic interpolation inside tagged template literals (Prisma limitation).
  if (gradeBand && coType) {
    return prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
      SELECT sc.id, sc.content, sc.tags,
             1 - (sc.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "StandardsChunk" sc
      JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
      WHERE (${activeOnly} = false OR sg."isActive" = true)
        AND (sc.tags->'gradeBands' IS NULL OR sc.tags->'gradeBands' @> ${JSON.stringify([gradeBand])}::jsonb)
        AND (sc.tags->'contentObjectTypes' IS NULL OR sc.tags->'contentObjectTypes' @> ${JSON.stringify([coType])}::jsonb)
      ORDER BY sc.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `
  }

  if (gradeBand) {
    return prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
      SELECT sc.id, sc.content, sc.tags,
             1 - (sc.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "StandardsChunk" sc
      JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
      WHERE (${activeOnly} = false OR sg."isActive" = true)
        AND (sc.tags->'gradeBands' IS NULL OR sc.tags->'gradeBands' @> ${JSON.stringify([gradeBand])}::jsonb)
      ORDER BY sc.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `
  }

  if (coType) {
    return prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
      SELECT sc.id, sc.content, sc.tags,
             1 - (sc.embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM "StandardsChunk" sc
      JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
      WHERE (${activeOnly} = false OR sg."isActive" = true)
        AND (sc.tags->'contentObjectTypes' IS NULL OR sc.tags->'contentObjectTypes' @> ${JSON.stringify([coType])}::jsonb)
      ORDER BY sc.embedding <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `
  }

  return prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
    SELECT sc.id, sc.content, sc.tags,
           1 - (sc.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM "StandardsChunk" sc
    JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
    WHERE (${activeOnly} = false OR sg."isActive" = true)
    ORDER BY sc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${limit}
  `
}

export async function getActiveStandardsVersion(): Promise<number | null> {
  const guide = await prisma.standardsGuide.findFirst({ where: { isActive: true } })
  return guide?.version ?? null
}

function getGradeBand(grade: number): string {
  if (grade <= 3) return 'G1-3'
  if (grade <= 6) return 'G4-6'
  if (grade <= 9) return 'G7-9'
  return 'G10-12'
}
