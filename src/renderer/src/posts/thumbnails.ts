import type { Post } from './types'

/** Extract a YouTube video id from common watch / short URLs. */
export function extractYouTubeVideoId(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  const watch = trimmed.match(/(?:youtube\.com\/watch\?.*[&?]v=|youtube\.com\/watch\?v=)([^&?\s#/]+)/i)
  if (watch?.[1]) return watch[1]
  const short = trimmed.match(/youtu\.be\/([^&?\s#/]+)/i)
  if (short?.[1]) return short[1]
  const shorts = trimmed.match(/youtube\.com\/shorts\/([^&?\s#/]+)/i)
  if (shorts?.[1]) return shorts[1]
  return null
}

/** Ordered candidates — newer uploads may not have hqdefault yet. */
export function youTubeThumbnailUrls(videoId: string): string[] {
  return [
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/0.jpg`
  ]
}

export function postYouTubeVideoId(post: Post, liveUrl?: string | null): string | null {
  if (post.youtubeVideoId?.trim()) return post.youtubeVideoId.trim()
  if (liveUrl) return extractYouTubeVideoId(liveUrl)
  if (post.postedUrl?.trim()) return extractYouTubeVideoId(post.postedUrl)
  const ytLink = post.postedLinks?.YouTube?.trim()
  if (ytLink) return extractYouTubeVideoId(ytLink)
  return null
}

/** Remote image URLs to try for a post card (local preview first). */
export function postIsPrivateYouTube(post: Post): boolean {
  return post.platformPublishConfig.youtube?.privacyStatus === 'private'
}

export function postCardThumbnailCandidates(post: Post, liveUrl: string): string[] {
  const local = post.previewThumbnailDataUrl?.trim()
  if (local) return [local]
  // Public CDN thumbs often 403 for private videos — rely on saved local preview only.
  if (postIsPrivateYouTube(post)) return []
  const ytId = postYouTubeVideoId(post, liveUrl)
  if (ytId) return youTubeThumbnailUrls(ytId)
  return []
}
