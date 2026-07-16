import { ElectronAPI } from '@electron-toolkit/preload'

export type StorePayload = { posts: unknown[] }

export type DriveSyncStatus = {
  connected: boolean
  email: string | null
  clientIdConfigured: boolean
  credentialsManaged: boolean
  appIsDev: boolean
  lastSyncedAt: number | null
  lastError: string | null
  syncing: boolean
  hasPendingChanges: boolean
}

export type YouTubeAuthStatus = {
  connected: boolean
  credentialsConfigured: boolean
  lastError: string | null
}
export type YouTubeChannel = {
  id: string
  title: string
  customUrl: string
}

export type AppAPI = {
  readStore: () => Promise<StorePayload>
  writeStore: (data: StorePayload) => Promise<void>
  copyText: (text: string) => Promise<boolean>
  readNotes: () => Promise<string>
  writeNotes: (text: string) => Promise<void>
  setTheme: (source: 'light' | 'dark' | 'system') => Promise<void>
  notify: (title: string, body: string) => Promise<void>
  openExternalUrl: (url: string) => Promise<boolean>
  clearAccountSessions: () => Promise<void>
  youtubePublish: (payload: {
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
  }) => Promise<{
    videoId: string
    watchUrl: string
    publishAt: string | null
    channelTitle: string
    thumbnailWarning: string | null
  }>

  driveGetStatus: () => Promise<DriveSyncStatus>
  driveConnect: () => Promise<DriveSyncStatus>
  driveDisconnect: () => Promise<DriveSyncStatus>
  driveSyncNow: () => Promise<DriveSyncStatus>
  youtubeGetStatus: () => Promise<YouTubeAuthStatus>
  youtubeConnect: () => Promise<YouTubeAuthStatus>
  youtubeDisconnect: () => Promise<YouTubeAuthStatus>
  youtubeListChannels: () => Promise<YouTubeChannel[]>
  youtubeAuthorizeChannel: (channelId: string) => Promise<void>
  youtubeLinkAccountBySignIn: (payload: { name: string; url: string }) => Promise<YouTubeChannel>
  youtubeGetAuthorizedChannelIds: () => Promise<string[]>
  youtubeHasListAuth: () => Promise<boolean>

  onDriveStatusChange: (cb: (status: Partial<DriveSyncStatus>) => void) => () => void
  onDrivePostsChange: (cb: (payload: { posts: unknown[] }) => void) => () => void
  onDriveScratchpadChange: (cb: (payload: { text: string }) => void) => () => void

  workspaceReadHydration: () => Promise<{ set: Record<string, string>; remove: string[] }>
  workspaceReportSnapshot: (snapshot: Record<string, string | null>) => Promise<void>
  onDriveWorkspaceChange: (
    cb: (payload: { set: Record<string, string>; remove: string[] }) => void
  ) => () => void
  onAccountSessionsCleared: (cb: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}

export {}
