import { app, safeStorage, shell } from 'electron'
import { createHash, randomBytes } from 'crypto'
import { createServer, type Server } from 'http'
import { existsSync } from 'fs'
import { mkdir, readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { config as loadDotenv } from 'dotenv'

loadDotenv({ path: join(process.cwd(), '.env') })
loadDotenv({ path: join(process.cwd(), '.env.local'), override: true })

const TOKEN_FILE = 'drive-tokens.bin'
const CHANNEL_TOKEN_FILE = 'youtube-channel-tokens.bin'
const YOUTUBE_LIST_TOKEN_FILE = 'youtube-list-tokens.bin'
const CONFIG_FILE = 'drive-config.json'

/** Google Drive sync only — can be a different Google account than YouTube. */
const SCOPES_DRIVE = ['https://www.googleapis.com/auth/drive.file']
/** Per-channel upload sign-in (one token per channel). */
const SCOPES_YOUTUBE_CHANNEL = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly'
]
/** Optional: list channels for handle matching (manager Google account). */
const SCOPES_YOUTUBE_LIST = ['https://www.googleapis.com/auth/youtube.readonly']

const SCOPE_DRIVE = 'https://www.googleapis.com/auth/drive.file'
const SCOPE_YOUTUBE_UPLOAD = 'https://www.googleapis.com/auth/youtube.upload'
const SCOPE_YOUTUBE_READONLY = 'https://www.googleapis.com/auth/youtube.readonly'

export type OAuthFlowOptions = {
  scopes: string[]
  /** Use Drive API for email (Drive connect). Otherwise Google userinfo. */
  useDriveEmail?: boolean
}

export type YouTubeChannelInfo = {
  id: string
  title: string
  customUrl: string
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildOAuthSuccessHtml(grantedScope: string): string {
  const granted = new Set(grantedScope.split(/\s+/).filter(Boolean))
  const hasDrive = granted.has(SCOPE_DRIVE)
  const hasYouTubeUpload = granted.has(SCOPE_YOUTUBE_UPLOAD)
  const hasYouTubeRead = granted.has(SCOPE_YOUTUBE_READONLY)
  const hasYouTube = hasYouTubeUpload || hasYouTubeRead

  let title: string
  if (hasDrive && hasYouTube) {
    title = 'Google Drive & YouTube connected'
  } else if (hasDrive) {
    title = 'Google Drive connected'
  } else if (hasYouTube) {
    title = 'YouTube connected for posting'
  } else {
    title = 'Google account connected'
  }

  const details: string[] = []
  if (hasDrive) {
    details.push('Ready Set Post can sync your posts and notes to your Drive folder.')
  }
  if (hasYouTubeUpload && hasYouTubeRead) {
    details.push('You can connect YouTube accounts in Settings and publish or schedule videos.')
  } else if (hasYouTubeUpload) {
    details.push(
      'You can upload videos. For automatic channel linking, reconnect and allow YouTube view access too.'
    )
  } else if (hasYouTubeRead) {
    details.push('YouTube view access is enabled so the app can link your channels.')
  }
  if (details.length === 0) {
    details.push('Ready Set Post received access. Return to the app to continue.')
  }

  const body = `${details.join(' ')} You can close this tab and return to the app.`
  const safeTitle = escapeHtml(title)
  const safeBody = escapeHtml(body)

  return (
    '<!doctype html><html><head><meta charset="utf-8"><title>Connected to Ready Set Post</title>' +
    '<style>body{font-family:-apple-system,Segoe UI,Helvetica,sans-serif;background:#fff8fa;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}' +
    '.card{background:#fff;padding:36px 48px;border-radius:18px;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center;max-width:440px}' +
    'h1{margin:0 0 12px;font-size:20px;color:#cc4f7e}p{margin:0;color:#555;font-size:14px;line-height:1.55}</style></head>' +
    `<body><div class="card"><h1>${safeTitle}</h1><p>${safeBody}</p></div></body></html>`
  )
}

export type TokenSet = {
  accessToken: string
  refreshToken: string
  expiry: number
  scope: string
  email: string | null
  /** Channel that receives uploads for this OAuth token (when detectable). */
  youtubeUploadChannelId?: string | null
}

type ChannelTokenStore = Record<string, TokenSet>

export type DriveConfig = {
  clientId: string
  clientSecret: string
}

export function hasManagedDriveCredentials(): boolean {
  return (process.env.GOOGLE_CLIENT_ID || '').trim().length > 0
}

function tokenPath(): string {
  return join(app.getPath('userData'), TOKEN_FILE)
}

function channelTokenPath(): string {
  return join(app.getPath('userData'), CHANNEL_TOKEN_FILE)
}

function youtubeListTokenPath(): string {
  return join(app.getPath('userData'), YOUTUBE_LIST_TOKEN_FILE)
}

function configPath(): string {
  return join(app.getPath('userData'), CONFIG_FILE)
}

async function ensureUserDataDir(): Promise<void> {
  const dir = app.getPath('userData')
  if (!existsSync(dir)) await mkdir(dir, { recursive: true })
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32))
  const challenge = base64url(createHash('sha256').update(verifier).digest())
  return { verifier, challenge }
}

