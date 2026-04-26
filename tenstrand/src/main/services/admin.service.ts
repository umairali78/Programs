import { getSqlite } from '../db'
import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import { BaseService } from './base.service'

const TABLES = [
  'districts',
  'schools',
  'teachers',
  'teacher_interests',
  'partners',
  'programs',
  'program_standards',
  'bookmarks',
  'engagements',
  'reviews',
  'lesson_plans',
  'reports',
  'partner_prospects',
  'outreach_log',
  'settings'
]

export class AdminService extends BaseService {
  async getDbStats() {
    const sqlite = getSqlite()
    const counts: Record<string, number> = {}

    for (const table of TABLES) {
      try {
        const row = sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number }
        counts[table] = row.c
      } catch {
        counts[table] = 0
      }
    }

    // Get DB file size
    const dbPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'tenstrand.db')
      : path.join(app.getPath('userData'), 'tenstrand-dev.db')

    let fileSizeBytes = 0
    try {
      const stat = fs.statSync(dbPath)
      fileSizeBytes = stat.size
    } catch {
      fileSizeBytes = 0
    }

    return { counts, fileSizeBytes, dbPath }
  }

  async vacuum() {
    const sqlite = getSqlite()
    sqlite.prepare('VACUUM').run()
    return { ok: true }
  }

  async exportDb(destPath: string) {
    const sqlite = getSqlite()
    await sqlite.backup(destPath)
    return { destPath }
  }

  async getGeocodingStatus() {
    const sqlite = getSqlite()
    const result: Record<string, Record<string, number>> = {}

    for (const table of ['partners', 'schools']) {
      result[table] = {}
      for (const status of ['pending', 'success', 'failed', 'manual']) {
        try {
          const row = sqlite
            .prepare(
              `SELECT COUNT(*) as c FROM ${table} WHERE geocoding_status = ?`
            )
            .get(status) as { c: number }
          result[table][status] = row.c
        } catch {
          result[table][status] = 0
        }
      }
    }

    return result
  }
}
