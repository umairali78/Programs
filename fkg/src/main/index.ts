import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { initDb } from './db'
import { registerAllHandlers, notificationSvc } from './ipc'
import { SettingsService } from './services/settings.service'

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#150D14',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Push notifications to renderer
  notificationSvc.onPush((n) => {
    mainWindow?.webContents.send('notification:push', n)
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.fkg.mis')

  // Initialize DB and seed settings
  await initDb()
  const settingsSvc = new SettingsService()
  await settingsSvc.seedDefaults()

  // Register all IPC handlers
  registerAllHandlers()

  createWindow()

  // Run notification checks (with delay to let DB settle)
  setTimeout(() => {
    notificationSvc.runChecks().catch(console.error)
    setInterval(() => notificationSvc.runChecks().catch(console.error), 15 * 60 * 1000)
  }, 5000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
