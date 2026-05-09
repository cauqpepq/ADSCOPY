import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initDb } from '@main/db'
import { registerIpc } from '@main/ipc'
import { startApiServer, stopApiServer } from '@main/api/server'
import { closeAll } from '@main/browser/launcher'
import { IPC } from '@shared/ipc-channels'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: 'AdsPower Clone',
    backgroundColor: '#f5f7fa',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDb()
  registerIpc()

  // Start the local API server if enabled
  startApiServer((id, status, err) => {
    for (const w of BrowserWindow.getAllWindows()) {
      w.webContents.send(IPC.EventProfileStatusChanged, { id, status, error: err })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', async () => {
  await closeAll()
  stopApiServer()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', async () => {
  await closeAll()
  stopApiServer()
})

void fileURLToPath