export async function readDriveConfig(): Promise<DriveConfig> {
  // Build-time env wins so production builds can ship with a default client id.
  const envId = (process.env.GOOGLE_CLIENT_ID || '').trim()
  const envSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim()
  if (envId) return { clientId: envId, clientSecret: envSecret }
  try {
    if (!existsSync(configPath())) return { clientId: '', clientSecret: '' }
    const raw = await readFile(configPath(), 'utf-8')
    const data = JSON.parse(raw) as { clientId?: unknown; clientSecret?: unknown }
    return {
      clientId: typeof data.clientId === 'string' ? data.clientId.trim() : '',
      clientSecret: typeof data.clientSecret === 'string' ? data.clientSecret.trim() : ''
    }
  } catch {
    return { clientId: '', clientSecret: '' }
  }
}

export async function writeDriveConfig(next: DriveConfig): Promise<void> {
  await ensureUserDataDir()
  await writeFile(
    configPath(),
    JSON.stringify(
      { clientId: next.clientId.trim(), clientSecret: next.clientSecret.trim() },
      null,
      2
    ),
    'utf-8'
  )
}

export async function getStoredTokens(): Promise<TokenSet | null> {
  try {
    if (!existsSync(tokenPath())) return null
    const raw = await readFile(tokenPath())
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf-8')
    const parsed = JSON.parse(json) as Partial<TokenSet>
    if (!parsed || typeof parsed.accessToken !== 'string' || typeof parsed.refreshToken !== 'string') {
      return null
    }
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiry: typeof parsed.expiry === 'number' ? parsed.expiry : 0,
      scope: typeof parsed.scope === 'string' ? parsed.scope : SCOPES_DRIVE.join(' '),
      email: typeof parsed.email === 'string' ? parsed.email : null,
      youtubeUploadChannelId:
        typeof parsed.youtubeUploadChannelId === 'string' ? parsed.youtubeUploadChannelId : null
    }
  } catch {
    return null
  }
}

async function saveTokens(tokens: TokenSet): Promise<void> {
  await ensureUserDataDir()
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    await writeFile(tokenPath(), safeStorage.encryptString(json))
  } else {
    await writeFile(tokenPath(), json, 'utf-8')
  }
}

/** Clears Drive sync tokens only (YouTube channel sign-ins are kept). */
export async function clearTokens(): Promise<void> {
  try {
    await unlink(tokenPath())
  } catch {
    /* ignore */
  }
}

export async function clearYouTubeListTokens(): Promise<void> {
  try {
    await unlink(youtubeListTokenPath())
  } catch {
    /* ignore */
  }
}

/** Clears all YouTube posting sign-ins (per-channel + channel list). */
export async function clearAllYouTubeAuth(): Promise<void> {
  await clearChannelTokens()
  await clearYouTubeListTokens()
}

