import { getRawClient } from '../db'
import { newId } from './uuid'

export class InterestService {
  async express(teacherId: string, programId: string, message?: string) {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.execute({
      sql: `INSERT OR REPLACE INTO program_interests (id, teacher_id, program_id, message, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)`,
      args: [id, teacherId, programId, message ?? null, now],
    })
    return { id }
  }

  async remove(teacherId: string, programId: string) {
    const client = getRawClient()
    await client.execute({
      sql: `DELETE FROM program_interests WHERE teacher_id = ? AND program_id = ?`,
      args: [teacherId, programId],
    })
  }

  async listForTeacher(teacherId: string) {
    const client = getRawClient()
    const rows = (await client.execute({
      sql: `SELECT pi.id, pi.program_id, pi.message, pi.status, pi.created_at,
                   p.title as program_title, p.description as program_description,
                   p.grade_levels, p.subjects, p.cost, p.duration_mins,
                   pa.id as partner_id, pa.name as partner_name, pa.type as partner_type,
                   pa.contact_email as partner_email, pa.website as partner_website
            FROM program_interests pi
            JOIN programs p ON pi.program_id = p.id
            JOIN partners pa ON p.partner_id = pa.id
            WHERE pi.teacher_id = ?
            ORDER BY pi.created_at DESC`,
      args: [teacherId],
    })).rows
    return rows
  }

  async listForProgram(programId: string) {
    const client = getRawClient()
    const rows = (await client.execute({
      sql: `SELECT pi.id, pi.teacher_id, pi.message, pi.status, pi.created_at,
                   t.name as teacher_name, t.email as teacher_email,
                   t.grade_levels, t.subjects,
                   s.name as school_name
            FROM program_interests pi
            JOIN teachers t ON pi.teacher_id = t.id
            LEFT JOIN schools s ON t.school_id = s.id
            WHERE pi.program_id = ?
            ORDER BY pi.created_at DESC`,
      args: [programId],
    })).rows
    return rows
  }

  async getInterestSet(teacherId: string): Promise<string[]> {
    const client = getRawClient()
    const rows = (await client.execute({
      sql: `SELECT program_id FROM program_interests WHERE teacher_id = ?`,
      args: [teacherId],
    })).rows
    return rows.map((r) => r.program_id as string)
  }

  async countForTeacher(teacherId: string): Promise<number> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT COUNT(*) as n FROM program_interests WHERE teacher_id = ?`,
      args: [teacherId],
    })
    return Number(result.rows[0].n)
  }
}
