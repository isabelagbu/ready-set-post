export type Status = 'draft' | 'scheduled' | 'posted'
export type PostedLinks = Record<string, string>
export type MediaType = 'text' | 'video'
export type VideoAsset = {
  name: string
  size: number
  type: string
  lastModified: number
}
export type YouTubeThumbnailAsset = {
  name: string
  size: number
  type: string
  lastModified: number
}
export type YouTubePublishConfig = {
  title: string
  description: string
  tags: string[]
  privacyStatus: 'private' | 'unlisted' | 'public'
  madeForKids: boolean
  thumbnailAsset: YouTubeThumbnailAsset | null
}
export type TikTokPublishConfig = {
  caption: string
  privacyLevel: 'followers' | 'friends' | 'private' | 'public'
}
export type InstagramPublishConfig = {
  caption: string
  location: string
}
export type PlatformPublishConfig = {
  youtube?: YouTubePublishConfig
  tiktok?: TikTokPublishConfig
  instagram?: InstagramPublishConfig
}
const LIVE_PREVIEW_PLATFORM_PRIORITY = ['TikTok', 'Instagram', 'YouTube', 'X', 'Threads', 'LinkedIn'] as const

/** Shown when a posted item has no `postedUrl` yet (replace per post in Edit). */
export const DUMMY_POSTED_URL = 'https://example.com/social-post-placeholder'

/** Per-post production notes (Content view). */
export type PostContentNotes = {
  caption: string
  hashtags: string
  notes: string
}

export const EMPTY_CONTENT_NOTES: PostContentNotes = {
  caption: '',
  hashtags: '',
  notes: ''
}

export function contentNotesText(notes: PostContentNotes | Record<string, unknown> | null | undefined): string {
  if (!notes || typeof notes !== 'object' || Array.isArray(notes)) return ''
  const o = notes as Record<string, unknown>
  const n = typeof o.notes === 'string' ? o.notes.trim() : ''
  const caption = typeof o.caption === 'string' ? o.caption.trim() : ''
  const hashtags = typeof o.hashtags === 'string' ? o.hashtags.trim() : ''
  if (n.length > 0 || caption || hashtags) return [caption, hashtags, n].filter(Boolean).join('\n\n')
  const script = typeof o.script === 'string' ? o.script.trim() : ''
  const other = typeof o.other === 'string' ? o.other.trim() : ''
  return [caption, hashtags, script, other].filter(Boolean).join('\n\n')
}

function parseContentNotes(raw: unknown): PostContentNotes {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...EMPTY_CONTENT_NOTES }
  }
  const o = raw as Record<string, unknown>
  const s = (k: string): string => (typeof o[k] === 'string' ? o[k].trim() : '')
  let caption = s('caption')
  const hashtags = s('hashtags')
  let notes = s('notes') || [s('script'), s('other')].filter(Boolean).join('\n\n')
  // If legacy data only has the old unified notes text, show it in Caption + Hashtags.
  if (!caption && !hashtags && notes) {
    caption = notes
    notes = ''
  }
  return {
    caption,
    hashtags,
    notes
  }
}

export type Post = {
  id: string
  /** Human-friendly title (required). */
  title: string
  body: string
  platforms: string[]
  /** IDs of specific accounts this post is targeted to (e.g. TikTok/Instagram/Threads/YouTube). */
  accountIds: string[]
  status: Status
  scheduledAt: string | null
  /** Canonical link to the live post or video when status is posted. */
  postedUrl: string | null
  /** Optional live links keyed by platform label (e.g. TikTok, Instagram). */
  postedLinks: PostedLinks
  /** YouTube video id after a successful upload (for thumbnails). */
  youtubeVideoId?: string | null
  /** Small data-URL preview saved at compose time (custom thumbnail). */
  previewThumbnailDataUrl?: string | null
  mediaType: MediaType
  videoAsset: VideoAsset | null
  platformPublishConfig: PlatformPublishConfig
  contentNotes: PostContentNotes
  createdAt: string
  /** Last local modification time. Used for deterministic merging across devices. */
  updatedAt: string
}

/** Returns the patch with `updatedAt` set to now. Use whenever a post is mutated locally. */
export function withUpdatedAt<T extends Partial<Post>>(patch: T): T & { updatedAt: string } {
  return { ...patch, updatedAt: new Date().toISOString() }
}

