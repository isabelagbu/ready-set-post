import { useRef, useState } from 'react'
import type { AccountUrls } from '../App'

/* Allow the Electron <webview> JSX tag in TypeScript */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        webview: React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & {
            src?: string
            allowpopups?: string
            partition?: string
            useragent?: string
            disablewebsecurity?: string
          },
          HTMLElement
        >
      }
    }
  }
}

const PLATFORM_META = [
  { id: 'tiktok' as const, label: 'TikTok', color: '#010101' },
  { id: 'instagram' as const, label: 'Instagram', color: '#c13584' },
  { id: 'youtube' as const, label: 'YouTube', color: '#ff0000' }
]

type PlatformId = 'tiktok' | 'instagram' | 'youtube'

export default function AccountsView({ urls }: { urls: AccountUrls }): React.ReactElement {
  const [active, setActive] = useState<PlatformId>('tiktok')
  const webviewRefs = useRef<Partial<Record<PlatformId, HTMLElement | null>>>({})

  function wv(id: PlatformId): Electron.WebviewTag | null {
    return (webviewRefs.current[id] as Electron.WebviewTag | null) ?? null
  }

  return (
    <div className="accounts-view">
      {/* ── Tab bar ── */}
      <div className="accounts-tabs">
        {PLATFORM_META.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`accounts-tab${active === p.id ? ' accounts-tab--active' : ''}`}
            style={{ '--platform-color': p.color } as React.CSSProperties}
            onClick={() => setActive(p.id)}
          >
            <span className="accounts-tab-dot" aria-hidden />
            {p.label}
          </button>
        ))}

        {/* Nav controls on the right */}
        <div className="accounts-nav">
          <button
            type="button"
            className="accounts-nav-btn"
            title="Back"
            onClick={() => wv(active)?.goBack()}
          >
            ←
          </button>
          <button
            type="button"
            className="accounts-nav-btn"
            title="Forward"
            onClick={() => wv(active)?.goForward()}
          >
            →
          </button>
          <button
            type="button"
            className="accounts-nav-btn"
            title="Refresh"
            onClick={() => wv(active)?.reload()}
          >
            ↺
          </button>
        </div>
      </div>

      {/* ── WebViews ── */}
      <div className="accounts-webview-wrap">
        {PLATFORM_META.map((p) => (
          <webview
            key={p.id}
            ref={(el) => {
              webviewRefs.current[p.id] = el
            }}
            src={urls[p.id]}
            allowpopups="true"
            className={`accounts-webview${active === p.id ? ' accounts-webview--active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
