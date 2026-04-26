import { ipcMain, dialog, BrowserWindow } from 'electron'
import { PartnerService } from '../services/partner.service'
import { ProgramService } from '../services/program.service'
import { TeacherService } from '../services/teacher.service'
import { MatchingService } from '../services/matching.service'
import { CsvImportService } from '../services/csv-import.service'
import { GeocodingService } from '../services/geocoding.service'
import { AdminService } from '../services/admin.service'
import { SettingsService } from '../services/settings.service'
import { ClaudeService } from '../services/claude.service'
import { SeedService } from '../services/seed.service'

const partnerSvc = new PartnerService()
const programSvc = new ProgramService()
const teacherSvc = new TeacherService()
const matchingSvc = new MatchingService()
const importSvc = new CsvImportService()
export const geocodingSvc = new GeocodingService()
const adminSvc = new AdminService()
const settingsSvc = new SettingsService()
const claudeSvc = new ClaudeService()
const seedSvc = new SeedService()

type ApiResult = { ok: true; data: any } | { ok: false; error: string }

function handler(channel: string, fn: (data: any) => Promise<any>) {
  ipcMain.handle(channel, async (_event, payload): Promise<ApiResult> => {
    try {
      const result = await fn(payload?.data)
      return { ok: true, data: result }
    } catch (err: any) {
      console.error(`[IPC] ${channel}:`, err)
      return { ok: false, error: err?.message ?? 'Unknown error' }
    }
  })
}

export function registerAllHandlers(mainWindow: BrowserWindow) {
  // ── PARTNER ──────────────────────────────────────────────────────────────────
  handler('partner:list', async (data) => partnerSvc.list(data))
  handler('partner:get', async ({ id }) => partnerSvc.get(id))
  handler('partner:listForMap', async () => partnerSvc.listForMap())
  handler('partner:create', async (data) => partnerSvc.create(data))
  handler('partner:update', async ({ id, updates }) => partnerSvc.update(id, updates))
  handler('partner:delete', async ({ id }) => partnerSvc.delete(id))

  // ── PROGRAM ───────────────────────────────────────────────────────────────────
  handler('program:list', async (data) => programSvc.list(data))
  handler('program:get', async ({ id }) => programSvc.get(id))
  handler('program:create', async (data) => programSvc.create(data))
  handler('program:update', async ({ id, updates }) => programSvc.update(id, updates))
  handler('program:delete', async ({ id }) => programSvc.delete(id))

  // ── TEACHER ───────────────────────────────────────────────────────────────────
  handler('teacher:list', async () => teacherSvc.list())
  handler('teacher:get', async ({ id }) => teacherSvc.get(id))
  handler('teacher:getActive', async () => teacherSvc.getActive())
  handler('teacher:setActive', async ({ id }) => teacherSvc.setActive(id))
  handler('teacher:create', async (data) => teacherSvc.create(data))
  handler('teacher:update', async ({ id, updates }) => teacherSvc.update(id, updates))

  // ── MATCHING ──────────────────────────────────────────────────────────────────
  handler('match:listForTeacher', async ({ teacherId, radiusMiles, filters }) =>
    matchingSvc.listForTeacher(teacherId, radiusMiles ?? 20, filters)
  )
  handler('match:score', async ({ teacherId, programId }) =>
    matchingSvc.scoreOne(teacherId, programId)
  )

  // ── CSV IMPORT ────────────────────────────────────────────────────────────────
  handler('import:parsePreview', async ({ filePath }) => importSvc.parsePreview(filePath))

  handler('import:run', async ({ filePath, entity, columnMap }) => {
    return importSvc.runImport(filePath, entity, columnMap, (processed, total) => {
      mainWindow.webContents.send('import:progress', { entity, processed, total })
    })
  })

  handler('import:selectFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    })
    return result.canceled ? null : result.filePaths[0]
  })

  handler('import:geocodingStatus', async () => adminSvc.getGeocodingStatus())

  // ── ADMIN ──────────────────────────────────────────────────────────────────────
  handler('admin:dbStats', async () => adminSvc.getDbStats())
  handler('admin:vacuum', async () => adminSvc.vacuum())

  handler('admin:exportDb', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'tenstrand-backup.db',
      filters: [{ name: 'SQLite Database', extensions: ['db'] }]
    })
    if (result.canceled || !result.filePath) return null
    return adminSvc.exportDb(result.filePath)
  })

  // ── SETTINGS ──────────────────────────────────────────────────────────────────
  handler('settings:getAll', async () => settingsSvc.getAll())
  handler('settings:get', async ({ key }) => settingsSvc.get(key))
  handler('settings:set', async ({ key, value }) => settingsSvc.set(key, value))
  handler('settings:setBulk', async (pairs) => settingsSvc.setBulk(pairs))

  // ── SEED / DEMO DATA ──────────────────────────────────────────────────────────
  handler('admin:seedDemo', async () => seedSvc.loadDemo())
  handler('admin:clearDemo', async () => seedSvc.clearDemo())
  handler('admin:isDemoLoaded', async () => seedSvc.isDemoLoaded())

  // ── AI / CLAUDE ───────────────────────────────────────────────────────────────
  handler('ai:matchExplanation', async ({ teacherId, programId }) =>
    claudeSvc.generateMatchExplanation(teacherId, programId)
  )

  handler('ai:copilotTurn', async ({ teacherId, history, message }) =>
    claudeSvc.runCopilotTurn(teacherId, history, message)
  )

  handler('ai:generateDigest', async ({ teacherId }) => claudeSvc.generateDigest(teacherId))

  handler('ai:rewriteProfile', async ({ programId }) => claudeSvc.rewritePartnerProfile(programId))

  handler('ai:suggestStandards', async ({ programId }) => claudeSvc.suggestStandards(programId))

  handler('ai:extractFromBrochure', async ({ text }) => claudeSvc.extractFromBrochure(text))

  // Start geocoding queue and push progress to renderer
  geocodingSvc.startQueue((done, total, table) => {
    mainWindow.webContents.send('geocoding:progress', { done, total, table })
  })
}
