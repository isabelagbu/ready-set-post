import { createContext, useCallback, useContext, useState } from 'react'
import {
  newAccountId,
  persistAccounts,
  readAccounts,
  type Account,
  type Platform
} from './types'

type AccountsContextType = {
  accounts: Account[]
  addAccount: (platform: Platform, name: string, url: string) => void
  updateAccount: (id: string, patch: Partial<Pick<Account, 'name' | 'url'>>) => void
  removeAccount: (id: string) => void
}

const AccountsContext = createContext<AccountsContextType>({
  accounts: [],
  addAccount: () => {},
  updateAccount: () => {},
  removeAccount: () => {}
})

export function AccountsProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [accounts, setAccounts] = useState<Account[]>(() => readAccounts())

  const addAccount = useCallback((platform: Platform, name: string, url: string) => {
    setAccounts((prev) => {
      const next = [...prev, { id: newAccountId(), platform, name, url }]
      persistAccounts(next)
      return next
    })
  }, [])

  const updateAccount = useCallback((id: string, patch: Partial<Pick<Account, 'name' | 'url'>>) => {
    setAccounts((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
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
    <AccountsContext.Provider value={{ accounts, addAccount, updateAccount, removeAccount }}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts(): AccountsContextType {
  return useContext(AccountsContext)
}
