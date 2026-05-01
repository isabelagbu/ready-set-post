import { useEffect, useState } from 'react'

function youTubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([^&?\s/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

function detectPlatform(url: string): string {
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube'
  if (/tiktok\.com/.test(url)) return 'TikTok'
  if (/instagram\.com/.test(url)) return 'Instagram'
  if (/threads\.net/.test(url)) return 'Threads'
  if (/linkedin\.com/.test(url)) return 'LinkedIn'
  if (/twitter\.com|x\.com/.test(url)) return 'X'
  return 'Link'
}

export default function PostLivePreview({ url }: { url: string }): React.ReactElement {
  const [thumb, setThumb] = useState<string | null>(null)
  const [thumbError, setThumbError] = useState(false)
  const platform = detectPlatform(url)

  useEffect(() => {
    setThumb(null)
    setThumbError(false)

    const yt = youTubeThumbnail(url)
    if (yt) { setThumb(yt); return }

    // TikTok oEmbed
    if (/tiktok\.com/.test(url)) {
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then((r) => r.json())
        .then((d) => { if (d.thumbnail_url) setThumb(d.thumbnail_url) })
        .catch(() => {})
    }
  }, [url])

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="post-live-preview"
      aria-label={`View live post on ${platform}`}
    >
      <div className="post-live-preview-thumb">
        {thumb && !thumbError ? (
          <img
            src={thumb}
            alt="Video thumbnail"
            className="post-live-preview-img"
            onError={() => setThumbError(true)}
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
