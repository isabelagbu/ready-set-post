export type YouTubeChannelOption = {
  id: string
  title: string
  customUrl?: string
}

/** Pull @handle from display name or profile URL. */
export function extractYouTubeHandle(name: string, url: string): string | null {
  const fromName = name.trim().replace(/^@/, '').toLowerCase()
  if (fromName && /^[a-z0-9._-]+$/i.test(fromName)) return fromName

  try {
    const raw = url.trim()
    if (!raw) return null
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    const seg = u.pathname.split('/').filter(Boolean)
    if (seg[0]?.startsWith('@')) return seg[0].slice(1).toLowerCase()
  } catch {
    /* ignore */
  }
  return null
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

/** Match an app account row to a channel from the connected Google account. */
export function resolveYouTubeChannelIdForAccount(
  name: string,
  url: string,
  channels: YouTubeChannelOption[]
): string | null {
  if (channels.length === 0) return null

  const handle = extractYouTubeHandle(name, url)
  if (!handle) return null
  const handleKey = normalizeKey(handle)

  for (const ch of channels) {
    const custom = (ch.customUrl ?? '').toLowerCase()
    if (
      custom === `@${handle}` ||
      custom.endsWith(`/@${handle}`) ||
      custom.endsWith(`/${handle}`)
    ) {
      return ch.id
    }
    const titleKey = normalizeKey(ch.title)
    if (titleKey === handleKey) return ch.id
  }
  return null
}

export function youtubeChannelLabel(
  channelId: string | null,
  channels: YouTubeChannelOption[]
): string | null {
  if (!channelId) return null
  const ch = channels.find((c) => c.id === channelId)
  if (!ch) return null
  const handle = ch.customUrl?.trim()
  return handle ? `${ch.title} (${handle})` : ch.title
}

/** Accounts that can receive an automatic YouTube channel link after Google OAuth. */
export function isYouTubeChannelUploadAuthorized(
  channelId: string | null,
  authorizedChannelIds: readonly string[]
): boolean {
  return !!channelId && authorizedChannelIds.includes(channelId)
}

export function canAutoLinkYouTubePosting(account: {
  platform: string
  postingPermissions: { manualPostingDisconnect?: boolean }
}): boolean {
  return account.platform === 'youtube' && !account.postingPermissions.manualPostingDisconnect
}

/** Apply channel matches to YouTube rows (skips manually disconnected accounts). */
export function applyYouTubeChannelLinks<T extends {
  platform: string
  name: string
  url: string
  postingPermissions: { canPublish: boolean; manualPostingDisconnect?: boolean }
  youtubeChannelId: string | null
}>(
  accounts: T[],
  channels: YouTubeChannelOption[]
): T[] {
  return accounts.map((account) => {
    if (!canAutoLinkYouTubePosting(account)) return account
    const channelId = resolveYouTubeChannelIdForAccount(account.name, account.url, channels)
    if (!channelId) return account
    return {
      ...account,
      youtubeChannelId: channelId,
      postingPermissions: {
        ...account.postingPermissions,
        canPublish: true,
        manualPostingDisconnect: false
      }
    }
  })
}
