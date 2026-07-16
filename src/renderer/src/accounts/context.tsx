import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { WORKSPACE_SYNCED_EVENT } from '../workspace/sync'
import {
  applyYouTubeChannelLinks,
  type YouTubeChannelOption
} from './youtube-channel'
import {
  defaultPostingPermissions,
  newAccountId,
  persistAccounts,
  readAccounts,
  type Account,
  type Platform
} from './types'

type AccountsContextType = {
  accounts: Account[]
  addAccount: (platform: Platform, name: string, url: string) => void
  updateAccount: (id: string, patch: Partial<Pick<Account, 'name' | 'url' | 'postingPermissions' | 'youtubeChannelId'>>) => void
  linkYouTubePostingFromChannels: (channels: YouTubeChannelOption[]) => void
  removeAccount: (id: string) => void
}

const AccountsContext = createContext<AccountsContextType>({
  accounts: [],
  addAccount: () => {},
  updateAccount: () => {},
  linkYouTubePostingFromChannels: () => {},
  removeAccount: () => {}
})

export function AccountsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [accounts, setAccounts] = useState<Account[]>(() => readAccounts())

  useEffect(() => {
    const onSync = (): void => setAccounts(readAccounts())
    window.addEventListener(WORKSPACE_SYNCED_EVENT, onSync)
    return () => window.removeEventListener(WORKSPACE_SYNCED_EVENT, onSync)
  }, [])

  const addAccount = useCallback((platform: Platform, name: string, url: string) => {
    setAccounts((prev) => {
      const next = [
        ...prev,
        { id: newAccountId(), platform, name, url, postingPermissions: defaultPostingPermissions(), youtubeChannelId: null }
      ]
      persistAccounts(next)
      return next
    })
  }, [])

  const updateAccount = useCallback((id: string, patch: Partial<Pick<Account, 'name' | 'url' | 'postingPermissions' | 'youtubeChannelId'>>) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
      persistAccounts(next)
      return next
    })
  }, [])

  const linkYouTubePostingFromChannels = useCallback((channels: YouTubeChannelOption[]) => {
    setAccounts((prev) => {
      const next = applyYouTubeChannelLinks(prev, channels)
      const changed = next.some(
        (a, i) =>
          a.youtubeChannelId !== prev[i].youtubeChannelId ||
          a.postingPermissions.canPublish !== prev[i].postingPermissions.canPublish
      )
      if (!changed) return prev
      persistAccounts(next)
      return next
    })
  }, [])

  const removeAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id)
      persistAccounts(next)
      return next
    })
  }, [])

  return (
    <AccountsContext.Provider
      value={{ accounts, addAccount, updateAccount, linkYouTubePostingFromChannels, removeAccount }}
    >
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts(): AccountsContextType {
  return useContext(AccountsContext)
}
