import Anthropic from '@anthropic-ai/sdk'
import { z, ZodSchema } from 'zod'

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

// ─── Anthropic Implementation ─────────────────────────────────────────────────

class AnthropicAIService implements AIService {
  private client: Anthropic
  private model: string

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.model = process.env.AI_MODEL ?? 'claude-sonnet-4-6'
  }

  async complete(systemPrompt: string, userPrompt: string, options?: AIOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens ?? 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type from AI')
    return block.text
  }

  async completeStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: ZodSchema<T>,
    options?: AIOptions
  ): Promise<T> {
    const enhancedSystem = `${systemPrompt}

IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, no code fences.`

    const raw = await this.complete(enhancedSystem, userPrompt, options)

    // Strip accidental markdown code fences
    const cleaned = raw.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

    let parsed: unknown
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`)
    }

    return schema.parse(parsed)
  }

  async embed(text: string): Promise<number[]> {
    // Anthropic does not provide embeddings natively — use voyage-ai or a fallback.
    // Voyage-ai is recommended for Anthropic workloads.
    // For now we call the Voyage API directly if VOYAGE_API_KEY is set,
    // otherwise return a zero vector (usable in dev without vector search).
    if (process.env.VOYAGE_API_KEY) {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'voyage-2', input: [text] }),
      })
      if (!res.ok) throw new Error(`Voyage embed failed: ${res.statusText}`)
      const data = await res.json() as { data: { embedding: number[] }[] }
      return data.data[0].embedding
    }

    // Dev fallback: deterministic zero vector of length 1536
    console.warn('[AI] No VOYAGE_API_KEY set — returning zero vector for embedding')
    return new Array(1536).fill(0)
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createAIService(): AIService {
  const provider = process.env.AI_PROVIDER ?? 'anthropic'
  switch (provider) {
    case 'anthropic':
      return new AnthropicAIService()
    default:
      throw new Error(`Unknown AI provider: ${provider}`)
  }
}

// Singleton for server-side use
const globalForAI = globalThis as unknown as { ai: AIService | undefined }
export const ai = globalForAI.ai ?? createAIService()
if (process.env.NODE_ENV !== 'production') globalForAI.ai = ai
