import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { partners, programs, programStandards } from '../schema'
import { newId } from './uuid'

export type ProgramInsert = {
  partnerId: string
  title: string
  description?: string
  gradeLevels?: string[]
  subjects?: string[]
  maxStudents?: number
  durationMins?: number
  cost?: number
  season?: string[]
  lat?: number
  lng?: number
  standards?: { code: string; desc?: string; framework: string }[]
}

export class ProgramService {
  async list(filters?: { partnerId?: string }) {
    const db = getDb()
    if (filters?.partnerId) {
      return db.select().from(programs).where(eq(programs.partnerId, filters.partnerId))
    }
    return db.select().from(programs).orderBy(programs.title)
  }

  async get(id: string) {
    const db = getDb()
    const [program] = await db
      .select({
        id: programs.id,
        partnerId: programs.partnerId,
        title: programs.title,
        description: programs.description,
        gradeLevels: programs.gradeLevels,
        subjects: programs.subjects,
        maxStudents: programs.maxStudents,
        durationMins: programs.durationMins,
        cost: programs.cost,
        season: programs.season,
        lat: programs.lat,
        lng: programs.lng,
        createdAt: programs.createdAt,
        partnerName: partners.name,
      })
      .from(programs)
      .leftJoin(partners, eq(programs.partnerId, partners.id))
      .where(eq(programs.id, id))
      .limit(1)
    if (!program) return null

    const standards = await db
      .select()
      .from(programStandards)
      .where(eq(programStandards.programId, id))

    return { ...program, standards }
  }

  async create(data: ProgramInsert) {
    const db = getDb()
    const id = newId()

    await db.insert(programs).values({
      id,
      partnerId: data.partnerId,
      title: data.title,
      description: data.description ?? null,
      gradeLevels: data.gradeLevels ? JSON.stringify(data.gradeLevels) : null,
      subjects: data.subjects ? JSON.stringify(data.subjects) : null,
      maxStudents: data.maxStudents ?? null,
      durationMins: data.durationMins ?? null,
      cost: data.cost ?? 0,
      season: data.season ? JSON.stringify(data.season) : null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      createdAt: new Date()
    })

    if (data.standards && data.standards.length > 0) {
      await db.insert(programStandards).values(
        data.standards.map((s) => ({
          id: newId(),
          programId: id,
          standardCode: s.code,
          standardDesc: s.desc ?? null,
          framework: s.framework
        }))
      )
    }

    return id
  }

  async update(id: string, data: Partial<ProgramInsert>) {
    const db = getDb()
    const updates: Record<string, any> = {}

    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description
    if (data.gradeLevels !== undefined) updates.gradeLevels = JSON.stringify(data.gradeLevels)
    if (data.subjects !== undefined) updates.subjects = JSON.stringify(data.subjects)
    if (data.maxStudents !== undefined) updates.maxStudents = data.maxStudents
    if (data.durationMins !== undefined) updates.durationMins = data.durationMins
    if (data.cost !== undefined) updates.cost = data.cost
    if (data.season !== undefined) updates.season = JSON.stringify(data.season)
    if (data.lat !== undefined) updates.lat = data.lat
    if (data.lng !== undefined) updates.lng = data.lng

    if (Object.keys(updates).length > 0) {
      await db.update(programs).set(updates).where(eq(programs.id, id))
    }

    if (data.standards !== undefined) {
      await db.delete(programStandards).where(eq(programStandards.programId, id))
      if (data.standards.length > 0) {
        await db.insert(programStandards).values(
          data.standards.map((s) => ({
            id: newId(),
            programId: id,
            standardCode: s.code,
            standardDesc: s.desc ?? null,
            framework: s.framework
          }))
        )
      }
    }
  }

  async delete(id: string) {
    const db = getDb()
    await db.delete(programStandards).where(eq(programStandards.programId, id))
    await db.delete(programs).where(eq(programs.id, id))
  }

  async getStandards(programId: string) {
    const db = getDb()
    return db.select().from(programStandards).where(eq(programStandards.programId, programId))
  }
}
