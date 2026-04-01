import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import SettingsForm from './SettingsForm'

const DEFAULTS = {
  improvementTriggerThreshold: 3.5,
  improvementCycleCount: 10,
  maxSloHistory: 10,
}

export default async function SettingsPage() {
  await requireRole('ADMIN')

  const configs = await prisma.systemConfig.findMany()
  const current = Object.fromEntries(configs.map((c) => [c.key, (c.value as { value: unknown }).value ?? c.value]))

  const settings = { ...DEFAULTS, ...current }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure thresholds and defaults for the generation pipeline.</p>
      </div>
      <SettingsForm settings={settings as typeof DEFAULTS} />
    </div>
  )
}
