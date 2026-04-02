export type Status = 'draft' | 'scheduled' | 'posted'

/** Shown when a posted item has no `postedUrl` yet (replace per post in Edit). */
export const DUMMY_POSTED_URL = 'https://example.com/social-post-placeholder'

/** Per-post production notes (Content view). */
export type PostContentNotes = {
  script: string
  hashtags: string
  caption: string
  other: string
}

export const EMPTY_CONTENT_NOTES: PostContentNotes = {
  script: '',
  hashtags: '',
  caption: '',
  other: ''
}

function parseContentNotes(raw: unknown): PostContentNotes {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_CONTENT_NOTES }
  }
  const o = raw as Record<string, unknown>
  const s = (k: string): string => (typeof o[k] === 'string' ? o[k] : '')
  return {
    script: s('script'),
    hashtags: s('hashtags'),
    caption: s('caption'),
    other: s('other')
  }
}

export type Post = {
  id: string
  /** Human-friendly title (required). */
  title: string
  body: string
  platforms: string[]
  status: Status
  scheduledAt: string | null
  /** Canonical link to the live post or video when status is posted. */
  postedUrl: string | null
  contentNotes: PostContentNotes
  createdAt: string
}

export function livePostUrl(post: Post): string | null {
  if (post.status !== 'posted') return null
  const u = post.postedUrl?.trim()
  return u && u.length > 0 ? u : DUMMY_POSTED_URL
}

export function postHasContentNotes(post: Post): boolean {
  const n = post.contentNotes
  return [n.script, n.hashtags, n.caption, n.other].some((s) => s.trim().length > 0)
}

export const PLATFORM_OPTIONS = [
  'X',
  'LinkedIn',
  'Instagram',
  'Threads',
  'Bluesky',
  'TikTok',
  'YouTube'
] as const

export function parsePost(raw: unknown): Post | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.body !== 'string') return null
  const platforms = Array.isArray(o.platforms) ? o.platforms.filter((p): p is string => typeof p === 'string') : []
  const status = o.status === 'draft' || o.status === 'scheduled' || o.status === 'posted' ? o.status : 'draft'
  const scheduledAt = o.scheduledAt === null || typeof o.scheduledAt === 'string' ? o.scheduledAt : null
  const postedUrl =
    o.postedUrl === null || typeof o.postedUrl === 'string' ? o.postedUrl : null
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const contentNotes = parseContentNotes(o.contentNotes)
  const rawTitle = typeof o.title === 'string' ? o.title : ''
  const derivedTitle =
    rawTitle.trim().length > 0
      ? rawTitle.trim()
      : o.body
          .split('\n')[0]
          .trim()
          .slice(0, 80)
          .trim()
  return {
    id: o.id,
    title: derivedTitle.length > 0 ? derivedTitle : 'Untitled',
    body: o.body,
    platforms,
    status,
    scheduledAt,
    postedUrl,
    contentNotes,
    createdAt
  }
}

export function newPostId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
