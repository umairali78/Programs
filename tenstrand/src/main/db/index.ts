import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import path from 'path'
import * as schema from './schema'

let _db: ReturnType<typeof drizzle> | null = null
let _sqlite: Database.Database | null = null

export function getDb() {
  if (_db) return _db

  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'tenstrand.db')
    : path.join(app.getPath('userData'), 'tenstrand-dev.db')

  console.log('[DB] Opening database at:', dbPath)

  _sqlite = new Database(dbPath)

  _sqlite.pragma('journal_mode = WAL')
  _sqlite.pragma('foreign_keys = ON')
  _sqlite.pragma('busy_timeout = 5000')
  _sqlite.pragma('synchronous = NORMAL')

  _db = drizzle(_sqlite, { schema })

  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, 'migrations')
    : path.join(app.getAppPath(), 'src/main/migrations')

  try {
    migrate(_db, { migrationsFolder })
    console.log('[DB] Migrations applied successfully')
  } catch (err) {
    console.error('[DB] Migration error:', err)
  }

  return _db
}

export function getSqlite() {
  if (!_sqlite) getDb()
  return _sqlite!
}

export function closeDb() {
  if (_sqlite) {
    _sqlite.pragma('wal_checkpoint(TRUNCATE)')
    _sqlite.close()
    _sqlite = null
    _db = null
  }
}

export async function initDb(): Promise<void> {
  getDb()
}

export type DbType = ReturnType<typeof drizzle<typeof schema>>
