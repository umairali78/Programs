import { getRawClient } from '@/lib/db'
import { SeedService } from '@/lib/services/seed.service'

let demoSeedPromise: Promise<void> | null = null

export async function ensureDemoDataForHostedDemo() {
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      try {
        const client = getRawClient()
        // Respect the "user manually cleared demo" flag
        const flagRow = await client.execute(
          `SELECT value FROM settings WHERE key='demo_auto_seed_disabled' LIMIT 1`
        ).catch(() => ({ rows: [] }))
        if ((flagRow.rows[0] as any)?.value === 'true') return

        const seedSvc = new SeedService()
        const loaded = await seedSvc.isDemoLoaded().catch(() => false)
        if (!loaded) await seedSvc.loadDemo()
      } catch (e) {
        console.error('[demo-boot] seed failed:', e)
        demoSeedPromise = null // allow retry on next cold start
      }
    })()
  }
  await demoSeedPromise
}
