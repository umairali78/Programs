import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

let _client: ReturnType<typeof createClient> | null = null
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function getClient() {
  if (_client) return _client
  const fallbackUrl = process.env.VERCEL ? 'file:/tmp/tenstrand-demo.db' : 'file:./tenstrand-demo.db'
  const url = process.env.TURSO_DATABASE_URL || fallbackUrl
  _client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  })
  return _client
}

export function getDb() {
  if (_db) return _db
  _db = drizzle(getClient(), { schema })
  return _db
}

export function getRawClient() {
  return getClient()
}
