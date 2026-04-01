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
  const { limit = 8, grade, subject, coType, activeOnly = true } = options

  let embedding: number[]
  try {
    embedding = await ai.embed(query)
  } catch {
    // If embedding fails (e.g. dev mode), return first N chunks from active guide
    const fallback = await prisma.$queryRaw<{ id: string; content: string; tags: unknown }[]>`
      SELECT sc.id, sc.content, sc.tags
      FROM "StandardsChunk" sc
      JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
      WHERE sg."isActive" = true
      LIMIT ${limit}
    `
    return fallback
  }

  // Build tag filter condition
  const gradeBand = grade ? getGradeBand(grade) : null

  // Vector similarity search — cosine distance
  // Filter by active guide and optional tags (JSON containment)
  const results = await prisma.$queryRaw<{ id: string; content: string; tags: unknown; similarity: number }[]>`
    SELECT sc.id, sc.content, sc.tags,
           1 - (sc.embedding <=> ${`[${embedding.join(',')}]`}::vector) AS similarity
    FROM "StandardsChunk" sc
    JOIN "StandardsGuide" sg ON sc."standardsGuideId" = sg.id
    WHERE ${activeOnly ? prisma.$raw`sg."isActive" = true` : prisma.$raw`true`}
    ${gradeBand ? prisma.$raw`AND (sc.tags->'gradeBands' IS NULL OR sc.tags->'gradeBands' @> ${JSON.stringify([gradeBand])}::jsonb)` : prisma.$raw``}
    ${coType ? prisma.$raw`AND (sc.tags->'contentObjectTypes' IS NULL OR sc.tags->'contentObjectTypes' @> ${JSON.stringify([coType])}::jsonb)` : prisma.$raw``}
    ORDER BY sc.embedding <=> ${`[${embedding.join(',')}]`}::vector
    LIMIT ${limit}
  `

  return results
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
