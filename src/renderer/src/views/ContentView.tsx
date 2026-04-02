import { useEffect, useMemo, useState } from 'react'
import PostEditorForm from '../components/PostEditorForm'
import PostNotesFullView from '../components/PostNotesFullView'
import PostCreateModal from '../components/PostCreateModal'
import {
  livePostUrl,
  PLATFORM_OPTIONS,
  EMPTY_CONTENT_NOTES,
  type Post,
  type PostContentNotes,
  type Status
} from '../posts/types'
import { newPostId } from '../posts/types'

const FILTER_NONE = '__none__'

const CONTENT_SECTION_STORAGE_KEY = 'smm-content-section'

type ContentSection = 'drafts' | 'content'

function readStoredSection(): ContentSection {
  try {
    const t = localStorage.getItem(CONTENT_SECTION_STORAGE_KEY)
    if (t === 'drafts' || t === 'content') return t
  } catch {
    /* ignore */
  }
  return 'content'
}

function persistSection(section: ContentSection): void {
  try {
    localStorage.setItem(CONTENT_SECTION_STORAGE_KEY, section)
  } catch {
    /* ignore */
  }
}

function matchesSection(post: Post, section: ContentSection): boolean {
  if (section === 'drafts') return post.status === 'draft'
  return post.status === 'scheduled' || post.status === 'posted'
}

function matchesFilters(post: Post, selected: Set<string>): boolean {
  if (selected.size === 0) return true
  const wantsNone = selected.has(FILTER_NONE)
  const platformKeys = [...selected].filter((k) => k !== FILTER_NONE)
  const matchesNone = wantsNone && post.platforms.length === 0
  const matchesPlatform =
    platformKeys.length > 0 && post.platforms.some((p) => selected.has(p))
  if (wantsNone && platformKeys.length === 0) return matchesNone
  if (!wantsNone && platformKeys.length > 0) return matchesPlatform
  return matchesNone || matchesPlatform
}

function matchesStatusFilter(post: Post, selected: Set<Status>): boolean {
  if (selected.size === 0) return true
  return selected.has(post.status)
}

function matchesSearch(post: Post, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (post.title.toLowerCase().includes(q)) return true
  if (post.body.toLowerCase().includes(q)) return true
  if (post.platforms.some((p) => p.toLowerCase().includes(q))) return true
  const n = post.contentNotes
  return (
    n.script.toLowerCase().includes(q) ||
    n.hashtags.toLowerCase().includes(q) ||
    n.caption.toLowerCase().includes(q) ||
    n.other.toLowerCase().includes(q)
  )
}

type SortOrder = 'newest' | 'oldest'

/** Status filters exclude draft — use the Draft tab for drafts. */
const STATUS_FILTER_OPTIONS: { value: Exclude<Status, 'draft'>; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'posted', label: 'Posted' }
]