async function readChannelTokenStore(): Promise<ChannelTokenStore> {
  try {
    if (!existsSync(channelTokenPath())) return {}
    const raw = await readFile(channelTokenPath())
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf-8')
    const parsed = JSON.parse(json) as ChannelTokenStore
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function writeChannelTokenStore(store: ChannelTokenStore): Promise<void> {
  await ensureUserDataDir()
  const json = JSON.stringify(store)
  if (safeStorage.isEncryptionAvailable()) {
    await writeFile(channelTokenPath(), safeStorage.encryptString(json))
  } else {
    await writeFile(channelTokenPath(), json, 'utf-8')
  }
}

export async function clearChannelTokens(): Promise<void> {
  try {
    await unlink(channelTokenPath())
  } catch {
    /* ignore */
  }
}

export async function getAuthorizedYouTubeChannelIds(): Promise<string[]> {
  return Object.keys(await readChannelTokenStore())
}

export async function hasYouTubeListAuth(): Promise<boolean> {
  const tokens = await getYouTubeListTokens()
  return !!tokens?.refreshToken
}

async function getYouTubeListTokens(): Promise<TokenSet | null> {
  try {
    if (!existsSync(youtubeListTokenPath())) return null
    const raw = await readFile(youtubeListTokenPath())
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString('utf-8')
    const parsed = JSON.parse(json) as Partial<TokenSet>
    if (!parsed?.accessToken || !parsed.refreshToken) return null
    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiry: typeof parsed.expiry === 'number' ? parsed.expiry : 0,
      scope: typeof parsed.scope === 'string' ? parsed.scope : SCOPES_YOUTUBE_LIST.join(' '),
      email: typeof parsed.email === 'string' ? parsed.email : null
    }
  } catch {
    return null
  }
}

async function saveYouTubeListTokens(tokens: TokenSet): Promise<void> {
  await ensureUserDataDir()
  const json = JSON.stringify(tokens)
  if (safeStorage.isEncryptionAvailable()) {
    await writeFile(youtubeListTokenPath(), safeStorage.encryptString(json))
  } else {
    await writeFile(youtubeListTokenPath(), json, 'utf-8')
  }
}

export async function hasAnyYouTubeAuth(): Promise<boolean> {
  if (await hasYouTubeListAuth()) return true
  return (await getAuthorizedYouTubeChannelIds()).length > 0
}

export async function detectYouTubeUploadChannelId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true&maxResults=50',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!res.ok) return null
    const json = (await res.json()) as { items?: Array<{ id?: string }> }
    const ids = (json.items ?? []).map((i) => i.id).filter((id): id is string => typeof id === 'string')
    return ids.length === 1 ? ids[0] : null
  } catch {
    return null
  }
}

async function refreshTokenSet(tokens: TokenSet): Promise<string> {
  if (tokens.expiry > Date.now() + 5_000) return tokens.accessToken
  const { clientId, clientSecret } = await readDriveConfig()
  if (!clientId) throw new Error('Google Drive is not configured for this build.')
  const body = new URLSearchParams({
    refresh_token: tokens.refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token'
  })
  if (clientSecret) body.set('client_secret', clientSecret)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) throw new Error('YouTube authorization expired. Sign in to this channel again in Settings.')
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokens.accessToken = data.access_token
  tokens.expiry = Date.now() + Math.max(60, data.expires_in - 60) * 1000
  return tokens.accessToken
}

async function getStoredChannelToken(channelId: string): Promise<TokenSet | null> {
  const store = await readChannelTokenStore()
  const tokens = store[channelId]
  if (!tokens?.accessToken || !tokens.refreshToken) return null
  return tokens
}

async function saveChannelToken(channelId: string, tokens: TokenSet): Promise<void> {
  const store = await readChannelTokenStore()
  store[channelId] = tokens
  await writeChannelTokenStore(store)
}

function assertYouTubeScopes(scope: string): void {
  const granted = new Set(scope.split(/\s+/).filter(Boolean))
  if (!granted.has(SCOPE_YOUTUBE_UPLOAD)) {
    throw new Error('YouTube upload permission was not granted.')
  }
}

/**
 * Access token for uploading to a specific YouTube channel.
 * Uses per-channel OAuth when the main Google session uploads elsewhere.
 */
