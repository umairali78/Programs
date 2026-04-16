import { app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'
import { BaseService } from './base.service'

export class BackupService extends BaseService {
  private getDbPath(): string {
    return path.join(app.getPath('userData'), 'fkg-dev.db')
  }

  async createBackup(destDir?: string): Promise<string> {
    const dir = destDir ?? app.getPath('downloads')
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const zipPath = path.join(dir, `fkg-backup-${ts}.zip`)

    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', resolve)
      archive.on('error', reject)
      archive.pipe(output)

      // Add the SQLite database
      const dbPath = this.getDbPath()
      if (fs.existsSync(dbPath)) {
        archive.file(dbPath, { name: 'fkg.db' })
      }

      // Add WAL and SHM files if they exist
      const walPath = dbPath + '-wal'
      const shmPath = dbPath + '-shm'
      if (fs.existsSync(walPath)) archive.file(walPath, { name: 'fkg.db-wal' })
      if (fs.existsSync(shmPath)) archive.file(shmPath, { name: 'fkg.db-shm' })

      archive.finalize()
    })

    return zipPath
  }

  async restoreBackup(zipPath: string): Promise<void> {
    const Extract = require('extract-zip')
    const tmpDir = path.join(app.getPath('temp'), `fkg-restore-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    try {
      await Extract(zipPath, { dir: tmpDir })

      // Auto-backup current DB before overwriting
      const dbPath = this.getDbPath()
      if (fs.existsSync(dbPath)) {
        await this.createBackup(path.dirname(dbPath))
      }

      // Copy restored DB
      const restoredDb = path.join(tmpDir, 'fkg.db')
      if (fs.existsSync(restoredDb)) {
        fs.copyFileSync(restoredDb, dbPath)
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  }

  listBackups(dir?: string): Array<{ name: string; path: string; size: number; createdAt: Date }> {
    const searchDir = dir ?? app.getPath('downloads')
    if (!fs.existsSync(searchDir)) return []

    return fs
      .readdirSync(searchDir)
      .filter((f) => f.startsWith('fkg-backup-') && f.endsWith('.zip'))
      .map((f) => {
        const fullPath = path.join(searchDir, f)
        const stat = fs.statSync(fullPath)
        return { name: f, path: fullPath, size: stat.size, createdAt: stat.birthtime }
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
}
