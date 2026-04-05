export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'x'

export type Account = {
  id: string
  platform: Platform
  /** Display handle, e.g. "@mypage" */
  name: string
  /** URL loaded in the browser tab */
  url: string
}

export const PLATFORMS: Platform[] = ['tiktok', 'instagram', 'youtube', 'linkedin', 'x']

export const PLATFORM_META: Record<Platform, { label: string; color: string; defaultUrl: string }> = {
  tiktok:    { label: 'TikTok',    color: '#010101', defaultUrl: 'https://www.tiktok.com' },
  instagram: { label: 'Instagram', color: '#c13584', defaultUrl: 'https://www.instagram.com' },
  youtube:   { label: 'YouTube',   color: '#ff0000', defaultUrl: 'https://www.youtube.com' },
  linkedin:  { label: 'LinkedIn',  color: '#0077b5', defaultUrl: 'https://www.linkedin.com' },
  x:         { label: 'X',         color: '#000000', defaultUrl: 'https://www.x.com' },
}

/** Platform labels that map to account-based platforms */
export const ACCOUNT_PLATFORM_LABELS: Record<string, Platform> = {
  TikTok: 'tiktok',
  Instagram: 'instagram',
  YouTube: 'youtube',
  LinkedIn: 'linkedin',
  X: 'x'
}

const ACCOUNTS_KEY = 'smm-accounts'

export function newAccountId(): string {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function isValidAccount(x: unknown): x is Account {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return false
  const a = x as Record<string, unknown>
  return (
    typeof a.id === 'string' &&
    typeof a.platform === 'string' &&
    (PLATFORMS as string[]).includes(a.platform) &&
    typeof a.name === 'string' &&
    typeof a.url === 'string'
  )
}

export function readAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidAccount)
  } catch {
    return []
  }
}

export function persistAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch { /* ignore */ }
}
