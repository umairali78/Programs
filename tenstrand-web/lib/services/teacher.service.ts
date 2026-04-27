import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { teachers, schools } from '../schema'
import { newId } from './uuid'
import { SettingsService } from './settings.service'

export type TeacherInsert = {
  name: string
  email?: string
  schoolId?: string
  gradeLevels?: string[]
  subjects?: string[]
  lat?: number
  lng?: number
  zip?: string
}

export class TeacherService {
  private settingsSvc = new SettingsService()

  async list() {
    const db = getDb()
    return db
      .select({
        id: teachers.id,
        name: teachers.name,
        email: teachers.email,
        schoolId: teachers.schoolId,
        gradeLevels: teachers.gradeLevels,
        subjects: teachers.subjects,
        lat: teachers.lat,
        lng: teachers.lng,
        zip: teachers.zip,
        lastActive: teachers.lastActive,
        schoolName: schools.name
      })
      .from(teachers)
      .leftJoin(schools, eq(teachers.schoolId, schools.id))
      .orderBy(teachers.name)
  }

  async get(id: string) {
    const db = getDb()
    const [row] = await db.select().from(teachers).where(eq(teachers.id, id)).limit(1)
    return row ?? null
  }

  async getActive() {
    const teacherId = await this.settingsSvc.get('active_teacher_id')
    if (!teacherId) return null
    return this.get(teacherId)
  }

  async setActive(id: string) {
    await this.settingsSvc.set('active_teacher_id', id)
  }

  async create(data: TeacherInsert) {
    const db = getDb()
    const id = newId()

    await db.insert(teachers).values({
      id,
      name: data.name,
      email: data.email ?? null,
      schoolId: data.schoolId ?? null,
      gradeLevels: data.gradeLevels ? JSON.stringify(data.gradeLevels) : null,
      subjects: data.subjects ? JSON.stringify(data.subjects) : null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      zip: data.zip ?? null,
      lastActive: new Date()
    })

    return id
  }

  async update(id: string, data: Partial<TeacherInsert>) {
    const db = getDb()
    const updates: Record<string, any> = {}

    if (data.name !== undefined) updates.name = data.name
    if (data.email !== undefined) updates.email = data.email
    if (data.schoolId !== undefined) updates.schoolId = data.schoolId
    if (data.gradeLevels !== undefined) updates.gradeLevels = JSON.stringify(data.gradeLevels)
    if (data.subjects !== undefined) updates.subjects = JSON.stringify(data.subjects)
    if (data.lat !== undefined) updates.lat = data.lat
    if (data.lng !== undefined) updates.lng = data.lng
    if (data.zip !== undefined) updates.zip = data.zip

    if (Object.keys(updates).length > 0) {
      await db.update(teachers).set(updates).where(eq(teachers.id, id))
    }
  }
}
