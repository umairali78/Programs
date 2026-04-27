import { getRawClient } from '../db'

const TABLES = [
  'districts', 'schools', 'teachers', 'teacher_interests', 'partners', 'programs',
  'program_standards', 'bookmarks', 'engagements', 'reviews', 'lesson_plans',
  'reports', 'partner_prospects', 'outreach_log', 'settings'
]

export class AdminService {
  async getDbStats() {
    const client = getRawClient()
    const counts: Record<string, number> = {}

    for (const table of TABLES) {
      try {
        const result = await client.execute(`SELECT COUNT(*) as c FROM ${table}`)
        counts[table] = Number((result.rows[0] as any).c)
      } catch {
        counts[table] = 0
      }
    }

    return { counts }
  }

  async getGeocodingStatus() {
    const client = getRawClient()
    const result: Record<string, Record<string, number>> = {}

    for (const table of ['partners', 'schools']) {
      result[table] = {}
      for (const status of ['pending', 'success', 'failed', 'manual']) {
        try {
          const res = await client.execute({
            sql: `SELECT COUNT(*) as c FROM ${table} WHERE geocoding_status = ?`,
            args: [status]
          })
          result[table][status] = Number((res.rows[0] as any).c)
        } catch {
          result[table][status] = 0
        }
      }
    }

    return result
  }

  async vacuum() {
    const client = getRawClient()
    await client.execute('VACUUM')
    return { ok: true }
  }
}
