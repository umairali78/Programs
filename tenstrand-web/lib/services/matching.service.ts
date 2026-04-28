import { getRawClient } from '../db'
import { TeacherService } from './teacher.service'

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface MatchResult {
  programId: string
  partnerId: string
  partnerName: string
  title: string
  description: string | null
  cost: number | null
  gradeLevels: string[]
  subjects: string[]
  season: string[]
  lat: number | null
  lng: number | null
  score: number
  scoreBreakdown: { geo: number; grade: number; subject: number; standards: number; season: number; engagement: number }
  distanceMiles: number | null
}

export interface MapFilters {
  gradeBands?: string[]
  subjects?: string[]
  standards?: string[]
  seasons?: string[]
  cost?: 'free' | 'low' | 'moderate' | 'all'
  groupSize?: '<30' | '30-60' | '60+' | 'all'
}

export class MatchingService {
  private teacherSvc = new TeacherService()

  async listForTeacher(teacherId: string, radiusMiles: number, filters?: MapFilters): Promise<MatchResult[]> {
    const teacher = await this.teacherSvc.get(teacherId)
    if (!teacher?.lat || !teacher?.lng) return []

    const teacherLat = teacher.lat
    const teacherLng = teacher.lng

    const degBuffer = (radiusMiles / 69) * 1.1
    const minLat = teacherLat - degBuffer
    const maxLat = teacherLat + degBuffer
    const minLng = teacherLng - degBuffer
    const maxLng = teacherLng + degBuffer

    const client = getRawClient()

    const rowsResult = await client.execute({
      sql: `SELECT p.id, p.partner_id, pt.name as partner_name, p.title, p.description,
              p.cost, p.grade_levels, p.subjects, p.season, p.max_students,
              COALESCE(p.lat, pt.lat) as lat,
              COALESCE(p.lng, pt.lng) as lng
             FROM programs p
             JOIN partners pt ON pt.id = p.partner_id
             WHERE pt.status = 'active'
               AND COALESCE(p.lat, pt.lat) BETWEEN ? AND ?
               AND COALESCE(p.lng, pt.lng) BETWEEN ? AND ?`,
      args: [minLat, maxLat, minLng, maxLng]
    })
    const rows = rowsResult.rows as any[]

    const teacherGrades: string[] = this.parseJson(teacher.gradeLevels)
    const teacherSubjects: string[] = this.parseJson(teacher.subjects)

    const engResult = await client.execute({
      sql: `SELECT DISTINCT program_id FROM engagements WHERE teacher_id = ?`,
      args: [teacherId]
    })
    const engagedProgramIds = new Set(engResult.rows.map((e: any) => e.program_id as string))

    const programIds = rows.map((r: any) => r.id as string)
    const standardsMap = new Map<string, string[]>()
    if (programIds.length > 0) {
      const placeholders = programIds.map(() => '?').join(',')
      const stdResult = await client.execute({
        sql: `SELECT program_id, standard_code FROM program_standards WHERE program_id IN (${placeholders})`,
        args: programIds
      })
      for (const s of stdResult.rows as any[]) {
        if (!standardsMap.has(s.program_id)) standardsMap.set(s.program_id, [])
        standardsMap.get(s.program_id)!.push(s.standard_code)
      }
    }

    const currentMonth = new Date().getMonth() + 1
    const currentSeason = this.getCurrentSeason(currentMonth)

    const results: MatchResult[] = []

    for (const row of rows) {
      const progLat = row.lat as number
      const progLng = row.lng as number
      const distMiles = haversineMiles(teacherLat, teacherLng, progLat, progLng)
      if (distMiles > radiusMiles) continue

      const programGrades: string[] = this.parseJson(row.grade_levels)
      const programSubjects: string[] = this.parseJson(row.subjects)
      const programSeasons: string[] = this.parseJson(row.season)
      const programStandards: string[] = standardsMap.get(row.id as string) ?? []

      if (filters) {
        if (filters.gradeBands?.length && !this.overlaps(programGrades, filters.gradeBands)) continue
        if (filters.subjects?.length && !this.overlaps(programSubjects, filters.subjects)) continue
        if (filters.seasons?.length && !this.overlaps(programSeasons, filters.seasons)) continue
        if (filters.cost && filters.cost !== 'all') {
          const cost = (row.cost as number) ?? 0
          if (filters.cost === 'free' && cost > 0) continue
          if (filters.cost === 'low' && (cost <= 0 || cost > 10)) continue
          if (filters.cost === 'moderate' && cost <= 10) continue
        }
        if (filters.groupSize && filters.groupSize !== 'all' && row.max_students != null) {
          const g = row.max_students as number
          if (filters.groupSize === '<30' && g >= 30) continue
          if (filters.groupSize === '30-60' && (g < 30 || g > 60)) continue
          if (filters.groupSize === '60+' && g <= 60) continue
        }
        if (filters.standards?.length && !this.overlaps(programStandards, filters.standards)) continue
      }

      const geo = Math.max(0, 1 - distMiles / radiusMiles)
      const grade = teacherGrades.length > 0 ? this.intersectionRatio(teacherGrades, programGrades) : 0.5
      const subject = teacherSubjects.length > 0 ? this.intersectionRatio(teacherSubjects, programSubjects) : 0.5
      const standards = 0.5
      const season = programSeasons.length === 0 || programSeasons.includes(currentSeason) ? 1 : 0
      const eng = engagedProgramIds.has(row.id as string) ? 1 : 0

      const score = geo * 0.35 + grade * 0.2 + subject * 0.2 + standards * 0.15 + season * 0.05 + eng * 0.05

      results.push({
        programId: row.id as string,
        partnerId: row.partner_id as string,
        partnerName: row.partner_name as string,
        title: row.title as string,
        description: row.description as string | null,
        cost: row.cost as number | null,
        gradeLevels: programGrades,
        subjects: programSubjects,
        season: programSeasons,
        lat: progLat,
        lng: progLng,
        score,
        scoreBreakdown: { geo, grade, subject, standards, season, engagement: eng },
        distanceMiles: Math.round(distMiles * 10) / 10
      })
    }

    return results.sort((a, b) => b.score - a.score)
  }

  async scoreOne(teacherId: string, programId: string): Promise<number> {
    const teacher = await this.teacherSvc.get(teacherId)
    if (!teacher?.lat || !teacher?.lng) return 0

    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT p.*, pt.name as partner_name, COALESCE(p.lat, pt.lat) as eff_lat, COALESCE(p.lng, pt.lng) as eff_lng FROM programs p JOIN partners pt ON pt.id = p.partner_id WHERE p.id = ?`,
      args: [programId]
    })
    const row = result.rows[0] as any
    if (!row?.eff_lat || !row?.eff_lng) return 0

    const distMiles = haversineMiles(teacher.lat!, teacher.lng!, row.eff_lat as number, row.eff_lng as number)
    const geo = Math.max(0, 1 - distMiles / 20)
    return geo
  }

  private parseJson(value: string | null | undefined): string[] {
    if (!value) return []
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : [String(parsed)]
    } catch {
      // plain comma-separated or single value stored without JSON encoding
      return value.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }

  private overlaps(a: string[], b: string[]): boolean {
    return a.some((x) => b.includes(x))
  }

  private intersectionRatio(teacher: string[], program: string[]): number {
    if (teacher.length === 0 || program.length === 0) return 0.5
    return teacher.filter((x) => program.includes(x)).length / teacher.length
  }

  private getCurrentSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'Spring'
    if (month >= 6 && month <= 8) return 'Summer'
    if (month >= 9 && month <= 11) return 'Fall'
    return 'Winter'
  }
}
