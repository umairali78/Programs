import { getSqlite } from '../db'

export abstract class BaseService {
  protected runTransaction<T>(fn: () => T): T {
    const sqlite = getSqlite()
    return sqlite.transaction(fn)()
  }

  protected now(): Date {
    return new Date()
  }

  protected nowTs(): number {
    return Date.now()
  }
}
