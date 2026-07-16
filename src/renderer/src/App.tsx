import { useEffect, useLayoutEffect, useState } from 'react'
import { playPop } from './utils/sound'
import { useReminders } from './hooks/useReminders'
import OnboardingModal, { hasSeenOnboarding } from './components/OnboardingModal'
import BrandLogo from './components/BrandLogo'
import type { NavId } from './nav'
import PublishSuccessDialog, {
  type PublishSuccessInfo
} from './components/PublishSuccessDialog'
import {
  EMPTY_CONTENT_NOTES,
  mergePostsLists,
  newPostId,
  parsePost,
  type CreatePostPayload,
  type Post
} from './posts/types'
import {
  applyThemeToDocument,
  persistAccent,
  persistTheme,
  readStoredAccent,
  readStoredTheme,
  type AccentPresetId,
  type AppTheme
} from './theme'
import { isInAppAccountPreviewEnabled } from './utils/accountsView'
import CalendarView from './views/CalendarView'
import ContentView from './views/ContentView'
import DashboardView from './views/DashboardView'
import NotesView from './views/NotesView'
import AccountsView from './views/AccountsView'
import SettingsView from './views/SettingsView'
import { WORKSPACE_SYNCED_EVENT } from './workspace/sync'

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

export default function App(): React.ReactElement {
  const [active, setActive] = useState<NavId>('dashboard')
  const [contentSection, setContentSection] = useState<'drafts' | 'content' | undefined>(undefined)
  const [contentStatusFilter, setContentStatusFilter] = useState<'draft' | 'scheduled' | 'posted' | undefined>(undefined)
  const [calendarInitialDateKey, setCalendarInitialDateKey] = useState<string | undefined>(undefined)
  const [contentOpenPostId, setContentOpenPostId] = useState<string | undefined>(undefined)
  const [contentOpenCreate, setContentOpenCreate] = useState(false)
  const [accountsPreviewOn, setAccountsPreviewOn] = useState(() => isInAppAccountPreviewEnabled())
  const [publishSuccess, setPublishSuccess] = useState<{
    post: Post
    info: PublishSuccessInfo
  } | null>(null)

  function navigateTo(
    id: NavId,
    section?: 'drafts' | 'content',
    statusFilter?: 'draft' | 'scheduled' | 'posted',
    calendarDateKey?: string
  ): void {
    setContentOpenPostId(undefined)
    setContentOpenCreate(false)
    setContentSection(id === 'content' ? section : undefined)
    setContentStatusFilter(id === 'content' ? statusFilter : undefined)
    if (id === 'calendar') {
      setCalendarInitialDateKey(calendarDateKey)
    } else {
      setCalendarInitialDateKey(undefined)
    }
    setActive(id)
  }

  function openContentPostDetail(postId: string): void {
    const p = posts.find((x) => x.id === postId)
    if (!p) return
    playPop()
    if (p.status === 'draft') {
      setContentSection('drafts')
      setContentStatusFilter(undefined)
    } else {
      setContentSection('content')
      setContentStatusFilter(p.status === 'scheduled' ? 'scheduled' : p.status === 'posted' ? 'posted' : undefined)
    }
    setContentOpenPostId(postId)
    setContentOpenCreate(false)
    setCalendarInitialDateKey(undefined)
    setActive('content')
  }

  function openContentCreate(): void {
    playPop()
    setContentOpenPostId(undefined)
    setContentOpenCreate(true)
    setContentSection('content')
    setContentStatusFilter(undefined)
    setCalendarInitialDateKey(undefined)
    setActive('content')
  }

  function revealContentPost(post: Post): void {
    playPop()
    setContentOpenCreate(false)
    setContentOpenPostId(post.id)
    if (post.status === 'draft') {
      setContentSection('drafts')
      setContentStatusFilter(undefined)
    } else {
      setContentSection('content')
      setContentStatusFilter(
        post.status === 'scheduled' ? 'scheduled' : post.status === 'posted' ? 'posted' : undefined
      )
    }
    setCalendarInitialDateKey(undefined)
    setActive('content')
  }

  function addPost(payload: CreatePostPayload): Post {
    const nowIso = new Date().toISOString()
    const post: Post = {
      id: newPostId(),
      title: payload.title,
      body: payload.body,
      platforms: payload.platforms,
      accountIds: payload.accountIds,
      status: payload.status,
      scheduledAt: payload.status === 'draft' ? null : payload.scheduledAt,
      postedUrl: payload.status === 'posted' ? payload.postedUrl : null,
      postedLinks: payload.status === 'posted' ? payload.postedLinks : {},
      youtubeVideoId: payload.youtubeVideoId ?? null,
      previewThumbnailDataUrl: payload.previewThumbnailDataUrl ?? null,
      mediaType: payload.mediaType,
      videoAsset: payload.videoAsset,
      platformPublishConfig: payload.platformPublishConfig,
      contentNotes: { ...EMPTY_CONTENT_NOTES, caption: payload.body.trim() },
      createdAt: nowIso,
      updatedAt: nowIso
    }
    setPosts((prev) => [post, ...prev])
    return post
  }

  function handlePostPublished(post: Post, info: PublishSuccessInfo): void {
    setPublishSuccess({ post, info })
    revealContentPost(post)
  }

  const [posts, setPosts] = useState<Post[]>([])
  const [loaded, setLoaded] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<AppTheme>(() => readStoredTheme())
  const [accent, setAccent] = useState<AccentPresetId>(() => readStoredAccent())
  const [showOnboarding, setShowOnboarding] = useState(() => !hasSeenOnboarding())

  useReminders(posts)

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
    // Drive-driven external updates — merge so a background pull cannot drop a just-created post.
    return window.api.onDrivePostsChange(({ posts: raw }) => {
      const parsed = (raw ?? []).map(parsePost).filter((p): p is Post => p !== null)
      setPosts((prev) => mergePostsLists(prev, parsed))
    })
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

  useEffect(() => {
    function onAccountsPreviewChange(e: Event): void {
      setAccountsPreviewOn((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener('smm-accounts-preview-change', onAccountsPreviewChange)
    return () => window.removeEventListener('smm-accounts-preview-change', onAccountsPreviewChange)
  }, [])

  useEffect(() => {
    function onWorkspaceSynced(): void {
      setTheme(readStoredTheme())
      setAccent(readStoredAccent())
      setShowOnboarding(!hasSeenOnboarding())
      setAccountsPreviewOn(isInAppAccountPreviewEnabled())
    }
    window.addEventListener(WORKSPACE_SYNCED_EVENT, onWorkspaceSynced)
    return () => window.removeEventListener(WORKSPACE_SYNCED_EVENT, onWorkspaceSynced)
  }, [])

  return (
    <div className="shell">
      <aside
        className={`sidebar${sidebarOpen ? '' : ' collapsed'}`}
        aria-label="Main navigation"
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <BrandLogo size={28} />
                  <span className="brand-name">Ready Set Post!</span>
          </div>
        </div>
        <nav id="app-sidebar-nav" className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item${active === item.id ? ' active' : ''}`}
              onClick={() => {
                playPop()
                if (item.id === 'calendar') setCalendarInitialDateKey(undefined)
                setActive(item.id)
              }}
              aria-label={item.label}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className={`main main--${active}`}>
        <div className={`app-view${active === 'dashboard' ? ' app-view--active' : ''}`} aria-hidden={active !== 'dashboard'}>
          <DashboardView
            posts={posts}
            onNavigate={(id, section, statusFilter, calendarDateKey) => navigateTo(id, section, statusFilter, calendarDateKey)}
            onCreatePost={openContentCreate}
            onOpenPostDetail={openContentPostDetail}
          />
        </div>
        <div className={`app-view${active === 'calendar' ? ' app-view--active' : ''}`} aria-hidden={active !== 'calendar'}>
          <CalendarView
            posts={posts}
            setPosts={setPosts}
            initialDateKey={calendarInitialDateKey}
            isActive={active === 'calendar'}
            onCreatePost={addPost}
            onPostCreated={revealContentPost}
            onPostPublished={handlePostPublished}
          />
        </div>
        <div className={`app-view${active === 'content' ? ' app-view--active' : ''}`} aria-hidden={active !== 'content'}>
          <ContentView
            posts={posts}
            setPosts={setPosts}
            initialSection={contentSection}
            initialStatusFilter={contentStatusFilter}
            initialOpenPostId={contentOpenPostId}
            onConsumeInitialOpen={() => setContentOpenPostId(undefined)}
            initialOpenCreate={contentOpenCreate}
            onConsumeInitialCreate={() => setContentOpenCreate(false)}
            onCreatePost={addPost}
            onPostCreated={revealContentPost}
            onPostPublished={handlePostPublished}
            isActive={active === 'content'}
          />
        </div>
        <div className={`app-view${active === 'notes' ? ' app-view--active' : ''}`} aria-hidden={active !== 'notes'}>
          <NotesView isActive={active === 'notes'} />
        </div>
        <div className={`app-view${active === 'accounts' ? ' app-view--active' : ''}`} aria-hidden={active !== 'accounts'}>
          <AccountsView previewEnabled={accountsPreviewOn} />
        </div>
        <div className={`app-view${active === 'settings' ? ' app-view--active' : ''}`} aria-hidden={active !== 'settings'}>
          <SettingsView
            theme={theme}
            accent={accent}
            onThemeChange={setTheme}
            onAccentChange={setAccent}
          />
        </div>
      </main>

      {showOnboarding && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}

      {publishSuccess && (
        <PublishSuccessDialog
          post={publishSuccess.post}
          info={publishSuccess.info}
          onDismiss={() => setPublishSuccess(null)}
          onViewInContent={() => {
            revealContentPost(publishSuccess.post)
            setPublishSuccess(null)
          }}
        />
      )}
    </div>
  )
}
