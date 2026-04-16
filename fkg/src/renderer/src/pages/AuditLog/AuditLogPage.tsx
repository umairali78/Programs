import { useEffect, useState } from 'react'
import { invoke } from '../../lib/api'
import { DataTable, Column } from '../../components/common/DataTable'
import { formatDateTime } from '../../lib/utils'

interface AuditLog { id: string; userId?: string; userName?: string; action: string; entityType: string; entityId: string; createdAt: string | Date }

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')

  useEffect(() => { load() }, [])
  const load = async () => { setLoading(true); try { setLogs(await invoke<AuditLog[]>('audit:list', { limit: 200 })) } finally { setLoading(false) } }

  const filtered = logs.filter((l) => {
    const matchAction = !filterAction || l.action.toLowerCase().includes(filterAction.toLowerCase())
    const matchEntity = !filterEntity || l.entityType === filterEntity
    return matchAction && matchEntity
  })

  const entities = [...new Set(logs.map((l) => l.entityType))]

  const columns: Column<AuditLog>[] = [
    { key: 'createdAt', header: 'Time', render: (l) => <span className="text-xs">{formatDateTime(l.createdAt)}</span> },
    { key: 'userName', header: 'User', render: (l) => l.userName ?? l.userId?.slice(0, 8) ?? 'System' },
    { key: 'action', header: 'Action', render: (l) => <span className="font-mono text-xs bg-surface px-1.5 py-0.5 rounded">{l.action}</span> },
    { key: 'entityType', header: 'Entity', render: (l) => <span className="capitalize">{l.entityType.replace('_', ' ')}</span> },
    { key: 'entityId', header: 'ID', render: (l) => <span className="font-mono text-xs text-dark/40">{l.entityId.slice(0, 8)}…</span> }
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input value={filterAction} onChange={(e) => setFilterAction(e.target.value)} placeholder="Filter by action..." className="border border-app-border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand/30" />
        <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="border border-app-border rounded-lg px-3 py-2 text-sm">
          <option value="">All Entities</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <span className="text-sm text-dark/40 ml-auto">{filtered.length} records</span>
      </div>
      <DataTable columns={columns} data={filtered} loading={loading} keyExtractor={(l) => l.id} emptyMessage="No audit logs" />
    </div>
  )
}
