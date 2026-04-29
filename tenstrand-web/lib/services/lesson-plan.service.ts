import { getRawClient } from '../db'
import { newId } from './uuid'

export interface LessonPlanInsert {
  teacherId: string
  programId?: string
  title: string
  content: string
  gradeLevel?: string
  subjects?: string[]
}

export class LessonPlanService {
  async create(data: LessonPlanInsert): Promise<string> {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.execute({
      sql: `INSERT INTO lesson_plans (id, teacher_id, program_id, title, content, grade_level, subjects, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.teacherId, data.programId ?? null, data.title, data.content,
             data.gradeLevel ?? null, data.subjects ? JSON.stringify(data.subjects) : null, now],
    })
    return id
  }

  async list(teacherId?: string): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute(
      teacherId
        ? { sql: `SELECT lp.*, p.title as program_title, pt.name as partner_name
                  FROM lesson_plans lp
                  LEFT JOIN programs p ON p.id = lp.program_id
                  LEFT JOIN partners pt ON pt.id = p.partner_id
                  WHERE lp.teacher_id = ?
                  ORDER BY lp.created_at DESC`, args: [teacherId] }
        : { sql: `SELECT lp.*, p.title as program_title, pt.name as partner_name
                  FROM lesson_plans lp
                  LEFT JOIN programs p ON p.id = lp.program_id
                  LEFT JOIN partners pt ON pt.id = p.partner_id
                  ORDER BY lp.created_at DESC`, args: [] }
    )
    return result.rows as any[]
  }

  async get(id: string): Promise<any | null> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT lp.*, p.title as program_title, pt.name as partner_name
            FROM lesson_plans lp
            LEFT JOIN programs p ON p.id = lp.program_id
            LEFT JOIN partners pt ON pt.id = p.partner_id
            WHERE lp.id = ?`,
      args: [id],
    })
    return (result.rows[0] as any) ?? null
  }

  async delete(id: string): Promise<void> {
    const client = getRawClient()
    await client.execute({ sql: `DELETE FROM lesson_plans WHERE id = ?`, args: [id] })
  }
}
