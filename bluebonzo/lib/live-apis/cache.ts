import { createHash } from 'crypto'
import { isDbAvailable } from '@/lib/db/client'

interface CacheEnvelope<T> {
  value: T
  stale?: boolean
}

export async function withApiCache<T>(
  provider: string,
  endpoint: string,
  params: Record<string, unknown>,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<CacheEnvelope<T>> {
  const cacheKey = buildCacheKey(provider, endpoint, params)

  if (isDbAvailable()) {
    const cached = await readCache<T>(cacheKey, false)
    if (cached) return { value: cached }
  }

  try {
    const value = await fetcher()
    if (isDbAvailable()) await writeCache(cacheKey, provider, endpoint, params, value, ttlSeconds)
    return { value }
  } catch (err) {
    if (isDbAvailable()) {
      const stale = await readCache<T>(cacheKey, true)
      if (stale) return { value: stale, stale: true }
    }
    throw err
  }
}

export async function fetchJsonWithTimeout<T>(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
    return await res.json() as T
  } finally {
    clearTimeout(timer)
  }
}

function buildCacheKey(provider: string, endpoint: string, params: Record<string, unknown>): string {
  const hash = createHash('sha256')
    .update(JSON.stringify({ provider, endpoint, params }))
    .digest('hex')
  return `${provider}:${hash}`
}

async function readCache<T>(cacheKey: string, allowStale: boolean): Promise<T | null> {
  try {
    const { db } = await import('@/lib/db/client')
    const { apiCache } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const where = allowStale ? eq(apiCache.cacheKey, cacheKey) : eq(apiCache.cacheKey, cacheKey)
    const rows = await db!.select().from(apiCache).where(where).limit(1)
    const row = rows[0]
    if (!row) return null
    if (!allowStale && !(row.expiresAt > new Date())) return null
    return JSON.parse(row.response) as T
  } catch {
    return null
  }
}

async function writeCache<T>(
  cacheKey: string,
  provider: string,
  endpoint: string,
  params: Record<string, unknown>,
  value: T,
  ttlSeconds: number,
) {
  try {
    const { db } = await import('@/lib/db/client')
    const { apiCache } = await import('@/lib/db/schema')
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
    await db!.insert(apiCache).values({
      cacheKey,
      provider,
      endpoint,
      params: JSON.stringify(params),
      response: JSON.stringify(value),
      expiresAt,
    }).onConflictDoUpdate({
      target: apiCache.cacheKey,
      set: {
        response: JSON.stringify(value),
        params: JSON.stringify(params),
        endpoint,
        expiresAt,
        createdAt: new Date(),
      },
    })
  } catch {
    // Cache is an optimization; never fail a user query because cache writes failed.
  }
}
