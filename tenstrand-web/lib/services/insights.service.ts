import { getRawClient } from '@/lib/db'
import { MatchingService } from './matching.service'

export class InsightsService {
  private matchingSvc = new MatchingService()

  async getOverview() {
    const client = getRawClient()
    const [p, prg, t, s, d, b, e, gp, ap, fp] = await Promise.all([
      client.execute("SELECT COUNT(*) as n FROM partners"),
      client.execute("SELECT COUNT(*) as n FROM programs"),
      client.execute("SELECT COUNT(*) as n FROM teachers"),
      client.execute("SELECT COUNT(*) as n FROM schools"),
      client.execute("SELECT COUNT(*) as n FROM districts"),
      client.execute("SELECT COUNT(*) as n FROM bookmarks"),
      client.execute("SELECT COUNT(*) as n FROM engagements"),
      client.execute("SELECT COUNT(*) as n FROM partners WHERE geocoding_status='success'"),
      client.execute("SELECT COUNT(*) as n FROM partners WHERE status='active'"),
      client.execute("SELECT COUNT(*) as n FROM programs WHERE cost=0 OR cost IS NULL"),
    ])
    return {
      partners: Number(p.rows[0].n),
      programs: Number(prg.rows[0].n),
      teachers: Number(t.rows[0].n),
      schools: Number(s.rows[0].n),
      districts: Number(d.rows[0].n),
      bookmarks: Number(b.rows[0].n),
      engagements: Number(e.rows[0].n),
      geocodedPartners: Number(gp.rows[0].n),
      activePartners: Number(ap.rows[0].n),
      freePrograms: Number(fp.rows[0].n),
    }
  }

