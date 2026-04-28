import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    // Return null-safe stub in demo/local mode without DB
    return null as unknown as ReturnType<typeof drizzle<typeof schema>>
  }
  const sql = neon(url)
  return drizzle(sql, { schema })
}

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createDb> | undefined
}

export const db = globalForDb.db ?? createDb()
if (process.env.NODE_ENV !== 'production') globalForDb.db = db

export function isDbAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL)
}
