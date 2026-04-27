import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { settings } from '../schema'

const DEFAULTS: Record<string, string> = {
  app_name: 'Ten Strands Climate Learning Exchange',
  active_teacher_id: '',
  default_radius_miles: '20',
  ai_provider: 'claude',
  claude_api_key: '',
  openai_api_key: '',
  openai_model: 'gpt-4o-mini',
  demo_auto_seed_disabled: '',
  ab2158_status: 'AB 2158 — Statewide Outdoor Learning Pilot Program is under review.',
  backup_prompt_days: '7'
}

export class SettingsService {
  async get(key: string): Promise<string> {
    const db = getDb()
    const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
    return row?.value ?? DEFAULTS[key] ?? ''
  }

  async set(key: string, value: string): Promise<void> {
    const db = getDb()
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } })
  }

  async getAll(): Promise<Record<string, string>> {
    const db = getDb()
    const rows = await db.select().from(settings)
    const map: Record<string, string> = { ...DEFAULTS }
    for (const row of rows) {
      map[row.key] = row.value
    }
    return map
  }

  async setBulk(pairs: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(pairs)) {
      await this.set(key, value)
    }
  }

  async seedDefaults(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const existing = await this.get(key)
      if (!existing) {
        await this.set(key, value)
      }
    }
  }
}