  async getProgramsBySubject() {
    const client = getRawClient()
    const rows = (await client.execute("SELECT subjects FROM programs WHERE subjects IS NOT NULL")).rows
    const counts: Record<string, number> = {}
    for (const r of rows) {
      try { for (const s of JSON.parse(r.subjects as string)) counts[s] = (counts[s] || 0) + 1 } catch {}
    }
    return Object.entries(counts).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count)
  }

  async getProgramsByGrade() {
    const client = getRawClient()
    const rows = (await client.execute("SELECT grade_levels FROM programs WHERE grade_levels IS NOT NULL")).rows
    const counts: Record<string, number> = {}
    for (const r of rows) {
      try { for (const g of JSON.parse(r.grade_levels as string)) counts[g] = (counts[g] || 0) + 1 } catch {}
    }
    const order = ['TK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    return Object.entries(counts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => order.indexOf(a.grade) - order.indexOf(b.grade))
  }

  async getPartnerTypeBreakdown() {
    const client = getRawClient()
    const rows = (await client.execute("SELECT type, COUNT(*) as count FROM partners GROUP BY type ORDER BY count DESC")).rows
    return rows.map(r => ({ type: r.type as string, label: this.partnerTypeName(r.type as string), count: Number(r.count) }))
  }

  async getTeacherOpportunitySummary(teacherId: string, radiusMiles = 30) {
    const client = getRawClient()
    const teacher = (await client.execute({
      sql: `SELECT t.id, t.school_id, s.enrollment, s.name as school_name
            FROM teachers t
            LEFT JOIN schools s ON s.id = t.school_id
            WHERE t.id = ?`,
      args: [teacherId]
    })).rows[0]
    if (!teacher) return { matchedPrograms: 0, reachableStudents: 0, schoolName: null, nearbySchools: 0 }

    const matches = await this.matchingSvc.listForTeacher(teacherId, radiusMiles)
    const nearbySchoolIds = new Set<string>()
    let reachableStudents = 0

    for (const match of matches) {
      if (!match.programId) continue
      const schools = await this.getNearbySchoolsForProgram(match.programId, radiusMiles)
      for (const school of schools as any[]) {
        if (nearbySchoolIds.has(school.id as string)) continue
        nearbySchoolIds.add(school.id as string)
        reachableStudents += Number(school.enrollment ?? 0)
      }
    }

    return {
      matchedPrograms: matches.length,
      reachableStudents: reachableStudents || Number(teacher.enrollment ?? 0),
      schoolName: teacher.school_name as string | null,
      nearbySchools: nearbySchoolIds.size,
    }
  }

  async getProgramsForMap() {
    const client = getRawClient()
    const rows = (await client.execute(`
      SELECT p.id, p.title, p.grade_levels, p.subjects, p.cost, p.season,
             p.max_students, p.duration_mins,
             pa.id as partner_id, pa.name as partner_name, pa.type as partner_type,
             pa.lat, pa.lng, pa.county
      FROM programs p
      JOIN partners pa ON p.partner_id = pa.id
      WHERE pa.lat IS NOT NULL AND pa.lng IS NOT NULL AND pa.status='active'
    `)).rows
    return rows
  }

  async getSchoolsForMap() {
    const client = getRawClient()
    const rows = (await client.execute(`
      SELECT s.id, s.name, s.lat, s.lng, s.enrollment, s.city, s.county,
             d.name as district_name
      FROM schools s
      LEFT JOIN districts d ON s.district_id = d.id
      WHERE s.lat IS NOT NULL AND s.lng IS NOT NULL
    `)).rows
    return rows
  }

  async getTeachersWithSchool() {
    const client = getRawClient()
    const rows = (await client.execute(`
      SELECT t.id, t.name, t.email, t.grade_levels, t.subjects, t.lat, t.lng,
             s.id as school_id, s.name as school_name, s.enrollment,
             s.lat as school_lat, s.lng as school_lng, s.city as school_city, s.county as school_county
      FROM teachers t
      LEFT JOIN schools s ON t.school_id = s.id
    `)).rows
    return rows
  }

  async getNearbyTeachersForProgram(programId: string, radiusMiles = 30) {
    const client = getRawClient()
    const prog = (await client.execute({
      sql: `SELECT pa.lat, pa.lng, p.grade_levels, p.subjects
            FROM programs p JOIN partners pa ON p.partner_id = pa.id
            WHERE p.id = ?`,
      args: [programId]
    })).rows[0]
    if (!prog?.lat || !prog?.lng) return []

    const teachers = (await client.execute(`
      SELECT t.id, t.name, t.grade_levels, t.subjects,
             s.name as school_name, s.enrollment, s.lat as slat, s.lng as slng, s.city as school_city
      FROM teachers t
      LEFT JOIN schools s ON t.school_id = s.id
      WHERE s.lat IS NOT NULL AND s.lng IS NOT NULL
    `)).rows

    const R = 3958.8
    const pLat = Number(prog.lat) * Math.PI / 180
    const pLng = Number(prog.lng) * Math.PI / 180
    const progGrades: string[] = (() => { try { return JSON.parse(prog.grade_levels as string) } catch { return [] } })()
    const progSubjects: string[] = (() => { try { return JSON.parse(prog.subjects as string) } catch { return [] } })()

    const nearby: any[] = []
    for (const t of teachers) {
      const tLat = Number(t.slat) * Math.PI / 180
      const tLng = Number(t.slng) * Math.PI / 180
      const a = Math.sin((tLat - pLat) / 2) ** 2 + Math.cos(pLat) * Math.cos(tLat) * Math.sin((tLng - pLng) / 2) ** 2
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      if (dist <= radiusMiles) {
        const tGrades: string[] = (() => { try { return JSON.parse(t.grade_levels as string) } catch { return [] } })()
        const tSubjects: string[] = (() => { try { return JSON.parse(t.subjects as string) } catch { return [] } })()
        const gradeMatch = progGrades.length === 0 || tGrades.some(g => progGrades.includes(g))
        const subjectMatch = progSubjects.length === 0 || tSubjects.some(s => progSubjects.includes(s))
        nearby.push({ ...t, distanceMiles: Math.round(dist * 10) / 10, gradeMatch, subjectMatch, score: (gradeMatch ? 1 : 0) + (subjectMatch ? 1 : 0) })
      }
    }
    return nearby.sort((a, b) => b.score - a.score || a.distanceMiles - b.distanceMiles)
  }

  async getNearbySchoolsForProgram(programId: string, radiusMiles = 30) {
    const client = getRawClient()
    const prog = (await client.execute({
      sql: `SELECT pa.lat, pa.lng FROM programs p JOIN partners pa ON p.partner_id = pa.id WHERE p.id = ?`,
      args: [programId]
    })).rows[0]
    if (!prog?.lat || !prog?.lng) return []

    const schools = (await client.execute(
      "SELECT id, name, lat, lng, enrollment, city, county FROM schools WHERE lat IS NOT NULL AND lng IS NOT NULL"
    )).rows

    const R = 3958.8
    const pLat = Number(prog.lat) * Math.PI / 180
    const pLng = Number(prog.lng) * Math.PI / 180
    const nearby: any[] = []
    for (const s of schools) {
      const sLat = Number(s.lat) * Math.PI / 180
      const sLng = Number(s.lng) * Math.PI / 180
      const a = Math.sin((sLat - pLat) / 2) ** 2 + Math.cos(pLat) * Math.cos(sLat) * Math.sin((sLng - pLng) / 2) ** 2
      const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      if (dist <= radiusMiles) nearby.push({ ...s, distanceMiles: Math.round(dist * 10) / 10 })
    }
    return nearby.sort((a, b) => a.distanceMiles - b.distanceMiles).slice(0, 20)
  }

  async getTopPrograms(limit = 5) {
    const client = getRawClient()
    const rows = (await client.execute({
      sql: `SELECT p.id, p.title, pa.name as partner_name,
                   COUNT(DISTINCT b.id) as bookmark_count,
                   COUNT(DISTINCT e.id) as engagement_count
            FROM programs p
            JOIN partners pa ON p.partner_id = pa.id
            LEFT JOIN bookmarks b ON p.id = b.program_id
            LEFT JOIN engagements e ON p.id = e.program_id
            GROUP BY p.id
            ORDER BY engagement_count DESC, bookmark_count DESC
            LIMIT ?`,
      args: [limit]
    })).rows
    return rows.map(r => ({ ...r, bookmark_count: Number(r.bookmark_count), engagement_count: Number(r.engagement_count) }))
  }

  async getCountyCoverage() {
    const client = getRawClient()
    const rows = (await client.execute(`
      SELECT pa.county, COUNT(DISTINCT pa.id) as partner_count, COUNT(DISTINCT p.id) as program_count
      FROM partners pa
      LEFT JOIN programs p ON p.partner_id = pa.id
      WHERE pa.county IS NOT NULL AND pa.status='active'
      GROUP BY pa.county
      ORDER BY program_count DESC
    `)).rows
    return rows.map(r => ({ county: r.county as string, partners: Number(r.partner_count), programs: Number(r.program_count) }))
  }

  async getDistrictAnalytics() {
    const client = getRawClient()
    const [districtRows, subjectRows, teacherRows, countyRows] = await Promise.all([
      client.execute(`
        SELECT d.id, d.name, d.county, d.enrollment_total,
               COUNT(DISTINCT s.id) as school_count,
               COUNT(DISTINCT t.id) as teacher_count,
               COALESCE(SUM(s.enrollment), 0) as school_enrollment,
               SUM(CASE WHEN s.title1_flag = 1 THEN 1 ELSE 0 END) as title1_schools
        FROM districts d
        LEFT JOIN schools s ON s.district_id = d.id
        LEFT JOIN teachers t ON t.school_id = s.id
        GROUP BY d.id
        ORDER BY school_count DESC, teacher_count DESC
      `),
      client.execute("SELECT subjects FROM teachers WHERE subjects IS NOT NULL"),
      client.execute(`
        SELECT COALESCE(s.county, 'Unknown') as county, COUNT(DISTINCT t.id) as teachers
        FROM teachers t
        LEFT JOIN schools s ON t.school_id = s.id
        GROUP BY COALESCE(s.county, 'Unknown')
        ORDER BY teachers DESC
      `),
      client.execute(`
        SELECT COALESCE(s.county, 'Unknown') as county,
               COUNT(DISTINCT s.id) as schools,
               COALESCE(SUM(s.enrollment), 0) as enrollment
        FROM schools s
        GROUP BY COALESCE(s.county, 'Unknown')
        ORDER BY schools DESC
      `),
    ])

    const subjectCounts: Record<string, number> = {}
    for (const r of subjectRows.rows) {
      try {
        for (const subject of JSON.parse(r.subjects as string)) {
          subjectCounts[subject] = (subjectCounts[subject] || 0) + 1
        }
      } catch {}
    }

    return {
      districts: districtRows.rows.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        county: r.county as string | null,
        enrollment: Number(r.enrollment_total ?? r.school_enrollment ?? 0),
        schools: Number(r.school_count),
        teachers: Number(r.teacher_count),
        title1Schools: Number(r.title1_schools ?? 0),
      })),
      subjects: Object.entries(subjectCounts)
        .map(([subject, teachers]) => ({ subject, teachers }))
        .sort((a, b) => b.teachers - a.teachers),
      teacherCounties: teacherRows.rows.map((r) => ({ county: r.county as string, teachers: Number(r.teachers) })),
      schoolCounties: countyRows.rows.map((r) => ({ county: r.county as string, schools: Number(r.schools), enrollment: Number(r.enrollment) })),
    }
  }

  async getEquityCoverage() {
    const client = getRawClient()
    const [countyPrograms, countySchools] = await Promise.all([
      client.execute(`
        SELECT pa.county, COUNT(DISTINCT p.id) as programs, COUNT(DISTINCT pa.id) as partners
        FROM partners pa
        LEFT JOIN programs p ON p.partner_id = pa.id
        WHERE pa.county IS NOT NULL AND pa.status = 'active'
        GROUP BY pa.county
      `),
      client.execute(`
        SELECT county, COUNT(*) as schools,
               SUM(title1_flag) as title1_schools,
               COALESCE(SUM(enrollment), 0) as enrollment
        FROM schools WHERE county IS NOT NULL
        GROUP BY county
      `),
    ])

    // CalEnviroScreen burden index (0-100, higher = more burdened) — public data estimates
    const enviroScreen: Record<string, number> = {
      'Kern': 88, 'Fresno': 85, 'Kings': 80, 'Tulare': 79, 'Madera': 75,
      'Merced': 73, 'San Bernardino': 68, 'Stanislaus': 65, 'San Joaquin': 64,
      'Los Angeles': 61, 'Riverside': 58, 'Alameda': 55, 'Imperial': 82,
      'Colusa': 60, 'Sutter': 58, 'Yolo': 50, 'Sacramento': 52,
      'San Diego': 40, 'Ventura': 38, 'Orange': 35, 'Contra Costa': 48,
      'Santa Clara': 32, 'San Francisco': 45, 'San Mateo': 28,
      'Marin': 20, 'Santa Cruz': 30, 'Monterey': 48, 'Santa Barbara': 35,
      'Trinity': 55, 'Siskiyou': 50, 'Del Norte': 62, 'Lassen': 48,
      'Modoc': 45, 'Alpine': 30, 'Plumas': 40, 'Sierra': 35, 'Inyo': 38, 'Mono': 33,
      'Shasta': 52, 'Tehama': 55, 'Glenn': 58, 'Butte': 50, 'Nevada': 35, 'Placer': 28,
      'El Dorado': 30, 'Amador': 38, 'Calaveras': 40, 'Tuolumne': 42,
      'Mendocino': 50, 'Lake': 55, 'Humboldt': 45, 'Napa': 32, 'Sonoma': 35,
      'Solano': 48, 'San Luis Obispo': 30, 'San Benito': 52, 'Mariposa': 40,
    }

    // Rural classification
    const ruralCounties = new Set(['Alpine','Lassen','Modoc','Trinity','Siskiyou','Del Norte','Plumas','Sierra','Inyo','Mono','Colusa','Glenn','Tehama','Lake','Mendocino','Humboldt','Mariposa','Tuolumne','Calaveras','Amador'])

    const schoolMap: Record<string, { schools: number; title1: number; enrollment: number }> = {}
    for (const r of countySchools.rows) {
      schoolMap[r.county as string] = { schools: Number(r.schools), title1: Number(r.title1_schools ?? 0), enrollment: Number(r.enrollment) }
    }
    const programMap: Record<string, { programs: number; partners: number }> = {}
    for (const r of countyPrograms.rows) {
      programMap[r.county as string] = { programs: Number(r.programs), partners: Number(r.partners) }
    }

    // Collect all counties from both datasets
    const allCounties = new Set([...Object.keys(schoolMap), ...Object.keys(programMap)])
    const results = Array.from(allCounties).map((county) => {
      const s = schoolMap[county] ?? { schools: 0, title1: 0, enrollment: 0 }
      const p = programMap[county] ?? { programs: 0, partners: 0 }
      const title1Pct = s.schools > 0 ? Math.round((s.title1 / s.schools) * 100) : 0
      const programsPerSchool = s.schools > 0 ? +(p.programs / s.schools).toFixed(2) : 0
      const burden = enviroScreen[county] ?? 40
      const isRural = ruralCounties.has(county)
      // Priority = high burden + high title1 + low coverage + rural bonus
      const coverageGap = Math.max(0, 100 - programsPerSchool * 50)
      const priority = Math.round((burden * 0.35) + (title1Pct * 0.3) + (coverageGap * 0.25) + (isRural ? 10 : 0))
      return { county, programs: p.programs, partners: p.partners, schools: s.schools, enrollment: s.enrollment, title1Pct, programsPerSchool, burden, isRural, priority }
    })

    return results.sort((a, b) => b.priority - a.priority)
  }

  private partnerTypeName(type: string): string {
    const names: Record<string, string> = {
      wetlands: 'Wetlands',
      agriculture: 'Agriculture',
      urban_ecology: 'Urban Ecology',
      climate_justice: 'Climate Justice',
      indigenous_knowledge: 'Indigenous Knowledge',
      general: 'General'
    }
    return names[type] ?? 'General'
  }
}
