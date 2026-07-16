import { useEffect, useMemo, useRef, useState } from 'react'
import {
  extractYouTubeVideoId,
  postCardThumbnailCandidates,
  youTubeThumbnailUrls
} from '../posts/thumbnails'
import type { Post } from '../posts/types'

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube'
  if (/tiktok\.com/.test(url)) return 'TikTok'
  if (/instagram\.com/.test(url)) return 'Instagram'
  if (/threads\.net/.test(url)) return 'Threads'
  if (/linkedin\.com/.test(url)) return 'LinkedIn'
  if (/twitter\.com|x\.com/.test(url)) return 'X'
  return 'Link'
}

export default function PostLivePreview({ url, post }: { url: string; post?: Post }): React.ReactElement {
  const [srcIndex, setSrcIndex] = useState(0)
  const [thumb, setThumb] = useState<string | null>(null)
  const [thumbError, setThumbError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const platform = detectPlatform(url)

  const candidates = useMemo(() => {
    if (post) return postCardThumbnailCandidates(post, url)
    const ytId = extractYouTubeVideoId(url)
    return ytId ? youTubeThumbnailUrls(ytId) : []
  }, [url, post])

  useEffect(() => {
    setSrcIndex(0)
    setThumb(null)
    setThumbError(false)
    setReloadKey(0)

    if (candidates.length > 0) {
      setThumb(candidates[0])
      const skipRetry = !!post?.previewThumbnailDataUrl
      if (skipRetry) return
      let attempts = 0
      retryTimer.current = setInterval(() => {
        attempts += 1
        if (attempts > 6) {
          if (retryTimer.current) clearInterval(retryTimer.current)
          return
        }
        setSrcIndex(0)
        setThumbError(false)
        setThumb(candidates[0])
        setReloadKey((k) => k + 1)
      }, 4000)
    } else if (/tiktok\.com/.test(url)) {
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.thumbnail_url) setThumb(d.thumbnail_url)
        })
        .catch(() => {})
    }

    return () => {
      if (retryTimer.current) clearInterval(retryTimer.current)
    }
  }, [url, candidates])

  const activeSrc = thumbError ? null : candidates[srcIndex] ?? thumb

  function onImgError(): void {
    if (candidates.length > 0 && srcIndex + 1 < candidates.length) {
      setSrcIndex((i) => i + 1)
      setThumb(candidates[srcIndex + 1])
      return
    }
    setThumbError(true)
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="post-live-preview"
      aria-label={`View live post on ${platform}`}
    >
      <div className="post-live-preview-thumb">
        {activeSrc && !thumbError ? (
          <img
            key={`${activeSrc}-${reloadKey}`}
            src={activeSrc}
            alt="Video thumbnail"
            className="post-live-preview-img"
            onError={onImgError}
          />
        ) : (
          <div className="post-live-preview-placeholder" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
              <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" opacity="0.7" />
            </svg>
          </div>
        )}
        <div className="post-live-preview-play" aria-hidden>
          <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </div>
      </div>
      <div className="post-live-preview-info">
        <span className="post-live-preview-platform">{platform}</span>
        <span className="post-live-preview-url muted small">{url}</span>
        <span className="post-live-preview-cta">View live post →</span>
      </div>
    </a>
  )
}
