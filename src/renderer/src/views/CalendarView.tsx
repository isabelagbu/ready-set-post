import { useEffect, useMemo, useState } from 'react'
import {
  PLATFORM_OPTIONS,
  type Post,
  type Status,
  newPostId
} from '../posts/types'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function startOfToday(): Date {
  const t = new Date()
  return new Date(t.getFullYear(), t.getMonth(), t.getDate())
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

type Cell = {
  date: Date
  dateKey: string
  inMonth: boolean
  dayNum: number
}

function buildMonthGrid(viewMonth: Date): Cell[] {
  const y = viewMonth.getFullYear()
  const m = viewMonth.getMonth()
  const startDow = new Date(y, m, 1).getDay()
  const daysThisMonth = new Date(y, m + 1, 0).getDate()
  const cells: Cell[] = []
  const prevLast = new Date(y, m, 0).getDate()

  for (let i = 0; i < startDow; i++) {
    const day = prevLast - startDow + i + 1
    const d = new Date(y, m - 1, day)
    cells.push({ date: d, dateKey: dateKey(d), inMonth: false, dayNum: day })
  }
  for (let day = 1; day <= daysThisMonth; day++) {
    const d = new Date(y, m, day)
    cells.push({ date: d, dateKey: dateKey(d), inMonth: true, dayNum: day })
  }
  let next = 1
  while (cells.length % 7 !== 0) {
    const d = new Date(y, m + 1, next++)
    cells.push({ date: d, dateKey: dateKey(d), inMonth: false, dayNum: d.getDate() })
  }
  while (cells.length < 42) {
    const d = new Date(y, m + 1, next++)
    cells.push({ date: d, dateKey: dateKey(d), inMonth: false, dayNum: d.getDate() })
  }
  return cells
}

function groupPostsByLocalDate(posts: Post[]): Map<string, Post[]> {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    if (!p.scheduledAt) continue
    const k = dateKey(new Date(p.scheduledAt))
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(p)
  }
  for (const list of map.values()) {
    list.sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return ta - tb
    })
  }
  return map
}

