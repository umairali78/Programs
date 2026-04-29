import { getRawClient } from '../db'
import { newId } from './uuid'

export type ProspectStatus = 'new' | 'contacted' | 'responded' | 'enrolled' | 'declined'

export interface ProspectInsert {
  name: string
  type?: string
  sourceUrl?: string
  address?: string
  county?: string
  notes?: string
}

export class ProspectService {
  async list(): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT pp.*,
              (SELECT COUNT(*) FROM outreach_log ol WHERE ol.prospect_id = pp.id) as outreach_count
            FROM partner_prospects pp
            ORDER BY pp.created_at DESC`,
      args: [],
    })
    return result.rows as any[]
  }

  async get(id: string): Promise<any | null> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT * FROM partner_prospects WHERE id = ?`,
      args: [id],
    })
    return (result.rows[0] as any) ?? null
  }

  async create(data: ProspectInsert): Promise<string> {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.execute({
      sql: `INSERT INTO partner_prospects (id, name, type, source_url, address, county, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?)`,
      args: [id, data.name, data.type ?? null, data.sourceUrl ?? null,
             data.address ?? null, data.county ?? null, data.notes ?? null, now],
    })
    return id
  }

  async update(id: string, updates: Partial<ProspectInsert & { status: ProspectStatus; aiScore: number }>): Promise<void> {
    const client = getRawClient()
    const fields: string[] = []
    const args: any[] = []
    if (updates.name !== undefined) { fields.push('name = ?'); args.push(updates.name) }
    if (updates.type !== undefined) { fields.push('type = ?'); args.push(updates.type) }
    if (updates.sourceUrl !== undefined) { fields.push('source_url = ?'); args.push(updates.sourceUrl) }
    if (updates.address !== undefined) { fields.push('address = ?'); args.push(updates.address) }
    if (updates.county !== undefined) { fields.push('county = ?'); args.push(updates.county) }
    if (updates.notes !== undefined) { fields.push('notes = ?'); args.push(updates.notes) }
    if (updates.status !== undefined) { fields.push('status = ?'); args.push(updates.status) }
    if (updates.aiScore !== undefined) { fields.push('ai_score = ?'); args.push(updates.aiScore) }
    if (fields.length === 0) return
    args.push(id)
    await client.execute({ sql: `UPDATE partner_prospects SET ${fields.join(', ')} WHERE id = ?`, args })
  }

  async delete(id: string): Promise<void> {
    const client = getRawClient()
    await client.batch([
      { sql: `DELETE FROM outreach_log WHERE prospect_id = ?`, args: [id] },
      { sql: `DELETE FROM partner_prospects WHERE id = ?`, args: [id] },
    ], 'write')
  }

  async logOutreach(prospectId: string, subject: string, body: string): Promise<string> {
    const client = getRawClient()
    const id = newId()
    const now = Math.floor(Date.now() / 1000)
    await client.batch([
      { sql: `INSERT INTO outreach_log (id, prospect_id, email_subject, email_body, sent_at, response_status) VALUES (?, ?, ?, ?, ?, 'pending')`,
        args: [id, prospectId, subject, body, now] },
      { sql: `UPDATE partner_prospects SET status = 'contacted', outreach_sent_at = ? WHERE id = ? AND status = 'new'`,
        args: [now, prospectId] },
    ], 'write')
    return id
  }

  async listOutreachForProspect(prospectId: string): Promise<any[]> {
    const client = getRawClient()
    const result = await client.execute({
      sql: `SELECT * FROM outreach_log WHERE prospect_id = ? ORDER BY sent_at DESC`,
      args: [prospectId],
    })
    return result.rows as any[]
  }
}
