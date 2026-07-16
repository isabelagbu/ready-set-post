import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccounts } from '../accounts/context'
import { PLATFORM_META, type Platform } from '../accounts/types'
import PlatformLogoImg from '../components/PlatformLogoImg'

const SOCIAL_PARTITION = 'persist:rsp-social'
const PLATFORM_ALLOWED_HOSTS: Record<Platform, string[]> = {
  tiktok: ['tiktok.com'],
  instagram: ['instagram.com'],
  threads: ['threads.com', 'threads.net'],
  youtube: ['youtube.com', 'youtu.be', 'google.com', 'googlevideo.com', 'gstatic.com'],
  linkedin: ['linkedin.com'],
  x: ['x.com', 'twitter.com']
}
const COMMON_AUTH_HOSTS = ['accounts.google.com', 'appleid.apple.com', 'login.live.com']
const AUTH_PATH_HINTS = ['/login', '/signin', '/accounts/login', '/oauth', '/oauth2', '/authorize', '/auth']
const PREVIEW_PLATFORM_ORDER: Platform[] = [
  'tiktok',
  'instagram',
  'youtube',
  'x',
  'threads',
  'linkedin'
]

function isAllowedHost(platform: Platform, hostname: string): boolean {
  const host = hostname.toLowerCase()
  return PLATFORM_ALLOWED_HOSTS[platform].some((base) => host === base || host.endsWith(`.${base}`))
}

function safeAccountUrl(platform: Platform, rawUrl: string): string {
  const fallback = PLATFORM_META[platform].defaultUrl
  try {
    const input = rawUrl.trim()
    if (!input) return fallback
    const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(input) ? input : `https://${input}`
    const parsed = new URL(withScheme)
    if (parsed.protocol !== 'https:') return fallback
    if (!isAllowedHost(platform, parsed.hostname)) return fallback
    return parsed.toString()
  } catch {
    return fallback
  }
}

function isAuthFlowUrl(platform: Platform, rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()
    const path = url.pathname.toLowerCase()
    const search = url.search.toLowerCase()
    if (COMMON_AUTH_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) return true
    if (AUTH_PATH_HINTS.some((hint) => path.includes(hint))) return true
    if (search.includes('oauth') || search.includes('authorize') || search.includes('login')) return true

    if (platform === 'youtube') return host.endsWith('google.com') && (path.includes('signin') || path.includes('servicelogin'))
    if (platform === 'instagram' || platform === 'threads') return host.endsWith('instagram.com') && path.includes('/accounts/login')
    if (platform === 'linkedin') return host.endsWith('linkedin.com') && path.includes('/login')
    if (platform === 'tiktok') return host.endsWith('tiktok.com') && path.includes('/login')
    if (platform === 'x') return (host.endsWith('x.com') || host.endsWith('twitter.com')) && path.includes('/i/flow/login')
    return false
  } catch {
    return false
  }
}

function allowsInAppAuth(platform: Platform): boolean {
  return platform !== 'youtube'
}