/** Stamps every post in a list with a fresh `updatedAt`. Use when bulk-replacing the store. */
export function stampUpdatedAt<T extends Partial<Post>>(posts: T[]): (T & { updatedAt: string })[] {
  const now = new Date().toISOString()
  return posts.map((p) => ({ ...p, updatedAt: now }))
}

/** Payload for creating a post from the composer (Calendar, Content, etc.). */
export type CreatePostPayload = {
  title: string
  body: string
  platforms: string[]
  accountIds: string[]
  status: Status
  scheduledAt: string | null
  postedUrl: string | null
  postedLinks: PostedLinks
  youtubeVideoId?: string | null
  previewThumbnailDataUrl?: string | null
  mediaType: MediaType
  videoAsset: VideoAsset | null
  platformPublishConfig: PlatformPublishConfig
}

/** Merge post lists by id, keeping the row with the later `updatedAt`. */
export function mergePostsLists(a: Post[], b: Post[]): Post[] {
  const byId = new Map<string, Post>()
  const order: string[] = []
  for (const p of a) {
    if (!byId.has(p.id)) order.push(p.id)
    byId.set(p.id, p)
  }
  for (const p of b) {
    const existing = byId.get(p.id)
    if (!existing) {
      order.push(p.id)
      byId.set(p.id, p)
    } else if (new Date(p.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      byId.set(p.id, p)
    }
  }
  return order.map((id) => byId.get(id)).filter((p): p is Post => p !== undefined)
}

export function livePostUrl(post: Post): string | null {
  if (post.status !== 'posted') return null
  const links = post.postedLinks ?? {}
  for (const platform of LIVE_PREVIEW_PLATFORM_PRIORITY) {
    const v = links[platform]?.trim()
    if (v) return v
  }
  const u = post.postedUrl?.trim()
  if (u && u.length > 0) return u
  const firstFromMap = Object.values(links).find((x) => x.trim().length > 0)?.trim()
  return firstFromMap && firstFromMap.length > 0 ? firstFromMap : DUMMY_POSTED_URL
}

export function postHasContentNotes(post: Post): boolean {
  return contentNotesText(post.contentNotes).length > 0
}

export const PLATFORM_OPTIONS = [
  'TikTok',
  'Instagram',
  'YouTube',
  'X',
  'Threads',
  'LinkedIn'
] as const

export function parsePost(raw: unknown): Post | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.id !== 'string' || typeof o.body !== 'string') return null
  const platforms = Array.isArray(o.platforms) ? o.platforms.filter((p): p is string => typeof p === 'string') : []
  const accountIds = Array.isArray(o.accountIds) ? o.accountIds.filter((a): a is string => typeof a === 'string') : []
  const status = o.status === 'draft' || o.status === 'scheduled' || o.status === 'posted' ? o.status : 'draft'
  const scheduledAt = o.scheduledAt === null || typeof o.scheduledAt === 'string' ? o.scheduledAt : null
  const postedUrl =
    o.postedUrl === null || typeof o.postedUrl === 'string' ? o.postedUrl : null
  const postedLinks: PostedLinks = {}
  if (o.postedLinks && typeof o.postedLinks === 'object' && !Array.isArray(o.postedLinks)) {
    for (const [k, v] of Object.entries(o.postedLinks as Record<string, unknown>)) {
      if (typeof v !== 'string') continue
      const key = k.trim()
      const val = v.trim()
      if (!key || !val) continue
      postedLinks[key] = val
    }
  }
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : createdAt
  const contentNotes = parseContentNotes(o.contentNotes)
  const platformPublishConfig: PlatformPublishConfig = {}
  if (o.platformPublishConfig && typeof o.platformPublishConfig === 'object' && !Array.isArray(o.platformPublishConfig)) {
    const cfg = o.platformPublishConfig as Record<string, unknown>
    if (cfg.youtube && typeof cfg.youtube === 'object' && !Array.isArray(cfg.youtube)) {
      const yt = cfg.youtube as Record<string, unknown>
      const tags =
        Array.isArray(yt.tags)
          ? yt.tags.filter((x): x is string => typeof x === 'string').map((s) => s.trim()).filter(Boolean)
          : []
      const thumbnailAsset =
        yt.thumbnailAsset &&
        typeof yt.thumbnailAsset === 'object' &&
        !Array.isArray(yt.thumbnailAsset) &&
        typeof (yt.thumbnailAsset as Record<string, unknown>).name === 'string' &&
        typeof (yt.thumbnailAsset as Record<string, unknown>).size === 'number' &&
        typeof (yt.thumbnailAsset as Record<string, unknown>).type === 'string' &&
        typeof (yt.thumbnailAsset as Record<string, unknown>).lastModified === 'number'
          ? ({
              name: (yt.thumbnailAsset as Record<string, unknown>).name as string,
              size: (yt.thumbnailAsset as Record<string, unknown>).size as number,
              type: (yt.thumbnailAsset as Record<string, unknown>).type as string,
              lastModified: (yt.thumbnailAsset as Record<string, unknown>).lastModified as number
            } satisfies YouTubeThumbnailAsset)
          : null
      platformPublishConfig.youtube = {
        title: typeof yt.title === 'string' ? yt.title : '',
        description: typeof yt.description === 'string' ? yt.description : '',
        tags,
        privacyStatus:
          yt.privacyStatus === 'private' || yt.privacyStatus === 'unlisted' || yt.privacyStatus === 'public'
            ? yt.privacyStatus
            : 'private',
        madeForKids: yt.madeForKids === true,
        thumbnailAsset
      }
    }
    if (cfg.tiktok && typeof cfg.tiktok === 'object' && !Array.isArray(cfg.tiktok)) {
      const tt = cfg.tiktok as Record<string, unknown>
      platformPublishConfig.tiktok = {
        caption: typeof tt.caption === 'string' ? tt.caption : '',
        privacyLevel:
          tt.privacyLevel === 'followers' ||
          tt.privacyLevel === 'friends' ||
          tt.privacyLevel === 'private' ||
          tt.privacyLevel === 'public'
            ? tt.privacyLevel
            : 'followers'
      }
    }
    if (cfg.instagram && typeof cfg.instagram === 'object' && !Array.isArray(cfg.instagram)) {
      const ig = cfg.instagram as Record<string, unknown>
      platformPublishConfig.instagram = {
        caption: typeof ig.caption === 'string' ? ig.caption : '',
        location: typeof ig.location === 'string' ? ig.location : ''
      }
    }
  }
  const mediaType: MediaType = o.mediaType === 'video' ? 'video' : 'text'
  const videoAsset =
    o.videoAsset &&
    typeof o.videoAsset === 'object' &&
    !Array.isArray(o.videoAsset) &&
    typeof (o.videoAsset as Record<string, unknown>).name === 'string' &&
    typeof (o.videoAsset as Record<string, unknown>).size === 'number' &&
    typeof (o.videoAsset as Record<string, unknown>).type === 'string' &&
    typeof (o.videoAsset as Record<string, unknown>).lastModified === 'number'
      ? ({
          name: (o.videoAsset as Record<string, unknown>).name as string,
          size: (o.videoAsset as Record<string, unknown>).size as number,
          type: (o.videoAsset as Record<string, unknown>).type as string,
          lastModified: (o.videoAsset as Record<string, unknown>).lastModified as number
        } satisfies VideoAsset)
      : null
  const rawTitle = typeof o.title === 'string' ? o.title : ''
  const derivedTitle =
    rawTitle.trim().length > 0
      ? rawTitle.trim()
      : o.body
          .split('\n')[0]
          .trim()
          .slice(0, 80)
          .trim()
  const youtubeVideoId =
    typeof o.youtubeVideoId === 'string' && o.youtubeVideoId.trim().length > 0
      ? o.youtubeVideoId.trim()
      : null
  const previewThumbnailDataUrl =
    typeof o.previewThumbnailDataUrl === 'string' &&
    o.previewThumbnailDataUrl.startsWith('data:image/')
      ? o.previewThumbnailDataUrl
      : null

  return {
    id: o.id,
    title: derivedTitle.length > 0 ? derivedTitle : 'Untitled',
    body: o.body,
    platforms,
    accountIds,
    status,
    scheduledAt,
    postedUrl,
    postedLinks,
    youtubeVideoId,
    previewThumbnailDataUrl,
    mediaType,
    videoAsset,
    platformPublishConfig,
    contentNotes,
    createdAt,
    updatedAt
  }
}

export function newPostId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
