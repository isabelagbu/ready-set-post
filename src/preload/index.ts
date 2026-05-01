import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  readStore: (): Promise<{ posts: unknown[] }> => ipcRenderer.invoke('store:read'),
  writeStore: (data: { posts: unknown[] }): Promise<void> =>
    ipcRenderer.invoke('store:write', data),
  replaceStoreWithDemoSeed: (): Promise<{ posts: unknown[] }> =>
    ipcRenderer.invoke('store:replaceDemo'),
  replaceStoreWithGenericDemoSeed: (): Promise<{ posts: unknown[] }> =>
    ipcRenderer.invoke('store:replaceDemoGeneric'),
  copyText: (text: string): Promise<boolean> => ipcRenderer.invoke('clipboard:write', text),
  readNotes: (): Promise<string> => ipcRenderer.invoke('notes:read'),
  writeNotes: (text: string): Promise<void> => ipcRenderer.invoke('notes:write', text),
  setTheme: (source: 'light' | 'dark' | 'system'): Promise<void> =>
    ipcRenderer.invoke('theme:set', source),
  notify: (title: string, body: string): Promise<void> =>
    ipcRenderer.invoke('notify', title, body),
  openExternalUrl: (url: string): Promise<boolean> => ipcRenderer.invoke('external:open', url)
}

contextBridge.exposeInMainWorld('electron', electronAPI)
contextBridge.exposeInMainWorld('api', api)
