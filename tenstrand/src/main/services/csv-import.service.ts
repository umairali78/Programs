import Papa from 'papaparse'
import fs from 'fs'
import { getDb } from '../db'
import { teachers, schools, districts, partners, programs } from '../db/schema'
import { newId } from '../utils/uuid'
import { GeocodingService } from './geocoding.service'
import { BaseService } from './base.service'

export type ImportEntity = 'teachers' | 'schools' | 'districts' | 'partners' | 'programs'

export type ColumnMap = Record<string, string> // csvColumn → schemaField

export type ImportResult = {
  inserted: number
  skipped: number
  errors: string[]
}

export class CsvImportService extends BaseService {
  private geocodingSvc = new GeocodingService()

  async parsePreview(
    filePath: string
  ): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = []
      Papa.parse(fs.createReadStream(filePath), {
        header: true,
        preview: 10,
        step: (result) => {
          rows.push(result.data as Record<string, string>)
        },
        complete: () => {
          const headers = rows.length > 0 ? Object.keys(rows[0]) : []
          resolve({ headers, rows })
        },
        error: reject
      })
    })
  }

  async runImport(
    filePath: string,
    entity: ImportEntity,
    columnMap: ColumnMap,
    onProgress?: (processed: number, total: number) => void
  ): Promise<ImportResult> {
    return new Promise((resolve) => {
      const result: ImportResult = { inserted: 0, skipped: 0, errors: [] }
      let batch: Record<string, string>[] = []
      let totalRows = 0

      const flush = () => {
        if (batch.length === 0) return
        try {
          this.insertBatch(entity, batch, columnMap, result)
        } catch (err: any) {
          result.errors.push(err.message)
        }
        batch = []
      }

      Papa.parse(fs.createReadStream(filePath), {
        header: true,
        step: (row) => {
          batch.push(row.data as Record<string, string>)
          totalRows++
          if (batch.length >= 500) {
            flush()
            onProgress?.(totalRows, totalRows)
          }
        },
        complete: () => {
          flush()
          onProgress?.(totalRows, totalRows)
          resolve(result)
        },
        error: (err) => {
          result.errors.push(err.message)
          resolve(result)
        }
      })
    })
  }

  private insertBatch(
    entity: ImportEntity,
    rows: Record<string, string>[],
    columnMap: ColumnMap,
    result: ImportResult
  ) {
    const db = getDb()

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
          case 'partners':
            this.insertPartner(row, result)
            break
          case 'programs':
            this.insertProgram(row, result)
            break
          case 'teachers':
            this.insertTeacher(row, result)
            break
          case 'schools':
            this.insertSchool(row, result)
            break
          case 'districts':
            this.insertDistrict(row, result)
            break
        }
      } catch (err: any) {
        result.skipped++
        result.errors.push(`Row error: ${err.message}`)
      }
    }
  }

  private insertPartner(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    const hasCoords = row.lat && row.lng
    const geocodingStatus = hasCoords ? 'manual' : row.address ? 'pending' : 'failed'

    const id = row.id || newId()
    db.insert(partners)
      .values({
        id,
        name: row.name,
        type: row.type || 'general',
        description: row.description || null,
        address: row.address || null,
        lat: hasCoords ? parseFloat(row.lat) : null,
        lng: hasCoords ? parseFloat(row.lng) : null,
        county: row.county || null,
        contactEmail: row.contact_email || row.contactEmail || null,
        website: row.website || null,
        status: row.status || 'active',
        profileScore: 0,
        geocodingStatus
      })
      .run()

    if (geocodingStatus === 'pending' && row.address) {
      this.geocodingSvc.enqueue({ id, table: 'partners', address: row.address })
    }

    result.inserted++
  }

  private insertProgram(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.title || !row.partner_id) { result.skipped++; return }

    const id = row.id || newId()
    db.insert(programs)
      .values({
        id,
        partnerId: row.partner_id,
        title: row.title,
        description: row.description || null,
        gradeLevels: row.grade_levels || null,
        subjects: row.subjects || null,
        maxStudents: row.max_students ? parseInt(row.max_students) : null,
        durationMins: row.duration_mins ? parseInt(row.duration_mins) : null,
        cost: row.cost ? parseFloat(row.cost) : 0,
        season: row.season || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        createdAt: new Date()
      })
      .run()

    result.inserted++
  }

  private insertTeacher(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    const id = row.id || newId()
    db.insert(teachers)
      .values({
        id,
        name: row.name,
        email: row.email || null,
        schoolId: row.school_id || null,
        gradeLevels: row.grade_levels || null,
        subjects: row.subjects || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        zip: row.zip || null,
        lastActive: new Date()
      })
      .run()

    result.inserted++
  }

  private insertSchool(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    const id = row.id || newId()
    const geocodingStatus =
      row.lat && row.lng ? 'manual' : row.address ? 'pending' : 'failed'

    db.insert(schools)
      .values({
        id,
        name: row.name,
        districtId: row.district_id || null,
        address: row.address || null,
        city: row.city || null,
        county: row.county || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        enrollment: row.enrollment ? parseInt(row.enrollment) : null,
        title1Flag: row.title1_flag === 'true' || row.title1_flag === '1',
        geocodingStatus
      })
      .run()

    if (geocodingStatus === 'pending' && row.address) {
      this.geocodingSvc.enqueue({ id, table: 'schools', address: row.address })
    }

    result.inserted++
  }

  private insertDistrict(row: Record<string, any>, result: ImportResult) {
    const db = getDb()
    if (!row.name) { result.skipped++; return }

    db.insert(districts)
      .values({
        id: row.id || newId(),
        name: row.name,
        county: row.county || null,
        superintendentEmail: row.superintendent_email || null,
        enrollmentTotal: row.enrollment_total ? parseInt(row.enrollment_total) : null
      })
      .run()

    result.inserted++
  }
}
