import Papa from 'papaparse'
import { getDb } from '../db'
import { teachers, schools, districts, partners, programs } from '../schema'
import { newId } from './uuid'
import { geocodeAndUpdate } from './geocoding.service'

export type ImportEntity = 'teachers' | 'schools' | 'districts' | 'partners' | 'programs'
export type ColumnMap = Record<string, string>
export type ImportResult = { inserted: number; skipped: number; errors: string[] }

export class CsvImportService {
  parsePreview(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    const result = Papa.parse<Record<string, string>>(csvText, { header: true, preview: 10 })
    const rows = result.data.filter((r) => Object.keys(r).length > 0)
    const headers = rows.length > 0 ? Object.keys(rows[0]) : []
    return { headers, rows }
  }

  async runImport(csvText: string, entity: ImportEntity, columnMap: ColumnMap): Promise<ImportResult> {
    const result: ImportResult = { inserted: 0, skipped: 0, errors: [] }
    const parsed = Papa.parse<Record<string, string>>(csvText, { header: true })
    const rows = parsed.data.filter((r) => Object.keys(r).some((k) => r[k]?.trim()))

    const mapped = rows.map((row) => {
      const out: Record<string, any> = { id: newId() }
      for (const [csvCol, schemaField] of Object.entries(columnMap)) {
        const val = row[csvCol]?.trim()
        out[schemaField] = val || null
      }
      return out
    })

    for (const row of mapped) {
      try {
        switch (entity) {
          case 'partners': await this.insertPartner(row, result); break
          case 'programs': await this.insertProgram(row, result); break
          case 'teachers': await this.insertTeacher(row, result); break
          case 'schools': await this.insertSchool(row, result); break
          case 'districts': await this.insertDistrict(row, result); break
        }
      } catch (err: any) {
        result.skipped++
        result.errors.push(`Row error: ${err.message}`)
      }
    }

    return result
  }

  private async insertPartner(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    const hasCoords = row.lat && row.lng
    const geocodingStatus = hasCoords ? 'manual' : row.address ? 'pending' : 'failed'
    const id = row.id || newId()

    await db.insert(partners).values({
      id, name: row.name, type: row.type || 'general',
      description: row.description || null, address: row.address || null,
      lat: hasCoords ? parseFloat(row.lat) : null, lng: hasCoords ? parseFloat(row.lng) : null,
      county: row.county || null, contactEmail: row.contact_email || row.contactEmail || null,
      website: row.website || null, status: row.status || 'active',
      profileScore: 0, geocodingStatus
    }).onConflictDoNothing()

    if (geocodingStatus === 'pending' && row.address) {
      geocodeAndUpdate('partners', id, row.address).catch(() => {})
    }
    result.inserted++
  }

  private async insertProgram(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.title || !row.partner_id) { result.skipped++; return }

    await db.insert(programs).values({
      id: row.id || newId(), partnerId: row.partner_id, title: row.title,
      description: row.description || null, gradeLevels: row.grade_levels || null,
      subjects: row.subjects || null, maxStudents: row.max_students ? parseInt(row.max_students) : null,
      durationMins: row.duration_mins ? parseInt(row.duration_mins) : null,
      cost: row.cost ? parseFloat(row.cost) : 0, season: row.season || null,
      lat: row.lat ? parseFloat(row.lat) : null, lng: row.lng ? parseFloat(row.lng) : null,
      createdAt: new Date()
    }).onConflictDoNothing()
    result.inserted++
  }

  private async insertTeacher(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    await db.insert(teachers).values({
      id: row.id || newId(), name: row.name, email: row.email || null,
      schoolId: row.school_id || null, gradeLevels: row.grade_levels || null,
      subjects: row.subjects || null, lat: row.lat ? parseFloat(row.lat) : null,
      lng: row.lng ? parseFloat(row.lng) : null, zip: row.zip || null,
      lastActive: new Date()
    }).onConflictDoNothing()
    result.inserted++
  }

  private async insertSchool(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    const hasCoords = row.lat && row.lng
    const geocodingStatus = hasCoords ? 'manual' : row.address ? 'pending' : 'failed'
    const id = row.id || newId()

    await db.insert(schools).values({
      id, name: row.name, districtId: row.district_id || null,
      address: row.address || null, city: row.city || null, county: row.county || null,
      lat: hasCoords ? parseFloat(row.lat) : null, lng: hasCoords ? parseFloat(row.lng) : null,
      enrollment: row.enrollment ? parseInt(row.enrollment) : null,
      title1Flag: row.title1_flag === 'true' || row.title1_flag === '1',
      geocodingStatus
    }).onConflictDoNothing()

    if (geocodingStatus === 'pending' && row.address) {
      geocodeAndUpdate('schools', id, row.address).catch(() => {})
    }
    result.inserted++
  }

  private async insertDistrict(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    await db.insert(districts).values({
      id: row.id || newId(), name: row.name, county: row.county || null,
      superintendentEmail: row.superintendent_email || null,
      enrollmentTotal: row.enrollment_total ? parseInt(row.enrollment_total) : null
    }).onConflictDoNothing()
    result.inserted++
  }
}
