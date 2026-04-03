import Anthropic from '@anthropic-ai/sdk'
import { ZodSchema } from 'zod'

export interface AIOptions {
  maxTokens?: number
  temperature?: number
}

export interface AIService {
  complete(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<string>
  completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodSchema<T>,
    options?: AIOptions
  ): Promise<T>
  embed(text: string): Promise<number[]>
}

const DEFAULT_ANTHROPIC_MODEL = 'claude-3-5-sonnet-latest'
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'
const DEFAULT_OPENAI_EMBED_MODEL = 'text-embedding-3-small'
const DEFAULT_VOYAGE_EMBED_MODEL = 'voyage-2'

abstract class BaseAIService implements AIService {
  abstract complete(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<string>

  async completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodSchema<T>,
    options?: AIOptions
  ): Promise<T> {
    const enhancedSystem = `${systemPrompt}

IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, no code fences. Start your response with { and end with }.`

    const raw = await this.complete(enhancedSystem, userPrompt, options)

    // Extract JSON object from anywhere in the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const cleaned = jsonMatch ? jsonMatch[0] : raw.trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 300)}`)
    }

    return schema.parse(parsed)
  }

  async embed(text: string): Promise<number[]> {
    return generateEmbedding(text)
  }
}

class AnthropicAIService extends BaseAIService {
  private client: Anthropic
  private model: string

  constructor(apiKey?: string, model?: string) {
    super()
    const key = apiKey ?? process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic')
    }
    this.client = new Anthropic({ apiKey: key })
    this.model = model ?? process.env.AI_MODEL ?? DEFAULT_ANTHROPIC_MODEL
  }

  async complete(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const block = response.content.find((item) => item.type === 'text')
    if (!block || block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
    return block.text
  }
}

class OpenAIService extends BaseAIService {
  private apiKey: string
  private model: string

  constructor(apiKey?: string, model?: string) {
    super()
    const key = apiKey ?? process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai')
    }
    this.apiKey = key
    this.model = model ?? process.env.AI_MODEL ?? DEFAULT_OPENAI_MODEL
  }

  async complete(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxTokens ?? 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      throw new Error(`OpenAI completion failed: ${res.status} ${details}`)
    }

    const data = await res.json() as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>
        }
      }>
    }

    const content = data.choices?.[0]?.message?.content
    if (typeof content === 'string') return content
    if (Array.isArray(content)) {
      return content
        .filter((part) => part.type === 'text' && typeof part.text === 'string')
        .map((part) => part.text)
        .join('\n')
    }

    throw new Error('Unexpected response type from OpenAI')
  }
}

function createAIService(): AIService {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase()
  switch (provider) {
    case 'openai':
      return new OpenAIService()
    case 'anthropic':
      return new AnthropicAIService()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const provider = resolveEmbeddingProvider()

  if (provider === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when AI_EMBED_PROVIDER=openai')
    }

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_EMBED_MODEL ?? DEFAULT_OPENAI_EMBED_MODEL,
        input: text,
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      throw new Error(`OpenAI embed failed: ${res.status} ${details}`)
    }

    const data = await res.json() as { data?: Array<{ embedding: number[] }> }
    return data.data?.[0]?.embedding ?? []
  }

  if (provider === 'voyage') {
    if (!process.env.VOYAGE_API_KEY) {
      throw new Error('VOYAGE_API_KEY is required when AI_EMBED_PROVIDER=voyage')
    }

    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_EMBED_MODEL ?? DEFAULT_VOYAGE_EMBED_MODEL,
        input: [text],
      }),
    })

    if (!res.ok) {
      const details = await res.text()
      throw new Error(`Voyage embed failed: ${res.status} ${details}`)
    }

    const data = await res.json() as { data?: Array<{ embedding: number[] }> }
    return data.data?.[0]?.embedding ?? []
  }

  console.warn('[AI] No embedding provider configured; returning zero vector fallback')
  return new Array(1536).fill(0)
}

function resolveEmbeddingProvider(): 'openai' | 'voyage' | 'none' {
  const configured = process.env.AI_EMBED_PROVIDER?.toLowerCase()
  if (configured === 'openai' || configured === 'voyage' || configured === 'none') {
    return configured
  }
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.VOYAGE_API_KEY) return 'voyage'
  return 'none'
}

export function getConfiguredAIModel(): string {
  const provider = (process.env.AI_PROVIDER ?? 'openai').toLowerCase()
  return process.env.AI_MODEL ?? (
    provider === 'anthropic' ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL
  )
}

const globalForAI = globalThis as unknown as { ai: AIService | undefined }
export const ai = globalForAI.ai ?? createAIService()
if (process.env.NODE_ENV !== 'production') globalForAI.ai = ai

// Returns AI service configured from environment variables (.env)
export async function getAIServiceFromConfig(): Promise<AIService> {
  return createAIService()
}