/** Ensure this OAuth token actually uploads to the expected channel id. */
export async function assertUploadTokenMatchesChannel(
  channelId: string,
  accessToken: string
): Promise<YouTubeChannelInfo> {
  const channels = await fetchYouTubeChannels(accessToken)
  const target = channels.find((c) => c.id === channelId)
  if (!target) {
    throw new Error(
      'Selected YouTube channel is not available with the current sign-in. Use Settings → Sign in to this channel on that account.'
    )
  }
  const uploadAsId = await detectYouTubeUploadChannelId(accessToken)
  if (uploadAsId && uploadAsId !== channelId) {
    const actual = channels.find((c) => c.id === uploadAsId)
    throw new Error(
      `Your Google sign-in uploads to “${actual?.title ?? uploadAsId}”, not “${target.title}”. ` +
        'In Settings, open that YouTube row and tap Sign in to this channel, then choose the matching channel in Google.'
    )
  }
  return target
}

export async function getYouTubeAccessTokenForChannel(channelId: string): Promise<string> {
  const channelTokens = await getStoredChannelToken(channelId)
  if (!channelTokens) {
    throw new Error(
      'This YouTube channel is not signed in yet. In Settings, use “Sign in to this channel” on that account, then pick it in Google’s channel list.'
    )
  }
  assertYouTubeScopes(channelTokens.scope)
  const access = await refreshTokenSet(channelTokens)
  await saveChannelToken(channelId, channelTokens)
  await assertUploadTokenMatchesChannel(channelId, access)
  return access
}

function extractYouTubeHandle(name: string, url: string): string | null {
  const fromName = name.trim().replace(/^@/, '').toLowerCase()
  if (fromName && /^[a-z0-9._-]+$/i.test(fromName)) return fromName
  try {
    const raw = url.trim()
    if (!raw) return null
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const seg = u.pathname.split('/').filter(Boolean)
    if (seg[0]?.startsWith('@')) return seg[0].slice(1).toLowerCase()
  } catch {
    /* ignore */
  }
  return null
}

function channelMatchesHandle(ch: YouTubeChannelInfo, handle: string): boolean {
  const handleKey = handle.toLowerCase().replace(/[^a-z0-9]/g, '')
  const custom = (ch.customUrl ?? '').toLowerCase()
  if (
    custom === `@${handle}` ||
    custom.endsWith(`/@${handle}`) ||
    custom.endsWith(`/${handle}`)
  ) {
    return true
  }
  const titleKey = (ch.title ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return titleKey === handleKey
}

/**
 * OAuth for one app account row: user picks the channel in Google, then we link that channel id.
 * Does not require channels.list to include every brand first.
 */
export async function linkYouTubeAccountBySignIn(
  name: string,
  url: string
): Promise<YouTubeChannelInfo> {
  const expectedHandle = extractYouTubeHandle(name, url)
  const tokens = await runOAuthBrowserFlow({ scopes: SCOPES_YOUTUBE_CHANNEL })
  assertYouTubeScopes(tokens.scope)
  const uploadId = tokens.youtubeUploadChannelId ?? (await detectYouTubeUploadChannelId(tokens.accessToken))
  if (!uploadId) {
    throw new Error(
      'Could not confirm which YouTube channel you selected. Try again and pick the channel in Google’s list.'
    )
  }
  const channels = await fetchYouTubeChannels(tokens.accessToken)
  const ch =
    channels.find((c) => c.id === uploadId) ??
    channels[0] ?? { id: uploadId, title: name, customUrl: url }
  if (expectedHandle && !channelMatchesHandle(ch, expectedHandle)) {
    throw new Error(
      `You signed in to “${ch.title}” but this row is ${name}. In Google, pick the channel that matches this handle, then try again.`
    )
  }
  await saveChannelToken(uploadId, { ...tokens, youtubeUploadChannelId: uploadId })
  return { id: uploadId, title: ch.title, customUrl: ch.customUrl }
}

/** OAuth for one YouTube channel (brand account picker). Saves tokens for that channelId only. */
export async function authorizeYouTubeChannel(forChannelId: string): Promise<void> {
  const tokens = await runOAuthBrowserFlow({ scopes: SCOPES_YOUTUBE_CHANNEL })
  assertYouTubeScopes(tokens.scope)
  const uploadId = tokens.youtubeUploadChannelId ?? (await detectYouTubeUploadChannelId(tokens.accessToken))
  if (!uploadId) {
    throw new Error(
      'Could not confirm which YouTube channel you selected. Try again and pick the channel in Google’s list.'
    )
  }
  if (uploadId !== forChannelId) {
    throw new Error(
      'You signed in to a different YouTube channel than this account. Try again and select the matching channel in Google.'
    )
  }
  await saveChannelToken(forChannelId, { ...tokens, youtubeUploadChannelId: uploadId })
}

/** Drive sync only — separate Google account from YouTube. */
export async function startDriveOAuthFlow(): Promise<TokenSet> {
  const tokens = await runOAuthBrowserFlow({ scopes: SCOPES_DRIVE, useDriveEmail: true })
  await saveTokens({ ...tokens, youtubeUploadChannelId: null })
  return tokens
}

/** @deprecated Use startDriveOAuthFlow */
export const startOAuthFlow = startDriveOAuthFlow

/** Optional Google sign-in to list channels for handle matching (any manager account). */
export async function startYouTubeListOAuthFlow(): Promise<TokenSet> {
  const tokens = await runOAuthBrowserFlow({ scopes: SCOPES_YOUTUBE_LIST })
  await saveYouTubeListTokens(tokens)
  return tokens
}

async function getYouTubeListAccessToken(): Promise<string | null> {
  const tokens = await getYouTubeListTokens()
  if (!tokens) return null
  const access = await refreshTokenSet(tokens)
  await saveYouTubeListTokens(tokens)
  return access
}

export async function fetchYouTubeChannels(accessToken: string): Promise<YouTubeChannelInfo[]> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true&maxResults=50',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YouTube channels fetch failed (${res.status}): ${text}`)
  }
  const json = (await res.json()) as {
    items?: Array<{ id?: string; snippet?: { title?: string; customUrl?: string } }>
  }
  return (json.items ?? [])
    .filter((item): item is { id: string; snippet: { title?: string; customUrl?: string } } => typeof item.id === 'string')
    .map((item) => ({
      id: item.id,
      title: item.snippet?.title?.trim() || item.id,
      customUrl: item.snippet?.customUrl?.trim() ?? ''
    }))
}

