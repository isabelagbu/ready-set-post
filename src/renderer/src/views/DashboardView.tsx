import PostPills from '../components/PostPills'
import type { NavId } from '../nav'
import type { Post } from '../posts/types'

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function truncate(s: string, n: number): string {
  const t = s.trim().replace(/\s+/g, ' ')
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`
}

export default function DashboardView({
  posts,
  onNavigate
}: {
  posts: Post[]
  onNavigate: (id: NavId) => void
}): React.ReactElement {
  const now = Date.now()

  const drafts = posts.filter((p) => p.status === 'draft')
  const scheduled = posts.filter((p) => p.status === 'scheduled')
  const posted = posts.filter((p) => p.status === 'posted')
  const overdue = scheduled.filter((p) => p.scheduledAt && new Date(p.scheduledAt).getTime() < now)

  const upcoming = [...scheduled]
    .filter((p) => p.scheduledAt && new Date(p.scheduledAt).getTime() >= now)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 5)

  const recentDrafts = [...drafts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  return (
    <div className="page dashboard">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="sub">Overview of your content at a glance.</p>
      </header>

      {/* ── Stat row ── */}
      <div className="stat-grid">
        <button type="button" className="stat-card" onClick={() => onNavigate('content')}>
          <span className="stat-value">{drafts.length}</span>
          <span className="stat-label">Drafts</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onNavigate('calendar')}>
          <span className="stat-value">{scheduled.length}</span>
          <span className="stat-label">Scheduled</span>
        </button>
        <button type="button" className="stat-card" onClick={() => onNavigate('content')}>
          <span className="stat-value">{posted.length}</span>
          <span className="stat-label">Posted</span>
        </button>
        <button
          type="button"
          className={`stat-card${overdue.length > 0 ? ' stat-card--overdue' : ''}`}
          onClick={() => onNavigate('calendar')}
        >
          <span className="stat-value">{overdue.length}</span>
          <span className="stat-label">Overdue</span>
        </button>
        <div className="stat-card static">
          <span className="stat-value">{posts.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      {/* ── Overdue warning ── */}
      {overdue.length > 0 && (
        <section className="dashboard-section card dash-overdue-card" aria-label="Overdue posts">
          <div className="section-head">
            <h2 className="dash-overdue-heading">
              ⚠ {overdue.length} overdue {overdue.length === 1 ? 'post' : 'posts'}
            </h2>
            <button type="button" className="ghost linkish" onClick={() => onNavigate('calendar')}>
              Open calendar
            </button>
          </div>
          <ul className="dash-overdue-list">
            {overdue
              .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
              .map((p) => (
                <li key={p.id} className="dash-overdue-item">
                  <span className="dash-overdue-title">{p.title}</span>
                  <span className="dash-overdue-time muted small">{fmt(p.scheduledAt!)}</span>
                  {(p.platforms.length > 0 || p.accountIds.length > 0) && (
                    <div className="dash-overdue-pills">
                      <PostPills post={p} />
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* ── Next up ── */}
      <section className="dashboard-section card">
        <div className="section-head">
          <h2>Next up</h2>
          <button type="button" className="ghost linkish" onClick={() => onNavigate('calendar')}>
            Open calendar
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="muted small">No upcoming scheduled posts.</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((p) => (
              <li key={p.id} className="upcoming-item">
                <div className="upcoming-row">
                  <span className="upcoming-time">{fmt(p.scheduledAt!)}</span>
                  {(p.platforms.length > 0 || p.accountIds.length > 0) && (
                    <div className="upcoming-pills">
                      <PostPills post={p} />
                    </div>
                  )}
                </div>
                <span className="upcoming-title">{p.title}</span>
                {p.body.trim() && (
                  <span className="upcoming-preview">{truncate(p.body, 80)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Recent drafts ── */}
      <section className="dashboard-section card">
        <div className="section-head">
          <h2>Recent drafts</h2>
          <button type="button" className="ghost linkish" onClick={() => onNavigate('content')}>
            View all
          </button>
        </div>
        {recentDrafts.length === 0 ? (
          <p className="muted small">No drafts yet.</p>
        ) : (
          <ul className="draft-list">
            {recentDrafts.map((p) => (
              <li key={p.id} className="draft-item">
                <span className="draft-title">{p.title}</span>
                {(p.platforms.length > 0 || p.accountIds.length > 0) && (
                  <div className="draft-pills">
                    <PostPills post={p} />
                  </div>
                )}
                {p.body.trim() && (
                  <span className="draft-preview muted small">{truncate(p.body, 80)}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
