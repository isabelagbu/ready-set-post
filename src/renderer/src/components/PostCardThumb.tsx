import { useEffect, useMemo, useRef, useState } from 'react'
import { PLATFORM_META, type Platform } from '../accounts/types'
import { postCardThumbnailCandidates, postIsPrivateYouTube } from '../posts/thumbnails'
import type { Post } from '../posts/types'

const PLATFORM_GRADIENTS: Partial<Record<Platform, string>> = {
  instagram: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  tiktok: 'linear-gradient(135deg, #010101 0%, #161616 50%, #69c9d0 100%)',
  youtube: 'linear-gradient(135deg, #ff0000, #cc0000)',
  linkedin: 'linear-gradient(135deg, #0077b5, #004f80)',
  x: 'linear-gradient(135deg, #14171a, #333)'
}

function platformGradient(post: Post): string {
  const label = post.platforms[0]
  if (label) {
    const key = Object.entries(PLATFORM_META).find(([, m]) => m.label === label)?.[0] as Platform | undefined
    if (key && PLATFORM_GRADIENTS[key]) return PLATFORM_GRADIENTS[key]!
  }
  if (post.mediaType === 'video') return PLATFORM_GRADIENTS.youtube ?? 'linear-gradient(135deg, var(--accent-soft), var(--surface-muted))'
  return 'linear-gradient(135deg, var(--accent-soft), var(--surface-muted))'
}

export default function PostCardThumb({
  post,
  postedUrl
}: {
  post: Post
  postedUrl: string
}): React.ReactElement {
  const [srcIndex, setSrcIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failedAll, setFailedAll] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [tiktokThumb, setTiktokThumb] = useState<string | null>(null)
  const retryTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const baseCandidates = useMemo(
    () => postCardThumbnailCandidates(post, postedUrl),
    [post, postedUrl]
  )
  const candidates = useMemo(
    () => (tiktokThumb ? [...baseCandidates, tiktokThumb] : baseCandidates),
    [baseCandidates, tiktokThumb]
  )
  const src = candidates[srcIndex] ?? null
  const showImage = !!src && !failedAll && loaded
  const gradient = platformGradient(post)

  useEffect(() => {
    setSrcIndex(0)
    setLoaded(false)
    setFailedAll(false)
    setReloadKey(0)
    setTiktokThumb(null)

    if (baseCandidates.length === 0 && /tiktok\.com/.test(postedUrl)) {
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(postedUrl)}`)
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.thumbnail_url === 'string') setTiktokThumb(d.thumbnail_url)
        })
        .catch(() => {})
    }
  }, [post, postedUrl, baseCandidates.length])

  useEffect(() => {
    if (retryTimer.current) {
      clearInterval(retryTimer.current)
      retryTimer.current = null
    }
    if (baseCandidates.length === 0 || post.previewThumbnailDataUrl || postIsPrivateYouTube(post)) return

    let attempts = 0
    retryTimer.current = setInterval(() => {
      attempts += 1
      if (attempts > 8) {
        if (retryTimer.current) clearInterval(retryTimer.current)
        return
      }
      setSrcIndex(0)
      setLoaded(false)
      setFailedAll(false)
      setReloadKey((k) => k + 1)
    }, 4000)

    return () => {
      if (retryTimer.current) clearInterval(retryTimer.current)
    }
  }, [post.id, postedUrl, baseCandidates.length, post.previewThumbnailDataUrl])

  function onImgError(): void {
    if (srcIndex + 1 < candidates.length) {
      setSrcIndex((i) => i + 1)
      setLoaded(false)
      return
    }
    setFailedAll(true)
    setLoaded(false)
  }

  return (
    <div
      className="content-card-thumb-wrap"
      style={{ background: showImage ? undefined : gradient }}
      aria-hidden
    >
      {src && !failedAll && (
        <img
          key={`${src}-${reloadKey}`}
          src={src}
          alt=""
          className={`content-card-thumb${showImage ? ' content-card-thumb--visible' : ''}`}
          onLoad={() => setLoaded(true)}
          onError={onImgError}
        />
      )}
      {!showImage && (
        <div className="content-card-thumb-placeholder">
          <svg viewBox="0 0 24 24" fill="white" width="28" height="28" aria-hidden>
            <polygon points="5 3 19 12 5 21 5 3" opacity="0.85" />
          </svg>
        </div>
      )}
    </div>
  )
}
