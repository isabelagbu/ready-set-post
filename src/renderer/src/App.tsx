import { useEffect, useState } from 'react'
import type { NavId } from './nav'
import { parsePost, type Post } from './posts/types'
import CalendarView from './views/CalendarView'
import DashboardView from './views/DashboardView'
import NotesView from './views/NotesView'
import PlaceholderView from './views/PlaceholderView'

const NAV: { id: NavId; label: string; short: string }[] = [
  { id: 'dashboard', label: 'Dashboard', short: 'D' },
  { id: 'calendar', label: 'Calendar', short: 'C' },
  { id: 'notes', label: 'Notepad', short: 'N' },
  { id: 'accounts', label: 'Accounts', short: 'A' },
  { id: 'settings', label: 'Settings', short: 'S' }
]

const SIDEBAR_STORAGE_KEY = 'smm-sidebar-collapsed'

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
              <span className="nav-short" aria-hidden>
                {item.short}
              </span>
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
        {active === 'notes' && <NotesView />}
        {active === 'accounts' && (
          <PlaceholderView
            title="Accounts"
            body="Connect social accounts here when you add API integrations."
          />
        )}
        {active === 'settings' && (
          <PlaceholderView title="Settings" body="App preferences will live here." />
        )}
      </main>
    </div>
  )
}