export default function AccountsView({ previewEnabled = true }: { previewEnabled?: boolean }): React.ReactElement {
  const { accounts } = useAccounts()
  const platformOrder = useMemo(
    () => new Map<Platform, number>(PREVIEW_PLATFORM_ORDER.map((p, idx) => [p, idx])),
    []
  )
  const safeAccounts = useMemo(
    () =>
      accounts
        .filter((a) => Boolean(PLATFORM_META[a.platform]))
        .sort((a, b) => {
          const pa = platformOrder.get(a.platform) ?? 999
          const pb = platformOrder.get(b.platform) ?? 999
          if (pa !== pb) return pa - pb
          return a.name.localeCompare(b.name)
        }),
    [accounts, platformOrder]
  )
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set())
  const [browserLoginRequiredIds, setBrowserLoginRequiredIds] = useState<Set<string>>(() => new Set())
  const webviewRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  // Keep cleanup functions per id so we can detach when a webview unmounts
  const cleanupRefs = useRef<Map<string, () => void>>(new Map())
  const refCallbackById = useRef<Map<string, (el: HTMLElement | null) => void>>(new Map())

  // Keep active pointing to a valid account
  const activeAccount =
    safeAccounts.find((a) => a.id === activeId) ?? safeAccounts[0] ?? null

  useEffect(() => {
    if (activeAccount && activeId !== activeAccount.id) setActiveId(activeAccount.id)
  }, [activeAccount, activeId])

  useEffect(() => {
    return () => {
      cleanupRefs.current.forEach((cleanup) => cleanup())
      cleanupRefs.current.clear()
      webviewRefs.current.clear()
      refCallbackById.current.clear()
    }
  }, [])

  useEffect(() => {
    const validIds = new Set(safeAccounts.map((a) => a.id))
    cleanupRefs.current.forEach((cleanup, id) => {
      if (!validIds.has(id)) {
        cleanup()
        cleanupRefs.current.delete(id)
      }
    })
    webviewRefs.current.forEach((_el, id) => {
      if (!validIds.has(id)) webviewRefs.current.delete(id)
    })
    refCallbackById.current.forEach((_cb, id) => {
      if (!validIds.has(id)) refCallbackById.current.delete(id)
    })
    setLoadingIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)))
      if (next.size === prev.size) {
        let unchanged = true
        for (const id of next) {
          if (!prev.has(id)) {
            unchanged = false
            break
          }
        }
        if (unchanged) return prev
      }
      return next
    })
    setBrowserLoginRequiredIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [safeAccounts])

  // Attach load listeners via ref callback — fires as soon as the DOM node exists
  const attachWebview = useCallback((id: string, el: HTMLElement | null) => {
    // Clean up previous listener for this id if any
    cleanupRefs.current.get(id)?.()
    cleanupRefs.current.delete(id)
    webviewRefs.current.set(id, el)

    if (!el) {
      return
    }

    const wv = el as Electron.WebviewTag
    function preferredProfileUrl(): string {
      const acc = safeAccounts.find((x) => x.id === id)
      if (!acc) return 'about:blank'
      return safeAccountUrl(acc.platform, acc.url || PLATFORM_META[acc.platform].defaultUrl)
    }

    function onStart(): void { setLoadingIds((prev) => new Set(prev).add(id)) }
    function onStop(): void {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }
    function onWillNavigate(e: Event): void {
      const acc = safeAccounts.find((x) => x.id === id)
      if (!acc) return
      const event = e as Event & { url?: string; preventDefault?: () => void }
      const requested = typeof event.url === 'string' ? event.url : ''
      if (!allowsInAppAuth(acc.platform) && requested && isAuthFlowUrl(acc.platform, requested)) {
        event.preventDefault?.()
        setBrowserLoginRequiredIds((prev) => new Set(prev).add(id))
        void wv.loadURL(preferredProfileUrl())
        return
      }
      const safe = safeAccountUrl(acc.platform, requested)
      if (requested && requested !== safe) {
        event.preventDefault?.()
        void wv.loadURL(safe)
      } else {
        setBrowserLoginRequiredIds((prev) => {
          if (!prev.has(id)) return prev
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    }
    function onDidNavigateLike(e: Event): void {
      const acc = safeAccounts.find((x) => x.id === id)
      if (!acc) return
      const event = e as Event & { url?: string }
      const url = typeof event.url === 'string' ? event.url : ''
      if (!url) return
      if (!allowsInAppAuth(acc.platform) && isAuthFlowUrl(acc.platform, url)) {
        setBrowserLoginRequiredIds((prev) => new Set(prev).add(id))
        void wv.loadURL(preferredProfileUrl())
      }
    }
    function onNewWindow(e: Event): void {
      const event = e as Event & { url?: string; preventDefault?: () => void }
      const url = typeof event.url === 'string' ? event.url : ''
      if (!url) return
      const platform = safeAccounts.find((x) => x.id === id)?.platform
      if (platform && !allowsInAppAuth(platform)) {
        event.preventDefault?.()
        setBrowserLoginRequiredIds((prev) => new Set(prev).add(id))
        void wv.loadURL(preferredProfileUrl())
      }
    }

    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    wv.addEventListener('did-navigate', onDidNavigateLike as EventListener)
    wv.addEventListener('did-navigate-in-page', onDidNavigateLike as EventListener)
    wv.addEventListener('did-redirect-navigation', onDidNavigateLike as EventListener)
    wv.addEventListener('will-navigate', onWillNavigate as EventListener)
    wv.addEventListener('new-window', onNewWindow as EventListener)
    cleanupRefs.current.set(id, () => {
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
      wv.removeEventListener('did-navigate', onDidNavigateLike as EventListener)
      wv.removeEventListener('did-navigate-in-page', onDidNavigateLike as EventListener)
      wv.removeEventListener('did-redirect-navigation', onDidNavigateLike as EventListener)
      wv.removeEventListener('will-navigate', onWillNavigate as EventListener)
      wv.removeEventListener('new-window', onNewWindow as EventListener)
    })
  }, [safeAccounts])

  const getWebviewRef = useCallback((id: string) => {
    const existing = refCallbackById.current.get(id)
    if (existing) return existing
    const callback = (el: HTMLElement | null) => attachWebview(id, el)
    refCallbackById.current.set(id, callback)
    return callback
  }, [attachWebview])

  function wv(id: string): Electron.WebviewTag | null {
    return (webviewRefs.current.get(id) as Electron.WebviewTag | null) ?? null
  }

  const currentId = activeAccount?.id ?? null
  const isLoading = currentId ? loadingIds.has(currentId) : false
  const browserLoginRequired = currentId ? browserLoginRequiredIds.has(currentId) : false

  function openActiveInBrowser(): void {
    if (!activeAccount) return
    const url = safeAccountUrl(activeAccount.platform, activeAccount.url || '')
    if (!url) return
    void window.api.openExternalUrl(url)
  }

  function continueLoginInBrowser(): void {
    if (!currentId || !activeAccount) return
    const currentUrl = wv(currentId)?.getURL() ?? ''
    const url =
      currentUrl.trim() ||
      safeAccountUrl(activeAccount.platform, activeAccount.url || PLATFORM_META[activeAccount.platform].defaultUrl)
    if (!url) return
    void window.api.openExternalUrl(url)
  }

  useEffect(() => {
    return window.api.onAccountSessionsCleared(() => {
      if (!currentId) return
      wv(currentId)?.reloadIgnoringCache()
    })
  }, [currentId])

  if (safeAccounts.length === 0) {
    return (
      <div className="accounts-view accounts-view--empty">
        <div className="accounts-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden width="48" height="48">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          </svg>
          <h2>No accounts yet</h2>
          <p className="muted">
            Go to <strong>Settings → Accounts</strong> to add your TikTok, Instagram, Threads, or YouTube accounts.
            Each account will appear as its own browser tab here.
          </p>
        </div>
      </div>
    )
  }

  if (!previewEnabled) {
    return (
      <div className="accounts-view accounts-view--empty">
        <div className="accounts-empty-state accounts-empty-state--preview-off">
          <h2>In-app account previews are off</h2>
          <p className="muted">
            Turn previews on in Settings if you want embedded account tabs. You can still open each account in your browser.
          </p>
          <ul className="accounts-fallback-list">
            {safeAccounts.map((acc) => (
              <li key={acc.id} className="accounts-fallback-item card">
                <div className="accounts-fallback-main">
                  <PlatformLogoImg platform={acc.platform} size={16} />
                  <strong className="accounts-fallback-name">{acc.name}</strong>
                </div>
                <span className="muted small accounts-fallback-url">
                  {acc.url || PLATFORM_META[acc.platform].defaultUrl}
                </span>
                <button
                  type="button"
                  className="ghost accounts-fallback-open"
                  onClick={() => void window.api.openExternalUrl(acc.url || PLATFORM_META[acc.platform].defaultUrl)}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="accounts-view">
      {/* ── Tab bar ── */}
      <div className="accounts-tabs">
        <div className="accounts-tab-strip" role="tablist" aria-label="Account previews">
          {safeAccounts.map((acc) => {
            const meta = PLATFORM_META[acc.platform]
            return (
              <button
                key={acc.id}
                type="button"
                className={`accounts-tab${currentId === acc.id ? ' accounts-tab--active' : ''}`}
                onClick={() => setActiveId(acc.id)}
                title={`${meta.label}: ${acc.name}`}
              >
                <PlatformLogoImg platform={acc.platform} size={16} />
                <span className="accounts-tab-name">{acc.name}</span>
              </button>
            )
          })}
        </div>

        {/* Nav controls on the right */}
        <div className="accounts-nav">
          <button
            type="button"
            className="accounts-nav-btn"
            title="Open in browser"
            onClick={openActiveInBrowser}
          >
            ↗
          </button>
          <button
            type="button"
            className="accounts-nav-btn"
            title="Back"
            onClick={() => currentId && wv(currentId)?.goBack()}
          >
            ←
          </button>
          <button
            type="button"
            className="accounts-nav-btn"
            title="Forward"
            onClick={() => currentId && wv(currentId)?.goForward()}
          >
            →
          </button>
          <button
            type="button"
            className="accounts-nav-btn"
            title="Refresh"
            onClick={() => currentId && wv(currentId)?.reload()}
          >
            ↺
          </button>
        </div>
      </div>

      {/* ── Loading bar ── */}
      <div className={`accounts-loading-bar${isLoading ? ' accounts-loading-bar--active' : ''}`} aria-hidden />

      {/* ── Loading overlay — only shown over the active webview ── */}
      {isLoading && (
        <div className="accounts-loading-overlay" aria-live="polite" aria-label="Loading">
          <div className="accounts-loading-dots">
            <span /><span /><span />
          </div>
          <p className="accounts-loading-text">Loading…</p>
        </div>
      )}

      {browserLoginRequired && (
        <div className="card" style={{ margin: '10px 0', padding: '12px 14px' }}>
          <p className="muted small" style={{ margin: 0 }}>
            Sign-in is disabled in embedded account tabs for this platform. This tab stays on the profile page.
          </p>
        </div>
      )}

      {/* ── WebViews — one per account ── */}
      <div className="accounts-webview-wrap">
        {safeAccounts.map((acc) => (
          <webview
            key={acc.id}
            ref={getWebviewRef(acc.id)}
            src={safeAccountUrl(acc.platform, acc.url || '')}
            partition={SOCIAL_PARTITION}
            webpreferences="contextIsolation=yes,nodeIntegration=no,sandbox=yes,javascript=yes"
            useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            className={`accounts-webview${currentId === acc.id ? ' accounts-webview--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
