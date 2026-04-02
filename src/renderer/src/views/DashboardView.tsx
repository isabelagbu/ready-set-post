import type { NavId } from '../nav'
import type { Post } from '../posts/types'

export default function DashboardView({
  posts,
  onNavigate
}: {
  posts: Post[]
  onNavigate: (id: NavId) => void
}): React.ReactElement {
  const draft = posts.filter((p) => p.status === 'draft').length
  const scheduled = posts.filter((p) => p.status === 'scheduled').length
  const posted = posts.filter((p) => p.status === 'posted').length

  const upcoming = [...posts]
    .filter((p) => p.status === 'scheduled' && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  return (
    <div className="page dashboard">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="sub">Overview of your scheduled posts and drafts.</p>
      </header>

      <div className="stat-grid">
        <button type="button" className="stat-card" onClick={() => onNavigate('calendar')}>
          <span className="stat-value">{draft}</span>
          <span className="stat-label">Drafts</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onNavigate('calendar')}>
          <span className="stat-value">{scheduled}</span>
          <span className="stat-label">Scheduled</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onNavigate('calendar')}>
          <span className="stat-value">{posted}</span>
          <span className="stat-label">Posted</span>
        </button>
        <div className="stat-card static">
          <span className="stat-value">{posts.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      <section className="dashboard-section card">
        <div className="section-head">
          <h2>Next up</h2>
          <button type="button" className="ghost linkish" onClick={() => onNavigate('calendar')}>
            Open calendar
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted small">No scheduled posts. Add one from the Calendar.</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((p) => (
              <li key={p.id}>
                <span className="upcoming-time">
                  {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : '—'}
                </span>
                <span className="upcoming-preview">{truncate(p.body, 72)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dashboard-section card">
        <h2>Quick actions</h2>
        <div className="quick-actions">
          <button type="button" className="primary" onClick={() => onNavigate('calendar')}>
            Calendar
          </button>
          <button type="button" onClick={() => onNavigate('content')}>
            Content
          </button>
          <button type="button" onClick={() => onNavigate('notes')}>
            Notepad
          </button>
          <button type="button" onClick={() => onNavigate('accounts')}>
            Accounts
          </button>
          <button type="button" onClick={() => onNavigate('settings')}>
            Settings
          </button>
        </div>
      </section>
    </div>
  )
}

function truncate(s: string, n: number): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`
}
