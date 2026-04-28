import { getRawClient } from '../db'
import { newId } from './uuid'
import caeliPartners from '@/lib/data/caeli-partners.json'
import caeliPrograms from '@/lib/data/caeli-programs.json'

const COUNTY_COORDS: Record<string, [number, number]> = {
  'Alameda': [37.6017, -121.7195], 'Alpine': [38.5969, -119.8223],
  'Amador': [38.4490, -120.6507], 'Butte': [39.6657, -121.6017],
  'Calaveras': [38.2029, -120.5498], 'Colusa': [39.1783, -122.2350],
  'Contra Costa': [37.9285, -121.9796], 'Del Norte': [41.7408, -123.9020],
  'El Dorado': [38.7809, -120.5249], 'Fresno': [36.7378, -119.7871],
  'Glenn': [39.5988, -122.3931], 'Humboldt': [40.7450, -123.8695],
  'Imperial': [33.0114, -115.4734], 'Inyo': [36.5139, -117.4004],
  'Kern': [35.3435, -118.7298], 'Kings': [36.0759, -119.8152],
  'Lake': [39.1025, -122.7538], 'Lassen': [40.6723, -120.5960],
  'Los Angeles': [34.0522, -118.2437], 'Madera': [37.2176, -119.7643],
  'Marin': [38.0834, -122.7633], 'Mariposa': [37.5716, -119.8985],
  'Mendocino': [39.3667, -123.4277], 'Merced': [37.1941, -120.7167],
  'Modoc': [41.5882, -120.7301], 'Mono': [37.9380, -118.8853],
  'Monterey': [36.6002, -121.8947], 'Napa': [38.5025, -122.2654],
  'Nevada': [39.3025, -120.7695], 'Orange': [33.7175, -117.8311],
  'Placer': [39.0627, -121.0017], 'Plumas': [40.0016, -120.8404],
  'Riverside': [33.9534, -117.3962], 'Sacramento': [38.5816, -121.4944],
  'San Benito': [36.5054, -121.0765], 'San Bernardino': [34.1083, -117.2898],
  'San Diego': [32.7157, -117.1611], 'San Francisco': [37.7749, -122.4194],
  'San Joaquin': [37.9362, -121.2716], 'San Luis Obispo': [35.2828, -120.6596],
  'San Mateo': [37.5630, -122.3255], 'Santa Barbara': [34.4208, -119.6982],
  'Santa Clara': [37.3541, -121.9552], 'Santa Cruz': [36.9741, -122.0308],
  'Shasta': [40.5865, -122.3917], 'Sierra': [39.5769, -120.5221],
  'Siskiyou': [41.5913, -122.5418], 'Solano': [38.2671, -121.9464],
  'Sonoma': [38.5780, -122.9888], 'Stanislaus': [37.5079, -121.0127],
  'Sutter': [39.0344, -121.6947], 'Tehama': [40.1256, -122.2374],
  'Trinity': [40.6438, -123.1093], 'Tulare': [36.2077, -119.0079],
  'Tuolumne': [38.0294, -119.9720], 'Ventura': [34.3705, -119.1391],
  'Yolo': [38.7296, -121.9018], 'Yuba': [39.2891, -121.3742],
  'California': [36.7783, -119.4179],
}

function jitter(v: number, amount = 0.10): number {
  // deterministic offset using string hash to avoid re-seed drift
  return v + (Math.random() - 0.5) * amount
}

export class SeedService {
  async isDemoLoaded(): Promise<boolean> {
    const client = getRawClient()
    try {
      const flagRow = await client.execute(
        `SELECT value FROM settings WHERE key='caeli_data_loaded' LIMIT 1`
      ).catch(() => ({ rows: [] }))
      if ((flagRow.rows[0] as any)?.value === 'true') return true

      const [partners, programs, teachers] = await Promise.all([
        client.execute(`SELECT COUNT(*) as c FROM partners`),
        client.execute(`SELECT COUNT(*) as c FROM programs`),
        client.execute(`SELECT COUNT(*) as c FROM teachers`),
      ])
      return (
        Number((partners.rows[0] as any).c) >= 10 &&
        Number((programs.rows[0] as any).c) >= 17 &&
        Number((teachers.rows[0] as any).c) >= 12
      )
    } catch {
      return false
    }
  }

