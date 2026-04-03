import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import { parseJsonField } from '@/lib/utils/json'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  await requireRole('ADMIN')

  const configs = await prisma.systemConfig.findMany()
  const current: Record<string, unknown> = {}
  for (const c of configs) {
    const parsed = parseJsonField<{ value?: unknown }>(c.value, {})
    current[c.key] = parsed.value ?? c.value
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure subjects, grade levels, and pipeline thresholds.
        </p>
      </div>
      <SettingsForm settings={current as Parameters<typeof SettingsForm>[0]['settings']} />
    </div>
  )
}
