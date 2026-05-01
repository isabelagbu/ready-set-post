export type Platform = 'tiktok' | 'instagram' | 'threads' | 'youtube' | 'linkedin' | 'x'

export type Account = {
  id: string
  platform: Platform
  /** Display handle, e.g. "@mypage" */
  name: string
  /** URL loaded in the browser tab */
  url: string
}

export const PLATFORMS: Platform[] = ['tiktok', 'instagram', 'threads', 'youtube', 'linkedin', 'x']

export const PLATFORM_META: Record<Platform, { label: string; color: string; defaultUrl: string }> = {
  tiktok:    { label: 'TikTok',    color: '#010101', defaultUrl: 'https://www.tiktok.com' },
  instagram: { label: 'Instagram', color: '#c13584', defaultUrl: 'https://www.instagram.com' },
  threads:   { label: 'Threads',   color: '#000000', defaultUrl: 'https://www.threads.net' },
  youtube:   { label: 'YouTube',   color: '#ff0000', defaultUrl: 'https://www.youtube.com' },
  linkedin:  { label: 'LinkedIn',  color: '#0077b5', defaultUrl: 'https://www.linkedin.com' },
  x:         { label: 'X',         color: '#000000', defaultUrl: 'https://www.x.com' },
}

/** Platform labels that map to account-based platforms */
export const ACCOUNT_PLATFORM_LABELS: Record<string, Platform> = {
  TikTok: 'tiktok',
  Instagram: 'instagram',
  Threads: 'threads',
  YouTube: 'youtube',
  LinkedIn: 'linkedin',
  X: 'x'
}

const ACCOUNTS_KEY = 'smm-accounts'
const ACCOUNTS_DEMO_VERSION_KEY = 'smm-accounts-demo-v'

/** Bump when `getSeedAccounts()` changes; demo-only rows refresh on next load. */
export const DEMO_ACCOUNTS_VERSION = 5

export function newAccountId(): string {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Stable IDs — keep in sync with the `A` account id map in `src/main/seed-data.ts`. */
export const SEED_ACCOUNT_IDS = {
  youtube: 'seed-acc-youtube',
  youtubeMusic: 'seed-acc-youtube-music',
  instagram: 'seed-acc-instagram',
  instagramTech: 'seed-acc-instagram-tech',
  threads: 'seed-acc-threads',
  tiktok: 'seed-acc-tiktok',
  tiktokTech: 'seed-acc-tiktok-tech',
  linkedin: 'seed-acc-linkedin',
  x: 'seed-acc-x'
} as const

export function getSeedAccounts(): Account[] {
  return [
    {
      id: SEED_ACCOUNT_IDS.youtube,
      platform: 'youtube',
      name: '@xomisdiary',
      url: 'https://www.youtube.com/@xomisdiary'
    },
    {
      id: SEED_ACCOUNT_IDS.youtubeMusic,
      platform: 'youtube',
      name: '@sincerely_xomi',
      url: 'https://www.youtube.com/@sincerely_xomi'
    },
    {
      id: SEED_ACCOUNT_IDS.instagram,
      platform: 'instagram',
      name: '@sincerely_xomi',
      url: 'https://www.instagram.com/sincerely_xomi/'
    },
    {
      id: SEED_ACCOUNT_IDS.instagramTech,
      platform: 'instagram',
      name: '@xomitech',
      url: 'https://www.instagram.com/xomitech/'
    },
    {
      id: SEED_ACCOUNT_IDS.threads,
      platform: 'threads',
      name: '@sincerely_xomi',
      url: 'https://www.threads.com/@sincerely_xomi'
    },
    {
      id: SEED_ACCOUNT_IDS.tiktok,
      platform: 'tiktok',
      name: '@sincerely_xomi',
      url: 'https://www.tiktok.com/@sincerely_xomi'
    },
    {
      id: SEED_ACCOUNT_IDS.tiktokTech,
      platform: 'tiktok',
      name: '@xomitech',
      url: 'https://www.tiktok.com/@xomitech'
    },
    {
      id: SEED_ACCOUNT_IDS.linkedin,
      platform: 'linkedin',
      name: 'Isabel Agbu',
      url: 'https://www.linkedin.com/in/isabel-agbu/'
    },
    {
      id: SEED_ACCOUNT_IDS.x,
      platform: 'x',
      name: '@strawbericheri',
      url: 'https://x.com/strawbericheri'
    }
  ]
}

export function getGenericSeedAccounts(): Account[] {
  return [
    {
      id: SEED_ACCOUNT_IDS.youtube,
      platform: 'youtube',
      name: '@creator_demo',
      url: 'https://www.youtube.com'
    },
    {
      id: SEED_ACCOUNT_IDS.instagram,
      platform: 'instagram',
      name: '@creator.demo',
      url: 'https://www.instagram.com'
    },
    {
      id: SEED_ACCOUNT_IDS.threads,
      platform: 'threads',
      name: '@creator.demo',
      url: 'https://www.threads.net'
    },
    {
      id: SEED_ACCOUNT_IDS.tiktok,
      platform: 'tiktok',
      name: '@creator_demo',
      url: 'https://www.tiktok.com'
    },
    {
      id: SEED_ACCOUNT_IDS.linkedin,
      platform: 'linkedin',
      name: 'Creator Demo',
      url: 'https://www.linkedin.com'
    },
    {
      id: SEED_ACCOUNT_IDS.x,
      platform: 'x',
      name: '@creator_demo',
      url: 'https://x.com'
    }
  ]
}

export function replaceAccountsWithSeed(kind: 'personal' | 'generic'): Account[] {
  const seed = kind === 'generic' ? getGenericSeedAccounts() : getSeedAccounts()
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed))
    localStorage.setItem(ACCOUNTS_DEMO_VERSION_KEY, String(DEMO_ACCOUNTS_VERSION))
  } catch {
    /* ignore */
  }
  return seed
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

function isDemoOnlyAccountList(accounts: Account[]): boolean {
  return accounts.length > 0 && accounts.every((a) => a.id.startsWith('seed-acc-'))
}

export function readAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    if (raw === null) {
      const seed = getSeedAccounts()
      try {
        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed))
        localStorage.setItem(ACCOUNTS_DEMO_VERSION_KEY, String(DEMO_ACCOUNTS_VERSION))
      } catch {
        /* ignore */
      }
      return seed
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const accounts = parsed.filter(isValidAccount)
    if (isDemoOnlyAccountList(accounts)) {
      try {
        if (localStorage.getItem(ACCOUNTS_DEMO_VERSION_KEY) !== String(DEMO_ACCOUNTS_VERSION)) {
          const seed = getSeedAccounts()
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed))
          localStorage.setItem(ACCOUNTS_DEMO_VERSION_KEY, String(DEMO_ACCOUNTS_VERSION))
          return seed
        }
      } catch {
        /* ignore */
      }
    }
    return accounts
  } catch {
    return []
  }
}

export function persistAccounts(accounts: Account[]): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  } catch { /* ignore */ }
}
