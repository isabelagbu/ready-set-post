const MAX_PREVIEW_BYTES = 500_000

/** Read a small image file as a data URL for post card previews. */
export async function imageFileToPreviewDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/') || file.size > MAX_PREVIEW_BYTES) return null
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

/**
 * Capture a frame from a video file for in-app previews.
 * Needed for private YouTube uploads — public ytimg URLs often 403.
 */
export async function videoFileToPreviewDataUrl(file: File): Promise<string | null> {
  if (!file.type.startsWith('video/')) return null
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    const objectUrl = URL.createObjectURL(file)

    const finish = (result: string | null): void => {
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    const capture = (): void => {
      try {
        const vw = video.videoWidth
        const vh = video.videoHeight
        if (!vw || !vh) {
          finish(null)
          return
        }
        const width = Math.min(480, vw)
        const height = Math.round((width * vh) / vw)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          finish(null)
          return
        }
        ctx.drawImage(video, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
        if (dataUrl.length > MAX_PREVIEW_BYTES) {
          finish(null)
          return
        }
        finish(dataUrl)
      } catch {
        finish(null)
      }
    }

    video.addEventListener('error', () => finish(null), { once: true })
    video.addEventListener(
      'loadeddata',
      () => {
        const seekTo = Number.isFinite(video.duration) && video.duration > 0.5 ? 0.5 : 0
        video.addEventListener('seeked', () => capture(), { once: true })
        video.currentTime = seekTo
      },
      { once: true }
    )
    video.src = objectUrl
  })
}

/** Prefer custom thumbnail; otherwise grab a frame from the video file. */
export async function buildLocalPreviewDataUrl(
  videoFile: File | null,
  thumbnailFile: File | null
): Promise<string | null> {
  if (thumbnailFile) {
    const fromThumb = await imageFileToPreviewDataUrl(thumbnailFile)
    if (fromThumb) return fromThumb
  }
  if (videoFile) return videoFileToPreviewDataUrl(videoFile)
  return null
}
