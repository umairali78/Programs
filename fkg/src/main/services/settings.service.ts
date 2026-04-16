import { eq } from 'drizzle-orm'
import { getDb } from '../db'
import { settings } from '../db/schema'
import { newId } from '../utils/uuid'
import { BaseService } from './base.service'

const DEFAULTS: Record<string, string> = {
  business_name: 'Fashion Ka Ghar',
  business_tagline: 'Your Style, Our Craft',
  business_address: '',
  business_phone: '',
  business_whatsapp: '',
  business_email: '',
  business_logo: '',
  currency_symbol: 'Rs.',
  currency_position: 'before',
  tax_enabled: 'false',
  tax_rate: '0',
  tax_label: 'GST',
  invoice_prefix: 'FKG',
  invoice_start: '1001',
  order_prefix: 'WO',
  order_start: '1001',
  low_stock_default_threshold: '5',
  loyalty_points_per_amount: '100',
  loyalty_points_rate: '1',
  loyalty_tier_bronze: '0',
  loyalty_tier_silver: '500',
  loyalty_tier_gold: '2000',
  loyalty_tier_vip: '5000',
  notification_deadline_days: '3',
  notification_birthday_days: '7',
  notification_dormant_days: '90',
  idle_lock_minutes: '30',
  discount_approval_threshold: '20',
  vendor_weight_quality: '40',
  vendor_weight_price: '30',
  vendor_weight_speed: '30',
  invoice_footer: 'Thank you for choosing Fashion Ka Ghar',
  auto_backup_on_exit: 'false',
  backup_keep_count: '10',
  default_stages: JSON.stringify([
    { name: 'Measurement Taken', qcRequired: false, defaultDuration: 0 },
    { name: 'Cutting', qcRequired: false, defaultDuration: 1 },
    { name: 'Stitching', qcRequired: true, defaultDuration: 5 },
    { name: 'Karhai / Embroidery', qcRequired: true, defaultDuration: 7 },
    { name: 'Stone Work / Finishing', qcRequired: true, defaultDuration: 3 },
    { name: 'Quality Check & Pressing', qcRequired: true, defaultDuration: 1 },
    { name: 'Customer Approval', qcRequired: false, defaultDuration: 2 },
    { name: 'Final Packing', qcRequired: false, defaultDuration: 0 },
    { name: 'Delivery & Payment', qcRequired: false, defaultDuration: 0 }
  ])
}

export class SettingsService extends BaseService {
  async get(key: string): Promise<string> {
    const db = getDb()
    const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
    return row?.value ?? DEFAULTS[key] ?? ''
  }

  async getAll(): Promise<Record<string, string>> {
    const db = getDb()
    const rows = await db.select().from(settings)
    const result = { ...DEFAULTS }
    for (const row of rows) {
      result[row.key] = row.value
    }
    return result
  }

  async set(key: string, value: string): Promise<void> {
    const db = getDb()
    const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
    const now = new Date()

    if (existing.length > 0) {
      await db.update(settings).set({ value, updatedAt: now }).where(eq(settings.key, key))
    } else {
      await db.insert(settings).values({ id: newId(), key, value, updatedAt: now })
    }
  }

  async setBulk(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value)
    }
  }

  async seedDefaults(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const db = getDb()
      const existing = await db.select().from(settings).where(eq(settings.key, key)).limit(1)
      if (existing.length === 0) {
        await db.insert(settings).values({ id: newId(), key, value, updatedAt: new Date() })
      }
    }
  }
}