function combineLocalDateAndTime(dateKeyStr: string, timeHHMM: string): string | null {
  const [ys, ms, ds] = dateKeyStr.split('-')
  if (!ys || !ms || !ds) return null
  const y = Number(ys)
  const mo = Number(ms)
  const d = Number(ds)
  const [hs, mins] = timeHHMM.split(':')
  const h = Number(hs ?? 0)
  const mi = Number(mins ?? 0)
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return null
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0)
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString()
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export default function CalendarView({
  posts,
  setPosts
}: {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}): React.ReactElement {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()))
  const [selectedKey, setSelectedKey] = useState<string | null>(() => dateKey(startOfToday()))

  const grid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const byDay = useMemo(() => groupPostsByLocalDate(posts), [posts])

  const monthLabel = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const todayKey = dateKey(startOfToday())

  function prevMonth(): void {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
  }

  function nextMonth(): void {
    setViewMonth((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
  }

  function goToday(): void {
    const t = startOfToday()
    setViewMonth(startOfMonth(t))
    setSelectedKey(dateKey(t))
  }

  return (
    <div className="page calendar-page">
      <header className="page-header">
        <h1>Calendar</h1>
        <p className="sub">Pick a day to see what is scheduled or add a new time slot.</p>
      </header>

      <div className="calendar-layout">
        <div className="calendar-main card">
          <div className="calendar-toolbar">
            <button type="button" className="ghost" onClick={prevMonth} aria-label="Previous month">
              ‹
            </button>
            <h2 className="calendar-month-title">{monthLabel}</h2>
            <button type="button" className="ghost" onClick={nextMonth} aria-label="Next month">
              ›
            </button>
            <button type="button" className="primary calendar-today" onClick={goToday}>
              Today
            </button>
          </div>
          <div className="calendar-weekdays" aria-hidden>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
              <div key={w} className="calendar-weekday">
                {w}
              </div>
            ))}
          </div>
          <div className="calendar-grid" role="grid" aria-label="Month">
            {grid.map((cell) => {
              const count = byDay.get(cell.dateKey)?.length ?? 0
              const selected = selectedKey === cell.dateKey
              const today = cell.dateKey === todayKey
              return (
                <button
                  key={`${cell.dateKey}-${cell.inMonth}-${cell.dayNum}`}
                  type="button"
                  role="gridcell"
                  className={`calendar-day${cell.inMonth ? '' : ' other-month'}${selected ? ' selected' : ''}${today ? ' today' : ''}`}
                  onClick={() => setSelectedKey(cell.dateKey)}
                >
                  <span className="calendar-day-num">{cell.dayNum}</span>
                  {count > 0 && (
                    <span className="calendar-day-badge" aria-label={`${count} scheduled`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <aside className="calendar-panel card">
          {selectedKey ? (
            <DayPanel
              dateKey={selectedKey}
              posts={byDay.get(selectedKey) ?? []}
              setPosts={setPosts}
            />
          ) : (
            <p className="muted small">Select a day on the calendar.</p>
          )}
        </aside>
      </div>
    </div>
  )
}

function DayPanel({
  dateKey,
  posts,
  setPosts
}: {
  dateKey: string
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}): React.ReactElement {
  const [body, setBody] = useState('')
  const [time, setTime] = useState('09:00')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [asDraft, setAsDraft] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setBody('')
    setTime('09:00')
    setPlatforms([])
    setAsDraft(false)
    setEditingId(null)
  }, [dateKey])

  const label = useMemo(() => {
    const [y, m, d] = dateKey.split('-').map(Number)
    if (!y || !m || !d) return dateKey
    return new Date(y, m - 1, d).toLocaleDateString('default', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }, [dateKey])

  function togglePlatform(p: string): void {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function addScheduled(): void {
    const text = body.trim()
    if (!text) return
    if (asDraft) {
      const post: Post = {
        id: newPostId(),
        body: text,
        platforms: [...platforms],
        status: 'draft',
        scheduledAt: null,
        createdAt: new Date().toISOString()
      }
      setPosts((prev) => [post, ...prev])
      setBody('')
      setPlatforms([])
      setTime('09:00')
      setAsDraft(false)
      return
    }
    const iso = combineLocalDateAndTime(dateKey, time)
    if (!iso) return
    const post: Post = {
      id: newPostId(),
      body: text,
      platforms: [...platforms],
      status: 'scheduled',
      scheduledAt: iso,
      createdAt: new Date().toISOString()
    }
    setPosts((prev) => [post, ...prev])
    setBody('')
    setPlatforms([])
    setTime('09:00')
  }

  function updatePost(id: string, patch: Partial<Post>): void {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removePost(id: string): void {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setEditingId((e) => (e === id ? null : e))
  }

  return (
    <div className="day-panel">
      <h2 className="day-panel-title">{label}</h2>

      <section className="day-panel-section">
        <h3 className="day-panel-heading">Scheduled</h3>
        {posts.length === 0 ? (
          <p className="muted small">Nothing on this day yet.</p>
        ) : (
          <ul className="day-post-list">
            {posts.map((p) => (
              <li key={p.id} className="day-post">
                {editingId === p.id ? (
                  <DayPostEditor
                    post={p}
                    onSave={(patch) => {
                      updatePost(p.id, patch)
                      setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="day-post-meta">
                      <span className="day-post-time">
                        {p.scheduledAt
                          ? new Date(p.scheduledAt).toLocaleTimeString('default', {
                              hour: 'numeric',
                              minute: '2-digit'
                            })
                          : '—'}
                      </span>
                      <span className={`day-post-status status-${p.status}`}>{p.status}</span>
                    </div>
                    <p className="day-post-body">{p.body}</p>
                    {p.platforms.length > 0 && (
                      <div className="pills">
                        {p.platforms.map((x) => (
                          <span key={x} className="pill">
                            {x}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="row actions">
                      <button type="button" className="ghost" onClick={() => setEditingId(p.id)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ghost"
                        onClick={() =>
                          updatePost(p.id, {
                            status: 'draft',
                            scheduledAt: null
                          })
                        }
                      >
                        Unschedule
                      </button>
                      <button type="button" className="danger ghost" onClick={() => removePost(p.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="day-panel-section">
        <h3 className="day-panel-heading">Schedule new</h3>
        <textarea
          placeholder="Post text…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <label className="day-time-row">
          <span className="label">Time</span>
          <input
            type="time"
            value={time}
            disabled={asDraft}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
        <div className="row platforms">
          <label className="chip chip-draft">
            <input
              type="checkbox"
              checked={asDraft}
              onChange={(e) => setAsDraft(e.target.checked)}
            />
            Draft
          </label>
          {PLATFORM_OPTIONS.map((p) => (
            <label key={p} className="chip">
              <input
                type="checkbox"
                checked={platforms.includes(p)}
                onChange={() => togglePlatform(p)}
              />
              {p}
            </label>
          ))}
        </div>
        <button type="button" className="primary" onClick={addScheduled}>
          {asDraft ? 'Add draft' : 'Add to this day'}
        </button>
      </section>
    </div>
  )
}

function DayPostEditor({
  post,
  onSave,
  onCancel
}: {
  post: Post
  onSave: (patch: Partial<Post>) => void
  onCancel: () => void
}): React.ReactElement {
  const [body, setBody] = useState(post.body)
  const [platforms, setPlatforms] = useState<string[]>(post.platforms)
  const [dtLocal, setDtLocal] = useState(() =>
    post.scheduledAt ? toDatetimeLocalValue(post.scheduledAt) : ''
  )
  const [status, setStatus] = useState<Status>(post.status)
  const [isDraft, setIsDraft] = useState(post.status === 'draft' && !post.scheduledAt)

  function togglePlatform(p: string): void {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function save(): void {
    if (isDraft) {
      onSave({
        body: body.trim() || post.body,
        platforms,
        scheduledAt: null,
        status: 'draft'
      })
      return
    }
    const scheduledAt = dtLocal.trim() ? new Date(dtLocal).toISOString() : null
    let nextStatus = status
    if (scheduledAt && nextStatus === 'draft') nextStatus = 'scheduled'
    if (!scheduledAt && nextStatus === 'scheduled') nextStatus = 'draft'
    onSave({
      body: body.trim() || post.body,
      platforms,
      scheduledAt,
      status: nextStatus
    })
  }

  return (
    <div className="day-post-editor">
      <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="grow">
        <span className="label">Date & time</span>
        <input
          type="datetime-local"
          value={dtLocal}
          disabled={isDraft}
          onChange={(e) => setDtLocal(e.target.value)}
        />
      </label>
      <div className="row platforms">
        <label className="chip chip-draft">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => {
              const on = e.target.checked
              setIsDraft(on)
              if (on) {
                setDtLocal('')
                setStatus('draft')
              }
            }}
          />
          Draft
        </label>
        {PLATFORM_OPTIONS.map((p) => (
          <label key={p} className="chip">
            <input
              type="checkbox"
              checked={platforms.includes(p)}
              onChange={() => togglePlatform(p)}
            />
            {p}
          </label>
        ))}
      </div>
      <label>
        <span className="label">Status</span>
        <select
          value={status}
          disabled={isDraft}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="posted">posted</option>
        </select>
      </label>
      <div className="row actions">
        <button type="button" className="primary" onClick={save}>
          Save
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
