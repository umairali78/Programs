import { getRawClient } from '../db'
import { newId } from './uuid'

export class BookmarkService {
  async add(teacherId: string, programId: string): Promise<void> {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.execute({
      sql: `INSERT OR IGNORE INTO bookmarks (id, teacher_id, program_id, created_at) VALUES (?, ?, ?, ?)`,
      args: [id, teacherId, programId, now],
    })
  }

  async remove(teacherId: string, programId: string): Promise<void> {
    const client = getRawClient()
    await client.execute({
      sql: `DELETE FROM bookmarks WHERE teacher_id = ? AND program_id = ?`,
      args: [teacherId, programId],
    })
  }

  async listForTeacher(teacherId: string): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT b.id, b.program_id, b.created_at,
              p.title, p.description, p.grade_levels, p.subjects, p.cost, p.season,
              pt.name as partner_name, pt.county
            FROM bookmarks b
            JOIN programs p ON p.id = b.program_id
            JOIN partners pt ON pt.id = p.partner_id
            WHERE b.teacher_id = ?
            ORDER BY b.created_at DESC`,
      args: [teacherId],
    })
    return result.rows as any[]
  }

  async getSet(teacherId: string): Promise<string[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT program_id FROM bookmarks WHERE teacher_id = ?`,
      args: [teacherId],
    })
    return result.rows.map((r: any) => r.program_id as string)
  }

  async countForProgram(programId: string): Promise<number> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT COUNT(*) as c FROM bookmarks WHERE program_id = ?`,
      args: [programId],
    })
    return Number((result.rows[0] as any).c)
  }

  async getPeerRecommendations(teacherId: string, limit = 5): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT p.id, p.title, p.description, p.grade_levels, p.subjects, p.cost,
              pt.name as partner_name,
              COUNT(DISTINCT b2.teacher_id) as peer_bookmark_count
            FROM bookmarks b1
            JOIN bookmarks b2 ON b2.program_id IN (
              SELECT program_id FROM bookmarks WHERE teacher_id = ?
            ) AND b2.teacher_id != ?
            JOIN bookmarks b3 ON b3.teacher_id = b2.teacher_id AND b3.program_id != b1.program_id
            JOIN programs p ON p.id = b3.program_id
            JOIN partners pt ON pt.id = p.partner_id
            WHERE b1.teacher_id = ? AND b3.program_id NOT IN (
              SELECT program_id FROM bookmarks WHERE teacher_id = ?
            )
            GROUP BY p.id
            ORDER BY peer_bookmark_count DESC
            LIMIT ?`,
      args: [teacherId, teacherId, teacherId, teacherId, limit],
    })
    return result.rows as any[]
  }
}
