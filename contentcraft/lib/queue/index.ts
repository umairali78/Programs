import { Queue, Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

export function createRedisConnection() {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}

const connection = createRedisConnection()

// ─── Queue Names ──────────────────────────────────────────────────────────────

export const QUEUE_RESEARCH_BRIEF = 'research-brief'
export const QUEUE_CONTENT_GENERATION = 'content-generation'
export const QUEUE_COMPLIANCE_CHECK = 'compliance-check'
export const QUEUE_TEMPLATE_PARSE = 'template-parse'
export const QUEUE_STANDARDS_EMBED = 'standards-embed'
export const QUEUE_IMPROVEMENT_PROPOSAL = 'improvement-proposal'

// ─── Queue Instances ──────────────────────────────────────────────────────────

export const researchBriefQueue = new Queue(QUEUE_RESEARCH_BRIEF, { connection })
export const contentGenerationQueue = new Queue(QUEUE_CONTENT_GENERATION, { connection })
export const complianceCheckQueue = new Queue(QUEUE_COMPLIANCE_CHECK, { connection })
export const templateParseQueue = new Queue(QUEUE_TEMPLATE_PARSE, { connection })
export const standardsEmbedQueue = new Queue(QUEUE_STANDARDS_EMBED, { connection })
export const improvementProposalQueue = new Queue(QUEUE_IMPROVEMENT_PROPOSAL, { connection })

// ─── Job Type Definitions ─────────────────────────────────────────────────────

export interface ResearchBriefJobData {
  briefId: string
  sloText: string
  grade: number
  subject: string
  curriculumContext: string
  regenerationFocus?: string
}

export interface ContentGenerationJobData {
  scriptId: string
  runId: string
  coType: string
  briefId: string
  regenerationInstruction?: string
}

export interface ComplianceCheckJobData {
  scriptId: string
  scriptText: string
}

export interface TemplateParseJobData {
  templateId: string
  storagePath: string
  fileName: string
}

export interface StandardsEmbedJobData {
  standardsGuideId: string
  storagePath: string
}

export interface ImprovementProposalJobData {
  coType: string
  triggeredByDimension: string
  feedbackIds: string[]
}

// ─── Queue Events (for SSE progress) ─────────────────────────────────────────

export const contentGenerationEvents = new QueueEvents(QUEUE_CONTENT_GENERATION, { connection })
export const researchBriefEvents = new QueueEvents(QUEUE_RESEARCH_BRIEF, { connection })
