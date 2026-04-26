import { eq, and } from 'drizzle-orm'
import { getDb } from '../db'
import { partners } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'
import { GeocodingService } from './geocoding.service'

export type PartnerInsert = {
  name: string
  type: string
  description?: string
  address?: string
  lat?: number
  lng?: number
  county?: string
  contactEmail?: string
  website?: string
  status?: string
}

export class PartnerService extends BaseService {
  private geocodingSvc = new GeocodingService()

  async list(filters?: { status?: string; county?: string }) {
    const db = getDb()
    let query = db.select().from(partners).$dynamic()

    const conditions: any[] = []
    if (filters?.status) conditions.push(eq(partners.status, filters.status))
    if (filters?.county) conditions.push(eq(partners.county, filters.county))

    if (conditions.length > 0) {
      query = query.where(and(...conditions))
    }

    return query.orderBy(partners.name)
  }

  async get(id: string) {
    const db = getDb()
    const [row] = await db.select().from(partners).where(eq(partners.id, id)).limit(1)
    return row ?? null
  }

  async listForMap() {
    const db = getDb()
    const rows = await db
      .select({
        id: partners.id,
        name: partners.name,
        type: partners.type,
        lat: partners.lat,
        lng: partners.lng,
        status: partners.status
      })
      .from(partners)
      .where(eq(partners.status, 'active'))

    return rows.filter((r) => r.lat != null && r.lng != null)
  }

  async create(data: PartnerInsert) {
    const db = getDb()
    const id = newId()
    const profileScore = this.computeProfileScore(data)

    const geocodingStatus =
      data.lat != null && data.lng != null
        ? 'manual'
        : data.address
          ? 'pending'
          : 'failed'

    await db.insert(partners).values({
      id,
      name: data.name,
      type: data.type,
      description: data.description ?? null,
      address: data.address ?? null,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      county: data.county ?? null,
      contactEmail: data.contactEmail ?? null,
      website: data.website ?? null,
      status: data.status ?? 'active',
      profileScore,
      geocodingStatus
    })

    if (geocodingStatus === 'pending' && data.address) {
      this.geocodingSvc.enqueue({ id, table: 'partners', address: data.address })
    }

    return id
  }

  async update(id: string, data: Partial<PartnerInsert>) {
    const db = getDb()
    const existing = await this.get(id)
    if (!existing) throw new Error('Partner not found')

    const updates: Record<string, any> = {}
    if (data.name !== undefined) updates.name = data.name
    if (data.type !== undefined) updates.type = data.type
    if (data.description !== undefined) updates.description = data.description
    if (data.address !== undefined) {
      updates.address = data.address
      updates.geocodingStatus = 'pending'
    }
    if (data.lat !== undefined) { updates.lat = data.lat; updates.geocodingStatus = 'manual' }
    if (data.lng !== undefined) updates.lng = data.lng
    if (data.county !== undefined) updates.county = data.county
    if (data.contactEmail !== undefined) updates.contactEmail = data.contactEmail
    if (data.website !== undefined) updates.website = data.website
    if (data.status !== undefined) updates.status = data.status

    const merged = { ...existing, ...data }
    updates.profileScore = this.computeProfileScore(merged as PartnerInsert)

    await db.update(partners).set(updates).where(eq(partners.id, id))

    if (updates.geocodingStatus === 'pending' && updates.address) {
      this.geocodingSvc.enqueue({ id, table: 'partners', address: updates.address })
    }
  }

  async delete(id: string) {
    const db = getDb()
    await db.delete(partners).where(eq(partners.id, id))
  }

  private computeProfileScore(data: Partial<PartnerInsert>): number {
    let score = 0
    if (data.name) score += 15
    if (data.description) score += 20
    if (data.address) score += 15
    if (data.lat != null) score += 10
    if (data.contactEmail) score += 15
    if (data.website) score += 10
    if (data.county) score += 10
    if (data.type && data.type !== 'general') score += 5
    return Math.min(score, 100)
  }
}