export default function ContentView({
  posts,
  setPosts
}: {
  posts: Post[]
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>
}): React.ReactElement {
  const [section, setSection] = useState<ContentSection>(() => readStoredSection())
  const [filterSelected, setFilterSelected] = useState<Set<string>>(() => new Set())
  const [statusFilterSelected, setStatusFilterSelected] = useState<Set<Status>>(() => new Set())
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [notesModalPostId, setNotesModalPostId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const postsInSection = useMemo(
    () => posts.filter((p) => matchesSection(p, section)),
    [posts, section]
  )

  const filtered = useMemo(() => {
    const q = search.trim()
    const list = posts.filter(
      (p) =>
        matchesSection(p, section) &&
        matchesFilters(p, filterSelected) &&
        (section === 'drafts' ? true : matchesStatusFilter(p, statusFilterSelected)) &&
        matchesSearch(p, q)
    )
    const mul = sortOrder === 'newest' ? -1 : 1
    return [...list].sort(
      (a, b) =>
        mul * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    )
  }, [posts, section, filterSelected, statusFilterSelected, search, sortOrder])

  useEffect(() => {
    persistSection(section)
  }, [section])

  useEffect(() => {
    function postInCurrentSection(id: string): boolean {
      const p = posts.find((x) => x.id === id)
      return p !== undefined && matchesSection(p, section)
    }
    setEditingId((id) => (id !== null && !postInCurrentSection(id) ? null : id))
    setNotesModalPostId((id) => (id !== null && !postInCurrentSection(id) ? null : id))
  }, [section, posts])

  function toggleFilter(key: string): void {
    setFilterSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function clearFilters(): void {
    setFilterSelected(new Set())
    setStatusFilterSelected(new Set())
  }

  function toggleStatusFilter(status: Status): void {
    setStatusFilterSelected((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  function updatePost(id: string, patch: Partial<Post>): void {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removePost(id: string): void {
    setPosts((prev) => prev.filter((p) => p.id !== id))
    setEditingId((e) => (e === id ? null : e))
    setNotesModalPostId((n) => (n === id ? null : n))
  }

  function setNotesForPost(id: string, contentNotes: PostContentNotes): void {
    updatePost(id, { contentNotes })
  }

  const notesModalPost =
    notesModalPostId !== null ? posts.find((p) => p.id === notesModalPostId) : undefined

  const filterRows: { key: string; label: string }[] = [
    { key: FILTER_NONE, label: 'No platform' },
    ...PLATFORM_OPTIONS.map((p) => ({ key: p, label: p }))
  ]

  function openCreate(): void {
    setCreateOpen(true)
    setEditingId(null)
    setNotesModalPostId(null)
  }

  function createPost(payload: {
    title: string
    body: string
    platforms: string[]
    status: Extract<Status, 'draft' | 'scheduled'>
    scheduledAt: string | null
  }): void {
    const nowIso = new Date().toISOString()
    const post: Post = {
      id: newPostId(),
      title: payload.title,
      body: payload.body,
      platforms: payload.platforms,
      status: payload.status,
      scheduledAt: payload.status === 'draft' ? null : payload.scheduledAt,
      postedUrl: null,
      contentNotes: { ...EMPTY_CONTENT_NOTES },
      createdAt: nowIso
    }
    setPosts((prev) => [post, ...prev])
    setCreateOpen(false)
    setSection(payload.status === 'draft' ? 'drafts' : 'content')
  }

  return (
    <div className="page content-view-page">
      <header className="page-header">
        <h1>Content</h1>
        <p className="sub">
          Switch between Drafts and scheduled/posted Content. Filters, search, and sort apply within
          the tab you’re on. Click a post for full-screen script & notes.
        </p>
      </header>

      <div className="content-section-tabs" role="tablist" aria-label="Content area">
        <button
          type="button"
          role="tab"
          id="content-tab-content"
          aria-selected={section === 'content'}
          aria-controls="content-panel-main"
          className={`content-section-tab${section === 'content' ? ' active' : ''}`}
          onClick={() => setSection('content')}
        >
          Content
        </button>
        <button
          type="button"
          role="tab"
          id="content-tab-drafts"
          aria-selected={section === 'drafts'}
          aria-controls="content-panel-main"
          className={`content-section-tab${section === 'drafts' ? ' active' : ''}`}
          onClick={() => setSection('drafts')}
        >
          Draft
        </button>
      </div>

      <div className="content-filter-layout" id="content-panel-main" role="tabpanel">
        <aside className="content-filter-panel card" aria-label="Content filters">
          <h2 className="filter-panel-title">Platforms</h2>
          <button type="button" className="ghost filter-clear" onClick={clearFilters}>
            Clear platform & status
          </button>
          <ul className="filter-list">
            {filterRows.map((row) => (
              <li key={row.key}>
                <label className="filter-row">
                  <input
                    type="checkbox"
                    checked={filterSelected.has(row.key)}
                    onChange={() => toggleFilter(row.key)}
                  />
                  <span>{row.label}</span>
                </label>
              </li>
            ))}
          </ul>

          <h2 className="filter-panel-title filter-panel-title-spaced">Status</h2>
          <ul className="filter-list">
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
              <li key={value}>
                <label className="filter-row">
                  <input
                    type="checkbox"
                    checked={statusFilterSelected.has(value)}
                    onChange={() => toggleStatusFilter(value)}
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>

          <div className="filter-section-divider" />

          <h2 className="filter-panel-title">Order</h2>
          <p className="filter-panel-hint muted small">By date created</p>
          <div className="filter-fieldset" role="group" aria-label="Sort by created date">
            <ul className="filter-list filter-radio-list">
              <li>
                <label className="filter-row filter-radio-row">
                  <input
                    type="radio"
                    name="content-sort-order"
                    checked={sortOrder === 'newest'}
                    onChange={() => setSortOrder('newest')}
                  />
                  <span>Newest first</span>
                </label>
              </li>
              <li>
                <label className="filter-row filter-radio-row">
                  <input
                    type="radio"
                    name="content-sort-order"
                    checked={sortOrder === 'oldest'}
                    onChange={() => setSortOrder('oldest')}
                  />
                  <span>Oldest first</span>
                </label>
              </li>
            </ul>
          </div>
        </aside>

        <div className="content-list-panel">
          <div className="content-search-row">
            <label className="label" htmlFor="content-search">
              Search
            </label>
            <input
              id="content-search"
              className="content-search-input"
              type="search"
              placeholder="Search post text or platforms…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p className="muted small content-count">
            {filtered.length} of {postsInSection.length} in {section === 'drafts' ? 'Draft' : 'Content'}
            <span className="content-count-total">
              {' '}
              · {posts.length} total
            </span>
          </p>
          {!createOpen && (
            <button type="button" className="primary content-create-button" onClick={openCreate}>
              Create post
            </button>
          )}
          <ul className="list">
            {filtered.map((post) => (
              <li key={post.id} className="card post">
                <div className="post-top">
                  <div className="post-top-meta">
                    <span className={`badge status-${post.status}`}>{post.status}</span>
                    {post.scheduledAt && (
                      <span className="muted small">
                        {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {post.platforms.length > 0 && (
                    <div className="post-top-pills pills" aria-label="Platforms">
                      {post.platforms.map((p) => (
                        <span key={p} className="pill">
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {editingId === post.id ? (
                  <PostEditorForm
                    post={post}
                    onSave={(patch) => {
                      updatePost(post.id, patch)
                      setEditingId(null)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div
                      className="post-body-hit"
                      role="button"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      aria-label="Open full-screen script and production notes"
                      onClick={() => setNotesModalPostId(post.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setNotesModalPostId(post.id)
                        }
                      }}
                    >
                      <p className="post-title">{post.title}</p>
                      <p className="body">{post.body}</p>
                      <span className="muted small post-body-hit-hint">
                        Click for full-screen notes
                      </span>
                    </div>
                    {post.status === 'posted' && (
                      <p className="post-live-link-row">
                        <a
                          href={livePostUrl(post)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="post-live-link"
                          title={
                            !post.postedUrl?.trim()
                              ? 'Placeholder — set a real URL in Edit'
                              : undefined
                          }
                        >
                          View live post
                        </a>
                      </p>
                    )}
                    {post.platforms.length === 0 && (
                      <p className="muted small post-no-platforms">No platform tags</p>
                    )}
                    <div
                      className="row actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => {
                          setNotesModalPostId(null)
                          setEditingId(post.id)
                        }}
                      >
                        Edit
                      </button>
                      {post.status !== 'posted' && (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            updatePost(post.id, { status: 'posted', postedUrl: null })
                          }
                        >
                          Mark posted
                        </button>
                      )}
                      {post.status !== 'posted' && (
                        <button
                          type="button"
                          className="ghost"
                          onClick={() =>
                            updatePost(post.id, {
                              status: 'scheduled',
                              scheduledAt: new Date().toISOString()
                            })
                          }
                        >
                          Stamp time
                        </button>
                      )}
                      <button type="button" className="danger ghost" onClick={() => removePost(post.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <p className="empty muted">No posts match your search or filters.</p>
          )}
        </div>
      </div>

      {notesModalPost && (
        <PostNotesFullView
          post={notesModalPost}
          onClose={() => setNotesModalPostId(null)}
          onNotesChange={(next) => setNotesForPost(notesModalPost.id, next)}
        />
      )}

      {createOpen && (
        <PostCreateModal
          initialDraft={section === 'drafts'}
          onClose={() => setCreateOpen(false)}
          onCreate={createPost}
        />
      )}
    </div>
  )
}