/** Merge channels from list-auth and every per-channel token. */
export async function listAllAccessibleYouTubeChannels(): Promise<YouTubeChannelInfo[]> {
  const byId = new Map<string, YouTubeChannelInfo>()
  const listAccess = await getYouTubeListAccessToken()
  if (listAccess) {
    for (const ch of await fetchYouTubeChannels(listAccess)) {
      byId.set(ch.id, ch)
    }
  }
  const store = await readChannelTokenStore()
  for (const [channelId, tokens] of Object.entries(store)) {
    try {
      const access = await refreshTokenSet(tokens)
      await saveChannelToken(channelId, tokens)
      for (const ch of await fetchYouTubeChannels(access)) {
        byId.set(ch.id, ch)
      }
    } catch {
      /* skip expired channel tokens */
    }
  }
  return [...byId.values()]
}

async function fetchDriveUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress)', {
      headers: { authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return null
    const data = (await res.json()) as { user?: { emailAddress?: string } }
    return data.user?.emailAddress ?? null
  } catch {
    return null
  }
}

async function fetchGoogleUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!res.ok) return null
    const data = (await res.json()) as { email?: string }
    return data.email ?? null
  } catch {
    return null
  }
}

/** Run the loopback PKCE flow. Returns tokens without saving (caller decides storage). */
export async function runOAuthBrowserFlow(
  options: OAuthFlowOptions = { scopes: SCOPES_DRIVE, useDriveEmail: true }
): Promise<TokenSet> {
  const { clientId, clientSecret } = await readDriveConfig()
  if (!clientId) {
    throw new Error('Google Drive is not configured for this build.')
  }

  const { verifier, challenge } = generatePkce()

  return new Promise<TokenSet>((resolve, reject) => {
    let server: Server | null = null
    const timeout = setTimeout(() => {
      try {
        server?.close()
      } catch {
        /* ignore */
      }
      reject(new Error('Sign-in timed out. Please try again.'))
    }, 5 * 60 * 1000)

    server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://127.0.0.1')
        if (url.pathname !== '/callback') {
          res.writeHead(404).end('Not found')
          return
        }
        const code = url.searchParams.get('code')
        const errorParam = url.searchParams.get('error')
        if (errorParam) {
          res
            .writeHead(400, { 'content-type': 'text/html' })
            .end(`<h1>Sign-in cancelled</h1><p>${errorParam}</p>`)
          clearTimeout(timeout)
          server?.close()
          reject(new Error(errorParam))
          return
        }
        if (!code) {
          res.writeHead(400).end('Missing authorization code')
          return
        }
        const addr = server?.address()
        const port = typeof addr === 'object' && addr ? addr.port : 0
        const redirectUri = `http://127.0.0.1:${port}/callback`
        const body = new URLSearchParams({
          code,
          client_id: clientId,
          code_verifier: verifier,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
        if (clientSecret) body.set('client_secret', clientSecret)
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body
        })
        if (!tokenRes.ok) {
          const text = await tokenRes.text()
          res
            .writeHead(400, { 'content-type': 'text/html' })
            .end(`<h1>Token exchange failed</h1><pre>${text}</pre>`)
          clearTimeout(timeout)
          server?.close()
          reject(new Error(`Token exchange failed: ${text}`))
          return
        }
        const tokenData = (await tokenRes.json()) as {
          access_token: string
          refresh_token?: string
          expires_in: number
          scope: string
        }
        if (!tokenData.refresh_token) {
          res.writeHead(400, { 'content-type': 'text/html' }).end(
            '<h1>No refresh token returned</h1><p>Visit https://myaccount.google.com/permissions, remove Ready Set Post, and try again.</p>'
          )
          clearTimeout(timeout)
          server?.close()
          reject(
            new Error(
              'No refresh token returned. Remove Ready Set Post from your Google account permissions and try again.'
            )
          )
          return
        }
        const hasYouTubeScope = tokenData.scope.includes('youtube')
        const uploadChannelId = hasYouTubeScope
          ? await detectYouTubeUploadChannelId(tokenData.access_token)
          : null
        const email = options.useDriveEmail
          ? await fetchDriveUserEmail(tokenData.access_token)
          : await fetchGoogleUserEmail(tokenData.access_token)
        const tokens: TokenSet = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiry: Date.now() + Math.max(60, tokenData.expires_in - 60) * 1000,
          scope: tokenData.scope,
          email,
          youtubeUploadChannelId: uploadChannelId
        }
        res.writeHead(200, { 'content-type': 'text/html' }).end(buildOAuthSuccessHtml(tokenData.scope))
        clearTimeout(timeout)
        server?.close()
        resolve(tokens)
      } catch (err) {
        clearTimeout(timeout)
        try {
          server?.close()
        } catch {
          /* ignore */
        }
        reject(err as Error)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      const addr = server?.address()
      const port = typeof addr === 'object' && addr ? addr.port : 0
      const redirectUri = `http://127.0.0.1:${port}/callback`
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: options.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent select_account',
        code_challenge: challenge,
        code_challenge_method: 'S256'
      })
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      void shell.openExternal(authUrl)
    })
  })
}

/** Returns a valid access token, refreshing if necessary. Returns null when not connected. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens()
  if (!tokens) return null
  if (tokens.expiry > Date.now() + 5_000) return tokens.accessToken
  const { clientId, clientSecret } = await readDriveConfig()
  if (!clientId) return null
  const body = new URLSearchParams({
    refresh_token: tokens.refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token'
  })
  if (clientSecret) body.set('client_secret', clientSecret)
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!res.ok) return null
  const data = (await res.json()) as { access_token: string; expires_in: number }
  const next: TokenSet = {
    ...tokens,
    accessToken: data.access_token,
    expiry: Date.now() + Math.max(60, data.expires_in - 60) * 1000
  }
  await saveTokens(next)
  return next.accessToken
}

export async function isConnected(): Promise<boolean> {
  const tokens = await getStoredTokens()
  return !!tokens
}

export async function getConnectedEmail(): Promise<string | null> {
  const tokens = await getStoredTokens()
  return tokens?.email ?? null
}
