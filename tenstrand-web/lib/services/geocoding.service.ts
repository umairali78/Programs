import { getRawClient } from '../db'

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=us`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Ten Strands Climate Learning Exchange/1.0 (education@tenstrands.org)'
      }
    })
    const data = await res.json() as any[]
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export async function geocodeAndUpdate(
  table: 'partners' | 'schools' | 'teachers',
  id: string,
  address: string
): Promise<void> {
  const result = await geocodeAddress(address)
  const client = getRawClient()
  if (result) {
    await client.execute({
      sql: `UPDATE ${table} SET lat = ?, lng = ?, geocoding_status = 'success' WHERE id = ?`,
      args: [result.lat, result.lng, id]
    })
  } else {
    await client.execute({
      sql: `UPDATE ${table} SET geocoding_status = 'failed' WHERE id = ?`,
      args: [id]
    })
  }
}
