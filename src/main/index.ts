import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  nativeTheme,
  Notification,
  session,
  shell,
  type Session
} from 'electron'
import { join, resolve } from 'path'
import { createServer } from 'http'
import { readFile, unlink, writeFile } from 'fs/promises'
import {
  demoPostListOutOfSyncWithSeed,
  getSeedPosts,
  isDemoOnlyPostList,
  SEED_SCRATCHPAD
} from './seed-data'
import {
  connect as driveConnect,
  disconnect as driveDisconnect,
  getStatus as driveGetStatus,
  initDriveStore,
  readPosts as driveReadPosts,
  readScratchpad as driveReadScratchpad,
  syncNow as driveSyncNow,
  writePosts as driveWritePosts,
  writeScratchpad as driveWriteScratchpad,
  readWorkspaceHydration as driveReadWorkspaceHydration,
  reportWorkspaceSnapshot as driveReportWorkspaceSnapshot
} from './drive/store'
import {
  authorizeYouTubeChannel,
  linkYouTubeAccountBySignIn,
  clearAllYouTubeAuth,
  fetchYouTubeChannels,
  getAuthorizedYouTubeChannelIds,
  getYouTubeAccessTokenForChannel,
  hasAnyYouTubeAuth,
  hasYouTubeListAuth,
  listAllAccessibleYouTubeChannels,
  startYouTubeListOAuthFlow
} from './drive/auth'

const APP_NAME = 'Ready Set Post'
const APP_ICON_PATH = resolve(process.cwd(), 'build/icon.png')
const ALLOWED_EXTERNAL_HOSTS = new Set([
  'instagram.com',
  'threads.com',
  'threads.net',
  'tiktok.com',
  'youtube.com',
  'google.com',
  'linkedin.com',
  'x.com',
  'twitter.com'
])
const SOCIAL_PARTITION = 'persist:rsp-social'

app.setName(APP_NAME)

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase()
  for (const allowed of ALLOWED_EXTERNAL_HOSTS) {
    if (host === allowed || host.endsWith(`.${allowed}`)) return true
  }
  return false
}

function toSafeExternalUrl(rawUrl: string): string | null {
  try {
    const input = rawUrl.trim()
    if (!input) return null
    const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input) ? input : `https://${input}`
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'https:') return null
    if (!isAllowedHost(parsed.hostname)) return null
    return parsed.toString()
  } catch {
    return null
  }
}

/** DevTools (F12) in dev; block refresh/devtools shortcuts in production — avoids toolkit loading before `app` exists when bundled. */
function watchWindowShortcuts(win: BrowserWindow): void {
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const dev = !app.isPackaged
    if (dev) {
      if (input.code === 'F12') {
        event.preventDefault()
        const { webContents } = win
        if (webContents.isDevToolsOpened()) webContents.closeDevTools()
        else webContents.openDevTools({ mode: 'undocked' })
      }
    } else {
      if (input.code === 'KeyR' && (input.control || input.meta)) event.preventDefault()
      if (
        input.code === 'KeyI' &&
        ((input.alt && input.meta) || (input.control && input.shift))
      ) {
        event.preventDefault()
      }
    }
    if (input.code === 'Minus' && (input.control || input.meta)) event.preventDefault()
    if (input.code === 'Equal' && input.shift && (input.control || input.meta)) event.preventDefault()
  })
}

type RawPost = Record<string, unknown> & { id?: unknown }

type YouTubeAuthStatus = {
  connected: boolean
  credentialsConfigured: boolean
  lastError: string | null
}

type YouTubeChannel = {
  id: string
  title: string
  customUrl: string
}

function readYouTubeClientConfig(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ??
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ??
    ''
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ??
    process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ??
    ''
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing Google client credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (or GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET).'
    )
  }
  return { clientId, clientSecret }
}

async function getYouTubeAuthStatus(): Promise<YouTubeAuthStatus> {
  const drive = await driveGetStatus()
  const credentialsConfigured = drive.credentialsManaged
  const lastError = credentialsConfigured ? null : 'Google credentials are not configured for this build.'
  const connected = credentialsConfigured && (await hasAnyYouTubeAuth())
  return {
    connected,
    credentialsConfigured,
    lastError
  }
}

async function connectYouTubeListing(): Promise<YouTubeAuthStatus> {
  await startYouTubeListOAuthFlow()
  return getYouTubeAuthStatus()
}

async function disconnectYouTubeAccount(): Promise<YouTubeAuthStatus> {
  await clearAllYouTubeAuth()
  return getYouTubeAuthStatus()
}

