import { getSqlite } from '../db'
import { TeacherService } from './teacher.service'

// Haversine formula — returns distance in miles
function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8 // Earth radius in miles
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
  scoreBreakdown: {
    geo: number
    grade: number
    subject: number
    standards: number
    season: number
    engagement: number
  }
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

  async listForTeacher(
    teacherId: string,
    radiusMiles: number,
    filters?: MapFilters
  ): Promise<MatchResult[]> {
    const teacher = await this.teacherSvc.get(teacherId)
    if (!teacher) return []

    const teacherLat = teacher.lat
    const teacherLng = teacher.lng
    if (!teacherLat || !teacherLng) return []

    // Bounding box pre-filter (~1 degree lat/lng ≈ 69 miles)
    const degBuffer = (radiusMiles / 69) * 1.1
    const minLat = teacherLat - degBuffer
    const maxLat = teacherLat + degBuffer
    const minLng = teacherLng - degBuffer
    const maxLng = teacherLng + degBuffer

    const sqlite = getSqlite()
    const rows = sqlite
      .prepare(
        `SELECT p.id, p.partner_id, pt.name as partner_name, p.title, p.description,
          p.cost, p.grade_levels, p.subjects, p.season, p.lat, p.lng, p.max_students
         FROM programs p
         JOIN partners pt ON pt.id = p.partner_id
         WHERE pt.status = 'active'
           AND p.lat BETWEEN ? AND ?
           AND p.lng BETWEEN ? AND ?`
      )
      .all(minLat, maxLat, minLng, maxLng) as any[]

    const teacherGrades: string[] = this.parseJson(teacher.gradeLevels)
    const teacherSubjects: string[] = this.parseJson(teacher.subjects)

    // Get engagement history for past engagement score
    const engagements = sqlite
      .prepare(
        `SELECT DISTINCT program_id FROM engagements WHERE teacher_id = ?`
      )
      .all(teacherId) as { program_id: string }[]
    const engagedProgramIds = new Set(engagements.map((e) => e.program_id))

    // Get standards for programs in bounding box
    const programIds = rows.map((r: any) => r.id)
    const standardsMap = new Map<string, string[]>()
    if (programIds.length > 0) {
      const placeholders = programIds.map(() => '?').join(',')
      const stdRows = sqlite
        .prepare(
          `SELECT program_id, standard_code FROM program_standards WHERE program_id IN (${placeholders})`
        )
        .all(...programIds) as { program_id: string; standard_code: string }[]
      for (const s of stdRows) {
        if (!standardsMap.has(s.program_id)) standardsMap.set(s.program_id, [])
        standardsMap.get(s.program_id)!.push(s.standard_code)
      }
    }

    const currentMonth = new Date().getMonth() + 1
    const currentSeasonKey = this.getCurrentSeason(currentMonth)

    const results: MatchResult[] = []

    for (const row of rows) {
      const progLat = row.lat as number
      const progLng = row.lng as number

      // Distance in miles
      const distMiles = haversineMiles(teacherLat, teacherLng, progLat, progLng)

      if (distMiles > radiusMiles) continue

      const programGrades: string[] = this.parseJson(row.grade_levels)
      const programSubjects: string[] = this.parseJson(row.subjects)
      const programSeasons: string[] = this.parseJson(row.season)
      const programStandards: string[] = standardsMap.get(row.id) ?? []

      // Apply filters
      if (filters) {
        if (
          filters.gradeBands &&
          filters.gradeBands.length > 0 &&
          !this.overlaps(programGrades, filters.gradeBands)
        )
          continue
        if (
          filters.subjects &&
          filters.subjects.length > 0 &&
          !this.overlaps(programSubjects, filters.subjects)
        )
          continue
        if (
          filters.seasons &&
          filters.seasons.length > 0 &&
          !this.overlaps(programSeasons, filters.seasons)
        )
          continue
        if (filters.cost && filters.cost !== 'all') {
          const cost = row.cost ?? 0
          if (filters.cost === 'free' && cost > 0) continue
          if (filters.cost === 'low' && (cost <= 0 || cost > 10)) continue
          if (filters.cost === 'moderate' && cost <= 10) continue
        }
        if (filters.groupSize && filters.groupSize !== 'all' && row.max_students != null) {
          const g = row.max_students
          if (filters.groupSize === '<30' && g >= 30) continue
          if (filters.groupSize === '30-60' && (g < 30 || g > 60)) continue
          if (filters.groupSize === '60+' && g <= 60) continue
        }
        if (filters.standards && filters.standards.length > 0) {
          if (!this.overlaps(programStandards, filters.standards)) continue
        }
      }

      // Scoring
      const geo = Math.max(0, 1 - distMiles / radiusMiles)
      const grade =
        teacherGrades.length > 0
          ? this.intersectionRatio(teacherGrades, programGrades)
          : programGrades.length > 0
            ? 0.5
            : 0.5
      const subject =
        teacherSubjects.length > 0
          ? this.intersectionRatio(teacherSubjects, programSubjects)
          : 0.5
      const standards = 0.5 // no active unit in Phase 1
      const season = programSeasons.length === 0 || programSeasons.includes(currentSeasonKey) ? 1 : 0
      const eng = engagedProgramIds.has(row.id) ? 1 : 0

      const score =
        geo * 0.35 +
        grade * 0.2 +
        subject * 0.2 +
        standards * 0.15 +
        season * 0.05 +
        eng * 0.05

      results.push({
        programId: row.id,
        partnerId: row.partner_id,
        partnerName: row.partner_name,
        title: row.title,
        description: row.description,
        cost: row.cost,
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

    const sqlite = getSqlite()
    const row = sqlite
      .prepare(
        `SELECT p.*, pt.name as partner_name FROM programs p
         JOIN partners pt ON pt.id = p.partner_id WHERE p.id = ?`
      )
      .get(programId) as any
    if (!row || !row.lat || !row.lng) return 0

    const distMiles = haversineMiles(teacher.lat!, teacher.lng!, row.lat, row.lng)
    const defaultRadius = 20
    const geo = Math.max(0, 1 - distMiles / defaultRadius)

    return geo
  }

  private parseJson(value: string | null | undefined): string[] {
    if (!value) return []
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }

  private overlaps(a: string[], b: string[]): boolean {
    return a.some((x) => b.includes(x))
  }

  private intersectionRatio(teacher: string[], program: string[]): number {
    if (teacher.length === 0 || program.length === 0) return 0.5
    const intersection = teacher.filter((x) => program.includes(x))
    return intersection.length / teacher.length
  }

  private getCurrentSeason(month: number): string {
    if (month >= 3 && month <= 5) return 'Spring'
    if (month >= 6 && month <= 8) return 'Summer'
    if (month >= 9 && month <= 11) return 'Fall'
    return 'Winter'
  }
}
