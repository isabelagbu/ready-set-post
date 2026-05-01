import { ElectronAPI } from '@electron-toolkit/preload'

export type StorePayload = { posts: unknown[] }

export type AppAPI = {
  readStore: () => Promise<StorePayload>
  writeStore: (data: StorePayload) => Promise<void>
  replaceStoreWithDemoSeed: () => Promise<StorePayload>
  replaceStoreWithGenericDemoSeed: () => Promise<StorePayload>
  copyText: (text: string) => Promise<boolean>
  readNotes: () => Promise<string>
  writeNotes: (text: string) => Promise<void>
  setTheme: (source: 'light' | 'dark' | 'system') => Promise<void>
  notify: (title: string, body: string) => Promise<void>
  openExternalUrl: (url: string) => Promise<boolean>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}

export {}