  async loadDemo(): Promise<{ inserted: Record<string, number> }> {
    const client = getRawClient()
    await this.clearAll(false)
    const now = Math.floor(Date.now() / 1000)
    const stmts: { sql: string; args: any[] }[] = []

    // ── Districts ──────────────────────────────────────────────────────────────
    const districtSCCS = newId(), districtOUSD = newId(), districtLAUSD = newId()
    const districts: [string, string, string, string, number][] = [
      [districtSCCS, 'Santa Cruz City Schools', 'Santa Cruz', 'superintendent@sccs.net', 6800],
      [districtOUSD, 'Oakland Unified School District', 'Alameda', 'info@ousd.org', 34000],
      [districtLAUSD, 'Los Angeles Unified School District', 'Los Angeles', 'info@lausd.net', 430000],
    ]
    for (const [id, name, county, email, enroll] of districts) {
      stmts.push({ sql: `INSERT OR IGNORE INTO districts (id, name, county, superintendent_email, enrollment_total) VALUES (?, ?, ?, ?, ?)`, args: [id, name, county, email, enroll] })
    }

    // ── Schools ────────────────────────────────────────────────────────────────
    const schoolGault = newId(), schoolBranciforte = newId(), schoolFruitvale = newId(), schoolMarinaDelRey = newId()
    const schools: [string, string, string, string, string, string, number, number, number, number][] = [
      [schoolGault, 'Gault Elementary', districtSCCS, '1320 Seabright Ave, Santa Cruz, CA 95062', 'Santa Cruz', 'Santa Cruz', 36.9741, -122.0308, 340, 0],
      [schoolBranciforte, 'Branciforte Middle School', districtSCCS, '315 Poplar Ave, Santa Cruz, CA 95062', 'Santa Cruz', 'Santa Cruz', 36.9817, -122.0191, 520, 1],
      [schoolFruitvale, 'Fruitvale Elementary', districtOUSD, '3200 Boston Ave, Oakland, CA 94602', 'Oakland', 'Alameda', 37.7913, -122.2139, 410, 1],
      [schoolMarinaDelRey, 'Marina del Rey Middle School', districtLAUSD, '12500 Braddock Dr, Los Angeles, CA 90066', 'Los Angeles', 'Los Angeles', 33.9803, -118.4517, 680, 0],
    ]
    for (const [id, name, did, addr, city, county, lat, lng, enroll, t1] of schools) {
      stmts.push({ sql: `INSERT OR IGNORE INTO schools (id, name, district_id, address, city, county, lat, lng, enrollment, title1_flag, geocoding_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')`, args: [id, name, did, addr, city, county, lat, lng, enroll, t1] })
    }

    // ── Teachers ───────────────────────────────────────────────────────────────
    const teacherMaria = newId(), teacherJames = newId(), teacherSarah = newId(), teacherAisha = newId()
    const teacherBen = newId(), teacherPriya = newId(), teacherOlivia = newId(), teacherDaniel = newId()
    const teacherNoemi = newId(), teacherEthan = newId(), teacherCamila = newId(), teacherGrace = newId()
    const teachers: [string, string, string, string, string[], string[], number, number, string][] = [
      [teacherMaria, 'Maria Chen', 'mchen@sccs.net', schoolGault, ['3','4','5'], ['Life Science','Earth Science','Biodiversity'], 36.9741, -122.0308, '95062'],
      [teacherJames, 'James Rodriguez', 'jrodriguez@ousd.org', schoolFruitvale, ['6','7','8'], ['Climate Justice','Water','Earth Science'], 37.7913, -122.2139, '94602'],
      [teacherSarah, 'Sarah Kim', 'skim@lausd.net', schoolMarinaDelRey, ['K','1','2'], ['Life Science','Biodiversity'], 33.9803, -118.4517, '90066'],
      [teacherAisha, 'Aisha Patel', 'apatel@sccs.net', schoolBranciforte, ['6','7'], ['Water','Earth Science','Biodiversity'], 36.9817, -122.0191, '95062'],
      [teacherBen, 'Ben Thompson', 'bthompson@sccs.net', schoolGault, ['1','2'], ['Life Science','Agriculture'], 36.9741, -122.0308, '95062'],
      [teacherPriya, 'Priya Narayan', 'pnarayan@ousd.org', schoolFruitvale, ['3','4'], ['Climate Justice','Agriculture'], 37.7913, -122.2139, '94602'],
      [teacherOlivia, 'Olivia Martinez', 'omartinez@ousd.org', schoolFruitvale, ['9','10'], ['Climate Justice','Earth Science','Water'], 37.7913, -122.2139, '94602'],
      [teacherDaniel, 'Daniel Nguyen', 'dnguyen@lausd.net', schoolMarinaDelRey, ['4','5'], ['Water','Life Science'], 33.9803, -118.4517, '90066'],
      [teacherNoemi, 'Noemi Rivera', 'nrivera@lausd.net', schoolMarinaDelRey, ['11','12'], ['Climate Justice','Indigenous Ecological Knowledge'], 33.9803, -118.4517, '90066'],
      [teacherEthan, 'Ethan Brooks', 'ebrooks@sccs.net', schoolBranciforte, ['8'], ['Earth Science','Agriculture'], 36.9817, -122.0191, '95062'],
      [teacherCamila, 'Camila Flores', 'cflores@ousd.org', schoolFruitvale, ['TK','K'], ['Life Science','Biodiversity'], 37.7913, -122.2139, '94602'],
      [teacherGrace, 'Grace Wilson', 'gwilson@lausd.net', schoolMarinaDelRey, ['7','8'], ['Water','Biodiversity','Climate Justice'], 33.9803, -118.4517, '90066'],
    ]
    for (const [id, name, email, sid, grades, subjects, lat, lng, zip] of teachers) {
      stmts.push({ sql: `INSERT OR IGNORE INTO teachers (id, name, email, school_id, grade_levels, subjects, lat, lng, zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, args: [id, name, email, sid, JSON.stringify(grades), JSON.stringify(subjects), lat, lng, zip] })
    }

    // ── Partners from CA-ELI portal ────────────────────────────────────────────
    const partnerIdMap = new Map<string, string>()
    for (const p of caeliPartners as any[]) {
      const id = newId()
      partnerIdMap.set(p.name.toLowerCase(), id)
      const coords = COUNTY_COORDS[p.county as string] ?? COUNTY_COORDS['California']
      const lat = jitter(coords[0], 0.12)
      const lng = jitter(coords[1], 0.15)
      stmts.push({
        sql: `INSERT OR IGNORE INTO partners (id, name, type, description, address, lat, lng, county, contact_email, website, status, profile_score, geocoding_status) VALUES (?,?,?,?,?,?,?,?,?,?,'active',0,'success')`,
        args: [id, p.name, p.type, p.description, p.address, lat, lng, p.county, p.contact_email, p.website],
      })
    }

    // ── Programs from CA-ELI portal ────────────────────────────────────────────
    let programCount = 0
    for (const prog of caeliPrograms as any[]) {
      const partnerId = partnerIdMap.get((prog.partner_name as string).toLowerCase())
      if (!partnerId) continue
      const id = newId()
      stmts.push({
        sql: `INSERT OR IGNORE INTO programs (id, partner_id, title, description, grade_levels, subjects, max_students, duration_mins, cost, season, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        args: [id, partnerId, prog.title, prog.description, JSON.stringify(prog.grade_levels ?? []), JSON.stringify(prog.subjects ?? []), prog.max_students ?? null, prog.duration_mins ?? null, prog.cost ?? null, prog.season, now],
      })
      programCount++
    }

    // ── Settings ───────────────────────────────────────────────────────────────
    stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('active_teacher_id', ?)`, args: [teacherMaria] })
    stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('caeli_data_loaded', 'true')`, args: [] })
    stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_auto_seed_disabled', '')`, args: [] })

