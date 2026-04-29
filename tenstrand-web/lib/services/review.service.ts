import { getRawClient } from '../db'
import { newId } from './uuid'

export class ReviewService {
  async create(teacherId: string, programId: string, rating: number, text: string, visitedAt?: number): Promise<string> {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.execute({
      sql: `INSERT OR REPLACE INTO reviews (id, teacher_id, program_id, rating, text, visited_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, teacherId, programId, rating, text, visitedAt ?? now, now],
    })
    return id
  }

  async listForProgram(programId: string): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT r.id, r.rating, r.text, r.visited_at, r.created_at,
              t.name as teacher_name, t.grade_levels, t.subjects
            FROM reviews r
            JOIN teachers t ON t.id = r.teacher_id
            WHERE r.program_id = ?
            ORDER BY r.created_at DESC`,
      args: [programId],
    })
    return result.rows as any[]
  }

  async listForTeacher(teacherId: string): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT r.id, r.rating, r.text, r.visited_at, r.created_at,
              p.title as program_title, pt.name as partner_name
            FROM reviews r
            JOIN programs p ON p.id = r.program_id
            JOIN partners pt ON pt.id = p.partner_id
            WHERE r.teacher_id = ?
            ORDER BY r.created_at DESC`,
      args: [teacherId],
    })
    return result.rows as any[]
  }

  async delete(id: string): Promise<void> {
    const client = getRawClient()
    await client.execute({ sql: `DELETE FROM reviews WHERE id = ?`, args: [id] })
  }

  async getAvgRating(programId: string): Promise<{ avg: number; count: number }> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE program_id = ?`,
      args: [programId],
    })
    const row = result.rows[0] as any
    return { avg: Number(row.avg ?? 0), count: Number(row.count ?? 0) }
  }

  async getSpotlightReview(): Promise<any | null> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT r.text, r.rating, t.name as teacher_name, t.grade_levels,
              p.title as program_title, pt.name as partner_name, pt.id as partner_id
            FROM reviews r
            JOIN teachers t ON t.id = r.teacher_id
            JOIN programs p ON p.id = r.program_id
            JOIN partners pt ON pt.id = p.partner_id
            WHERE r.rating >= 4 AND r.text IS NOT NULL AND LENGTH(r.text) > 20
            ORDER BY r.created_at DESC
            LIMIT 1`,
      args: [],
    })
    return (result.rows[0] as any) ?? null
  }
}