async function youtubeUploadVideo(payload: {
  title: string
  description: string
  tags: string[]
  privacyStatus: 'private' | 'unlisted' | 'public'
  madeForKids: boolean
  publishAt: string | null
  videoBuffer: ArrayBuffer
  videoMimeType: string
  thumbnailBuffer?: ArrayBuffer
  thumbnailMimeType?: string
  channelId?: string | null
}): Promise<{
  videoId: string
  watchUrl: string
  publishAt: string | null
  channelTitle: string
  thumbnailWarning: string | null
}> {
  if (!payload.channelId) {
    throw new Error('No YouTube channel selected for this publish.')
  }
  const accessToken = await getYouTubeAccessTokenForChannel(payload.channelId)
  const uploadChannel =
    (await fetchYouTubeChannels(accessToken)).find((c) => c.id === payload.channelId) ?? {
      id: payload.channelId,
      title: 'YouTube',
      customUrl: ''
    }
  const scheduled = !!payload.publishAt && new Date(payload.publishAt).getTime() > Date.now()
  const statusPrivacy = scheduled ? 'private' : payload.privacyStatus
  const metadata = {
    snippet: {
      title: payload.title,
      description: payload.description,
      tags: payload.tags
    },
    status: {
      privacyStatus: statusPrivacy,
      publishAt: scheduled ? payload.publishAt : undefined,
      selfDeclaredMadeForKids: payload.madeForKids
    }
  }
  const videoBytes = Buffer.from(payload.videoBuffer)
  const startRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      'X-Upload-Content-Type': payload.videoMimeType || 'video/*',
      'X-Upload-Content-Length': String(videoBytes.byteLength)
    },
    body: JSON.stringify(metadata)
  })
  if (!startRes.ok) {
    const text = await startRes.text()
    throw new Error(`YouTube upload init failed (${startRes.status}): ${text}`)
  }
  const uploadUrl = startRes.headers.get('location')
  if (!uploadUrl) throw new Error('YouTube resumable upload URL missing')

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': payload.videoMimeType || 'video/*'
    },
    body: videoBytes
  })
  if (!uploadRes.ok) {
    const text = await uploadRes.text()
    throw new Error(`YouTube upload failed (${uploadRes.status}): ${text}`)
  }
  const uploaded = (await uploadRes.json()) as { id?: string }
  const videoId = uploaded.id
  if (!videoId) throw new Error('YouTube upload missing video ID')

  let thumbnailWarning: string | null = null
  if (payload.thumbnailBuffer && payload.thumbnailMimeType) {
    const thumbRes = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${encodeURIComponent(videoId)}&uploadType=media`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': payload.thumbnailMimeType
        },
        body: Buffer.from(payload.thumbnailBuffer)
      }
    )
    if (!thumbRes.ok) {
      thumbnailWarning =
        'Video uploaded, but YouTube rejected the custom thumbnail. Verified channels can set thumbnails in YouTube Studio, or remove the thumbnail and publish again.'
    }
  }

  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    publishAt: scheduled ? payload.publishAt : null,
    channelTitle: uploadChannel.title,
    thumbnailWarning
  }
}

async function listYouTubeChannels(): Promise<YouTubeChannel[]> {
  const channels = await listAllAccessibleYouTubeChannels()
  if (channels.length === 0) {
    throw new Error(
      'No YouTube channels available. In Settings, connect “YouTube channel discovery” or sign in to at least one channel.'
    )
  }
  return channels
}

/**
 * Reads posts from the local Drive cache, seeding/refreshing the demo set on first launch
 * or when the bundled DEMO_STORE_VERSION moves ahead of an unmodified demo store.
 */
async function readStore(): Promise<{ posts: unknown[] }> {
  const { posts } = await driveReadPosts()
  if (!posts || posts.length === 0) {
    const seeded = getSeedPosts()
    await driveWritePosts(seeded as RawPost[])
    return { posts: seeded }
  }
  if (isDemoOnlyPostList(posts) && demoPostListOutOfSyncWithSeed(posts)) {
    const next = getSeedPosts()
    await driveWritePosts(next as RawPost[])
    return { posts: next }
  }
  return { posts }
}

async function writeStore(data: { posts: unknown[] }): Promise<void> {
  await driveWritePosts((data.posts ?? []) as RawPost[])
}

async function readScratchpad(): Promise<string> {
  const text = await driveReadScratchpad()
  if (text) return text
  await driveWriteScratchpad(SEED_SCRATCHPAD)
  return SEED_SCRATCHPAD
}

async function writeScratchpad(text: string): Promise<void> {
  await driveWriteScratchpad(text ?? '')
}

async function clearSocialSessions(): Promise<void> {
  const socialSession = session.fromPartition(SOCIAL_PARTITION)
  await socialSession.clearStorageData()
  await socialSession.clearCache()
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send('accounts:sessions-cleared')
  }
}

