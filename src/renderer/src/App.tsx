import { useEffect, useLayoutEffect, useState } from 'react'
import type { NavId } from './nav'
import { parsePost, type Post } from './posts/types'
import {
  applyThemeToDocument,
  persistAccent,
  persistTheme,
  readStoredAccent,
  readStoredTheme,
  type AccentPresetId,
  type AppTheme
} from './theme'
import CalendarView from './views/CalendarView'
import ContentView from './views/ContentView'
import DashboardView from './views/DashboardView'
import NotesView from './views/NotesView'
import AccountsView from './views/AccountsView'
import PlaceholderView from './views/PlaceholderView'
import SettingsView from './views/SettingsView'

function Icon({ d, d2 }: { d: string; d2?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="18" height="18">
      <path d={d} />
      {d2 && <path d={d2} />}
    </svg>
  )
}

const NAV: { id: NavId; label: string; icon: React.ReactElement }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Icon d="M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z" />
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Icon d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" d2="M16 2v4M8 2v4M3 10h18" />
  },
  {
    id: 'content',
    label: 'Content',
    icon: <Icon d="M4 6h16M4 10h16M4 14h10" />
  },
  {
    id: 'notes',
    label: 'Notepad',
    icon: <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  },
  {
    id: 'accounts',
    label: 'Accounts',
    icon: <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" d2="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  }
]

const SIDEBAR_STORAGE_KEY = 'smm-sidebar-collapsed'
const ACCOUNT_URLS_KEY = 'smm-account-urls'

export type AccountUrls = { tiktok: string; instagram: string; youtube: string }
const DEFAULT_ACCOUNT_URLS: AccountUrls = {
  tiktok: 'https://www.tiktok.com',
  instagram: 'https://www.instagram.com',
  youtube: 'https://www.youtube.com'
}

function readAccountUrls(): AccountUrls {
  try {
    const raw = localStorage.getItem(ACCOUNT_URLS_KEY)
    if (!raw) return { ...DEFAULT_ACCOUNT_URLS }
    const p = JSON.parse(raw) as Partial<AccountUrls>
    return {
      tiktok: p.tiktok || DEFAULT_ACCOUNT_URLS.tiktok,
      instagram: p.instagram || DEFAULT_ACCOUNT_URLS.instagram,
      youtube: p.youtube || DEFAULT_ACCOUNT_URLS.youtube
    }
  } catch {
    return { ...DEFAULT_ACCOUNT_URLS }
  }
}

export default function App(): React.ReactElement {
  const [active, setActive] = useState<NavId>('dashboard')
  const [posts, setPosts] = useState<Post[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === '1'
    } catch {
      return false
    }
  })
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme())
  const [accent, setAccent] = useState<AccentPresetId>(() => readStoredAccent())
  const [accountUrls, setAccountUrls] = useState<AccountUrls>(() => readAccountUrls())

  function updateAccountUrl(platform: keyof AccountUrls, url: string): void {
    setAccountUrls((prev) => {
      const next = { ...prev, [platform]: url }
      try { localStorage.setItem(ACCOUNT_URLS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }

  function toggleSidebar(): void {
    setSidebarCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { posts: raw } = await window.api.readStore()
      const parsed = (raw ?? []).map(parsePost).filter((p): p is Post => p !== null)
      if (!cancelled) {
        setPosts(parsed)
        setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const t = setTimeout(() => {
      void window.api.writeStore({ posts })
    }, 400)
    return () => clearTimeout(t)
  }, [posts, loaded])

  useLayoutEffect(() => {
    applyThemeToDocument(theme, accent)
    persistTheme(theme)
    persistAccent(accent)
    void window.api.setTheme(theme)
  }, [theme, accent])

  return (
    <div className="shell">
      <aside
        className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <span className="brand-mark" aria-hidden />
            <span className="brand-name">Social</span>
          </div>
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-expanded={!sidebarCollapsed}
            aria-controls="app-sidebar-nav"
            title={sidebarCollapsed ? 'Expand menu' : 'Minimize menu'}
            aria-label={sidebarCollapsed ? 'Expand menu' : 'Minimize menu'}
          >
            <span className="hamburger-icon" aria-hidden>
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </span>
          </button>
        </div>
        <nav id="app-sidebar-nav" className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => setActive(item.id)}
              aria-label={sidebarCollapsed ? item.label : undefined}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main">
        {active === 'dashboard' && (
          <DashboardView posts={posts} onNavigate={setActive} />
        )}
        {active === 'calendar' && <CalendarView posts={posts} setPosts={setPosts} />}
        {active === 'content' && <ContentView posts={posts} setPosts={setPosts} />}
        {active === 'notes' && <NotesView />}
        {active === 'accounts' && <AccountsView urls={accountUrls} />}
        {active === 'settings' && (
          <SettingsView
            theme={theme}
            accent={accent}
            onThemeChange={setTheme}
            onAccentChange={setAccent}
            accountUrls={accountUrls}
            onAccountUrlChange={updateAccountUrl}
          />
        )}
      </main>
    </div>
  )
}
