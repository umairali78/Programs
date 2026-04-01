import { prisma } from './client'
import { ai } from '@/lib/ai/client'
import type { ContentObjectType } from '@/lib/domain/types'
import { parseJsonField } from '@/lib/utils/json'

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
  const gradeBand = grade ? getGradeBand(grade) : null
  const chunks = await prisma.standardsChunk.findMany({
    where: {
      guide: activeOnly ? { isActive: true } : undefined,
    },
    include: {
      guide: { select: { isActive: true } },
    },
    orderBy: [{ standardsGuideId: 'asc' }, { chunkIndex: 'asc' }],
  })

  const filtered = chunks.filter((chunk) => {
    const tags = parseTags(chunk.tags)
    if (activeOnly && !chunk.guide?.isActive) return false
    if (gradeBand && tags.gradeBands.length > 0 && !tags.gradeBands.includes(gradeBand)) return false
    if (subject && tags.subjects.length > 0 && !tags.subjects.includes(subject)) return false
    if (coType && tags.contentObjectTypes.length > 0 && !tags.contentObjectTypes.includes(coType)) return false
    return true
  })

  let queryEmbedding: number[] | null = null
  try {
    queryEmbedding = await ai.embed(query)
  } catch {
    queryEmbedding = null
  }

  const ranked = filtered
    .map((chunk) => {
      const embeddingScore = queryEmbedding
        ? cosineSimilarity(queryEmbedding, jsonToNumberArray(chunk.embedding))
        : 0
      const keywordScore = keywordOverlapScore(query, chunk.content)
      return {
        id: chunk.id,
        content: chunk.content,
        tags: chunk.tags,
        score: embeddingScore > 0 ? embeddingScore : keywordScore,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return ranked.map(({ id, content, tags }) => ({ id, content, tags }))
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

function parseTags(value: unknown): {
  gradeBands: string[]
  subjects: string[]
  contentObjectTypes: string[]
} {
  const raw = typeof value === 'string'
    ? parseJsonField<Record<string, unknown>>(value, {})
    : ((value && typeof value === 'object' ? value : {}) as Record<string, unknown>)
  return {
    gradeBands: toStringArray(raw.gradeBands),
    subjects: toStringArray(raw.subjects),
    contentObjectTypes: toStringArray(raw.contentObjectTypes),
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function jsonToNumberArray(value: unknown): number[] {
  const parsed = typeof value === 'string' ? parseJsonField<unknown[]>(value, []) : value
  return Array.isArray(parsed) ? parsed.filter((item): item is number => typeof item === 'number') : []
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0

  let dot = 0
  let aMagnitude = 0
  let bMagnitude = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    aMagnitude += a[i] * a[i]
    bMagnitude += b[i] * b[i]
  }

  if (aMagnitude === 0 || bMagnitude === 0) return 0
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude))
}

function keywordOverlapScore(query: string, content: string): number {
  const queryTerms = tokenize(query)
  const contentTerms = new Set(tokenize(content))

  if (queryTerms.length === 0 || contentTerms.size === 0) return 0

  let matches = 0
  for (const term of queryTerms) {
    if (contentTerms.has(term)) matches += 1
  }

  return matches / queryTerms.length
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((token) => token.length >= 3)
}
