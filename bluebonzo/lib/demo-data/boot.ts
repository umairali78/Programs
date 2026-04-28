let seedPromise: Promise<void> | null = null

export async function ensureDemoData(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      try {
        const { seedDemoData } = await import('./seed')
        await seedDemoData()
      } catch (e) {
        console.error('[demo-boot] seed failed:', e)
        seedPromise = null
      }
    })()
  }
  return seedPromise
}
