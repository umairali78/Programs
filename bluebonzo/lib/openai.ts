import OpenAI from 'openai'

function createClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  return new OpenAI({ apiKey: key })
}

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | null | undefined }
export const openai = globalForOpenAI.openai !== undefined
  ? globalForOpenAI.openai
  : (globalForOpenAI.openai = createClient())

export function isOpenAIAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}
