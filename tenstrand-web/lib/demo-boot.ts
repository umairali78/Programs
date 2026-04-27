import { SeedService } from '@/lib/services/seed.service'

let demoSeedPromise: Promise<void> | null = null

function shouldAutoSeedDemo() {
  return process.env.VERCEL === '1' && !process.env.TURSO_DATABASE_URL
}

export async function ensureDemoDataForHostedDemo() {
  if (!shouldAutoSeedDemo()) return
  if (!demoSeedPromise) {
    demoSeedPromise = (async () => {
      const seedSvc = new SeedService()
      const loaded = await seedSvc.isDemoLoaded().catch(() => false)
      if (!loaded) await seedSvc.loadDemo()
    })()
  }
  await demoSeedPromise
}
