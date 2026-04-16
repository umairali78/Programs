import { getSqlite } from '../db'
import { newId } from '../utils/uuid'
import { auditLogs } from '../db/schema'

export abstract class BaseService {
  protected runTransaction<T>(fn: () => T): T {
    const sqlite = getSqlite()
    return sqlite.transaction(fn)()
  }

  protected auditLog(params: {
    userId?: string
    userName?: string
    action: string
    entityType: string
    entityId?: string
    oldValue?: unknown
    newValue?: unknown
  }): void {
    try {
      const sqlite = getSqlite()
      sqlite
        .prepare(
          `INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, old_value_json, new_value_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          newId(),
          params.userId ?? null,
          params.userName ?? null,
          params.action,
          params.entityType,
          params.entityId ?? null,
          params.oldValue ? JSON.stringify(params.oldValue) : null,
          params.newValue ? JSON.stringify(params.newValue) : null,
          Date.now()
        )
    } catch {
      // Audit log failures should not break the operation
    }
  }

  protected now(): Date {
    return new Date()
  }

  protected nowTs(): number {
    return Date.now()
  }
}
