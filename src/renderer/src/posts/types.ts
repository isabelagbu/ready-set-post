export type Status = 'draft' | 'scheduled' | 'posted'

export type Post = {
  id: string
  body: string
  platforms: string[]
  status: Status
  scheduledAt: string | null
  createdAt: string
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
  const createdAt = typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString()
  return { id: o.id, body: o.body, platforms, status, scheduledAt, createdAt }
}

export function newPostId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}