    // ── Batch insert — chunked to avoid timeout ────────────────────────────────
    const CHUNK = 150
    for (let i = 0; i < stmts.length; i += CHUNK) {
      await client.batch(stmts.slice(i, i + CHUNK), 'write')
    }

    return {
      inserted: {
        districts: districts.length,
        schools: schools.length,
        teachers: teachers.length,
        partners: caeliPartners.length,
        programs: programCount,
      },
    }
  }

  async clearDemo(): Promise<void> {
    await this.clearAll(true)
  }

  private async clearAll(disableAutoSeed: boolean): Promise<void> {
    const client = getRawClient()
    const tables = [
      'outreach_log', 'partner_prospects', 'reports', 'lesson_plans',
      'reviews', 'engagements', 'bookmarks', 'teacher_interests',
      'program_interests', 'program_standards', 'programs', 'partners',
      'teachers', 'schools', 'districts', 'settings',
    ]
    const stmts: { sql: string; args: any[] }[] = tables.map((t) => ({ sql: `DELETE FROM ${t}`, args: [] }))
    if (disableAutoSeed) {
      stmts.push({ sql: `INSERT OR REPLACE INTO settings (key, value) VALUES ('demo_auto_seed_disabled', 'true')`, args: [] })
    }
    await client.batch(stmts, 'write')
  }
}