function buildRendererCsp(devRendererUrl: string | null): string {
  let scriptSrc = "'self'"
  let connectSrc = "'self' https:"
  if (devRendererUrl) {
    try {
      const u = new URL(devRendererUrl)
      const origin = u.origin
      const ws = (u.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + u.host
      // Vite dev HTML injects small inline scripts (client/HMR); CSP must allow them.
      scriptSrc += ` ${origin} blob: 'unsafe-inline'`
      connectSrc += ` ${origin} ${ws} wss:`
    } catch {
      /* ignore invalid dev URL */
    }
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "media-src 'self' data: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https:",
    "frame-ancestors 'none'"
  ].join('; ')
}

function attachRendererContentSecurityPolicy(sess: Session, devRendererUrl: string | null): void {
  const csp = buildRendererCsp(devRendererUrl)
  sess.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType !== 'mainFrame') {
      callback({ responseHeaders: details.responseHeaders ?? {} })
      return
    }
    const responseHeaders = details.responseHeaders ?? {}
    callback({
      responseHeaders: {
        ...responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 800,
    minHeight: 560,
    title: APP_NAME,
    icon: APP_ICON_PATH,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fff8fa',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      webviewTag: true
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())
  mainWindow.webContents.setWindowOpenHandler((details) => {
    const safeUrl = toSafeExternalUrl(details.url)
    if (safeUrl) {
      void shell.openExternal(safeUrl)
    }
    return { action: 'deny' }
  })

  // Avoid `is.dev` from toolkit at module load — bundled code can run before `app` exists.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  app.setName(APP_NAME)
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(APP_ICON_PATH)
  }
  nativeTheme.themeSource = 'system'
  if (process.platform === 'win32') {
    app.setAppUserModelId(app.isPackaged ? 'com.socialmediamanager.app' : process.execPath)
  }
  app.on('browser-window-created', (_, window) => watchWindowShortcuts(window))
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const blocked = new Set([
      'media',
      'mediaKeySystem',
      'geolocation',
      'notifications',
      'midi',
      'midiSysex',
      'pointerLock',
      'fullscreen',
      'openExternal'
    ])
    callback(!blocked.has(permission))
  })

  await initDriveStore()

  const devRendererUrl = !app.isPackaged ? process.env['ELECTRON_RENDERER_URL'] ?? null : null
  attachRendererContentSecurityPolicy(session.defaultSession, devRendererUrl)

  ipcMain.handle('store:read', () => readStore())
  ipcMain.handle('store:write', (_, payload: { posts: unknown[] }) => writeStore(payload))
  ipcMain.handle('clipboard:write', (_, text: string) => {
    clipboard.writeText(text ?? '')
    return true
  })
  ipcMain.handle('notes:read', () => readScratchpad())
  ipcMain.handle('notes:write', (_, text: string) => writeScratchpad(text))
  ipcMain.handle('theme:set', (_, source: 'light' | 'dark' | 'system') => {
    if (source === 'light' || source === 'dark' || source === 'system') {
      nativeTheme.themeSource = source
    }
  })
  ipcMain.handle('notify', (_, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })
  ipcMain.handle('external:open', (_, rawUrl: string) => {
    if (typeof rawUrl !== 'string') return false
    const safeUrl = toSafeExternalUrl(rawUrl)
    if (!safeUrl) return false
    void shell.openExternal(safeUrl)
    return true
  })

  ipcMain.handle('drive:status', () => driveGetStatus())
  ipcMain.handle('drive:connect', () => driveConnect())
  ipcMain.handle('drive:disconnect', () => driveDisconnect())
  ipcMain.handle('drive:syncNow', () => driveSyncNow())
  ipcMain.handle('youtube:status', () => getYouTubeAuthStatus())
  ipcMain.handle('youtube:connect', () => connectYouTubeListing())
  ipcMain.handle('youtube:disconnect', () => disconnectYouTubeAccount())
  ipcMain.handle('youtube:hasListAuth', () => hasYouTubeListAuth())
  ipcMain.handle('youtube:listChannels', () => listYouTubeChannels())
  ipcMain.handle('youtube:authorizeChannel', (_, channelId: string) => {
    if (typeof channelId !== 'string' || !channelId.trim()) {
      return Promise.reject(new Error('Missing YouTube channel id.'))
    }
    return authorizeYouTubeChannel(channelId.trim())
  })
  ipcMain.handle(
    'youtube:linkAccountBySignIn',
    (_, payload: { name: string; url: string }) => {
      const name = typeof payload?.name === 'string' ? payload.name : ''
      const url = typeof payload?.url === 'string' ? payload.url : ''
      if (!name.trim()) return Promise.reject(new Error('Missing account name.'))
      return linkYouTubeAccountBySignIn(name.trim(), url.trim())
    }
  )
  ipcMain.handle('youtube:getAuthorizedChannelIds', () => getAuthorizedYouTubeChannelIds())
  ipcMain.handle('workspace:readHydration', () => driveReadWorkspaceHydration())
  ipcMain.handle('workspace:reportSnapshot', (_, snapshot: Record<string, unknown>) =>
    driveReportWorkspaceSnapshot(snapshot ?? {})
  )
  ipcMain.handle('accounts:clearSessions', () => clearSocialSessions())
  ipcMain.handle('youtube:publish', (_, payload: {
    title: string
    description: string
    tags: string[]
    privacyStatus: 'private' | 'unlisted' | 'public'
    madeForKids: boolean
    publishAt: string | null
    videoBuffer: ArrayBuffer
    videoMimeType: string
    thumbnailBuffer?: ArrayBuffer
    thumbnailMimeType?: string
    channelId?: string | null
  }) => youtubeUploadVideo(payload))

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
