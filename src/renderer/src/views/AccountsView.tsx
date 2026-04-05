import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccounts } from '../accounts/context'
import { PLATFORM_META } from '../accounts/types'

export default function AccountsView(): React.ReactElement {
  const { accounts } = useAccounts()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(() => new Set())
  const webviewRefs = useRef<Map<string, HTMLElement | null>>(new Map())
  // Keep cleanup functions per id so we can detach when a webview unmounts
  const cleanupRefs = useRef<Map<string, () => void>>(new Map())

  // Keep active pointing to a valid account
  const activeAccount =
    accounts.find((a) => a.id === activeId) ?? accounts[0] ?? null

  useEffect(() => {
    if (activeAccount) setActiveId(activeAccount.id)
  }, [activeAccount])

  // Attach load listeners via ref callback — fires as soon as the DOM node exists
  const attachWebview = useCallback((id: string, el: HTMLElement | null) => {
    // Clean up previous listener for this id if any
    cleanupRefs.current.get(id)?.()
    cleanupRefs.current.delete(id)
    webviewRefs.current.set(id, el)

    if (!el) {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      return
    }

    const wv = el as Electron.WebviewTag
    setLoadingIds((prev) => new Set(prev).add(id))

    function onStart(): void { setLoadingIds((prev) => new Set(prev).add(id)) }
    function onStop(): void {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    }

    wv.addEventListener('did-start-loading', onStart)
    wv.addEventListener('did-stop-loading', onStop)
    cleanupRefs.current.set(id, () => {
      wv.removeEventListener('did-start-loading', onStart)
      wv.removeEventListener('did-stop-loading', onStop)
    })
  }, [])

  function wv(id: string): Electron.WebviewTag | null {
    return (webviewRefs.current.get(id) as Electron.WebviewTag | null) ?? null
  }

  const currentId = activeAccount?.id ?? null
  const isLoading = currentId ? loadingIds.has(currentId) : false

  if (accounts.length === 0) {
    return (
      <div className="accounts-view accounts-view--empty">
        <div className="accounts-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden width="48" height="48">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
          </svg>
          <h2>No accounts yet</h2>
          <p className="muted">
            Go to <strong>Settings → Accounts</strong> to add your TikTok, Instagram, or YouTube accounts.
            Each account will appear as its own browser tab here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="accounts-view">
      {/* ── Tab bar ── */}
      <div className="accounts-tabs">
        {accounts.map((acc) => {
          const meta = PLATFORM_META[acc.platform]
          return (
            <button
              key={acc.id}
              type="button"
              className={`accounts-tab${currentId === acc.id ? ' accounts-tab--active' : ''}`}
              style={{ '--platform-color': meta.color } as React.CSSProperties}
              onClick={() => setActiveId(acc.id)}
              title={`${meta.label}: ${acc.name}`}
            >
              <span className="accounts-tab-dot" aria-hidden />
              <span className="accounts-tab-name">{acc.name}</span>
            </button>
          )
        })}

        {/* Nav controls on the right */}
        <div className="accounts-nav">
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

      {/* ── WebViews — one per account ── */}
      <div className="accounts-webview-wrap">
        {accounts.map((acc) => (
          <webview
            key={acc.id}
            ref={(el) => attachWebview(acc.id, el)}
            src={acc.url || PLATFORM_META[acc.platform].defaultUrl}
            allowpopups
            useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            className={`accounts-webview${currentId === acc.id ? ' accounts-webview--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
