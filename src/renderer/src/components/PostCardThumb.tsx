import { useEffect, useState } from 'react'

function youTubeThumbnail(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([^&?\s/]+)/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null
}

export default function PostCardThumb({ postedUrl }: { postedUrl: string }): React.ReactElement | null {
  const [thumb, setThumb] = useState<string | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    setThumb(null)
    setErr(false)
    const yt = youTubeThumbnail(postedUrl)
    if (yt) { setThumb(yt); return }
    if (/tiktok\.com/.test(postedUrl)) {
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(postedUrl)}`)
        .then((r) => r.json())
        .then((d) => { if (d.thumbnail_url) setThumb(d.thumbnail_url) })
        .catch(() => {})
    }
  }, [postedUrl])

  if (!thumb || err) return null
  return (
    <img
      src={thumb}
      alt="Post thumbnail"
      className="content-card-thumb"
      onError={() => setErr(true)}
    />
  )
}
