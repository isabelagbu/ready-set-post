import { app, BrowserWindow, clipboard, ipcMain, nativeTheme, shell } from 'electron'
import { join } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

const STORE_NAME = 'content-store.json'
const SCRATCHPAD_NAME = 'scratchpad.json'

function storePath(): string {
  return join(app.getPath('userData'), STORE_NAME)
}

function scratchpadPath(): string {
  return join(app.getPath('userData'), SCRATCHPAD_NAME)
}

async function readStore(): Promise<{ posts: unknown[] }> {
  const p = storePath()
  if (!existsSync(p)) return { posts: [] }
  const raw = await readFile(p, 'utf-8')
  try {
    const data = JSON.parse(raw) as { posts?: unknown[] }
    return { posts: Array.isArray(data.posts) ? data.posts : [] }
  } catch {
    return { posts: [] }
  }
}

async function writeStore(data: { posts: unknown[] }): Promise<void> {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  await writeFile(storePath(), JSON.stringify(data, null, 2), 'utf-8')
}

async function readScratchpad(): Promise<string> {
  const p = scratchpadPath()
  if (!existsSync(p)) return ''
  const raw = await readFile(p, 'utf-8')
  try {
    const data = JSON.parse(raw) as { text?: unknown }
    return typeof data.text === 'string' ? data.text : ''
  } catch {
    return ''
  }
}

async function writeScratchpad(text: string): Promise<void> {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
  await writeFile(scratchpadPath(), JSON.stringify({ text: text ?? '' }, null, 2), 'utf-8')
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 640,
    minHeight: 480,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fff8fa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  nativeTheme.themeSource = 'light'
  electronApp.setAppUserModelId('com.socialmediamanager.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

  ipcMain.handle('store:read', () => readStore())
  ipcMain.handle('store:write', (_, payload: { posts: unknown[] }) => writeStore(payload))
  ipcMain.handle('clipboard:write', (_, text: string) => {
    clipboard.writeText(text ?? '')
    return true
  })
  ipcMain.handle('notes:read', () => readScratchpad())
  ipcMain.handle('notes:write', (_, text: string) => writeScratchpad(text))

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
