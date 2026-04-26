import { getSqlite } from '../db'

interface GeoQueueItem {
  id: string
  table: 'partners' | 'schools' | 'teachers'
  address: string
}

const queue: GeoQueueItem[] = []
let timer: ReturnType<typeof setInterval> | null = null

export class GeocodingService {
  enqueue(item: GeoQueueItem) {
    const alreadyQueued = queue.some((q) => q.id === item.id && q.table === item.table)
    if (!alreadyQueued) {
      queue.push(item)
    }
  }

  startQueue(onProgress?: (done: number, total: number, table: string) => void) {
    if (timer) return

    timer = setInterval(async () => {
      if (queue.length === 0) return

      const item = queue.shift()!
      try {
        const result = await this.geocode(item.address)
        if (result) {
          this.updateRecord(item.table, item.id, result.lat, result.lng, 'success')
        } else {
          this.updateRecord(item.table, item.id, null, null, 'failed')
        }
      } catch {
        this.updateRecord(item.table, item.id, null, null, 'failed')
      }

      const done = this.getTotalGeocoded(item.table)
      onProgress?.(done, done + queue.length, item.table)
    }, 1100)
  }

  stopQueue() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  async loadPendingFromDb() {
    const sqlite = getSqlite()
    const tables: Array<'partners' | 'schools'> = ['partners', 'schools']
    for (const table of tables) {
      try {
        const rows = sqlite
          .prepare(`SELECT id, address FROM ${table} WHERE geocoding_status = 'pending' AND address IS NOT NULL`)
          .all() as { id: string; address: string }[]
        for (const row of rows) {
          this.enqueue({ id: row.id, table, address: row.address })
        }
      } catch {
        // table may not exist yet during first run
      }
    }
  }

  private async geocode(address: string): Promise<{ lat: number; lng: number } | null> {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Ten Strands Climate Learning Exchange/1.0 (kpchatgpt@knowledgeplatform.com)'
      }
    })
    const data = await res.json() as any[]
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  }

  private updateRecord(
    table: string,
    id: string,
    lat: number | null,
    lng: number | null,
    status: string
  ) {
    try {
      const sqlite = getSqlite()
      sqlite
        .prepare(
          `UPDATE ${table} SET lat = ?, lng = ?, geocoding_status = ? WHERE id = ?`
        )
        .run(lat, lng, status, id)
    } catch {
      // ignore
    }
  }

  private getTotalGeocoded(table: string): number {
    try {
      const sqlite = getSqlite()
      const row = sqlite
        .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE geocoding_status = 'success'`)
        .get() as { c: number }
      return row.c
    } catch {
      return 0
    }
  }

  getQueueLength(): number {
    return queue.length
  }
}
