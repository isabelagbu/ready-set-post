import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import PostLivePreview from './PostLivePreview'
import type { Post } from '../posts/types'

export type PublishSuccessInfo = {
  watchUrl: string
  channelTitle: string
  thumbnailWarning?: string
}

export default function PublishSuccessDialog({
  post,
  info,
  onViewInContent,
  onDismiss
}: {
  post: Post
  info: PublishSuccessInfo
  onViewInContent: () => void
  onDismiss: () => void
}): React.ReactElement {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onDismiss])

  return createPortal(
    <div
      className="publish-success-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-success-title"
    >
      <div className="publish-success-dialog card">
        <h2 id="publish-success-title" className="publish-success-title">
          Posted to YouTube
        </h2>
        <p className="muted small publish-success-sub">
          Uploaded to <strong>{info.channelTitle}</strong>
          {info.thumbnailWarning ? ` — ${info.thumbnailWarning}` : ''}
        </p>
        <p className="publish-success-post-title">{post.title}</p>
        <PostLivePreview url={info.watchUrl} post={post} />
        <div className="publish-success-actions">
          <button type="button" className="ghost" onClick={onDismiss}>
            Dismiss
          </button>
          <button type="button" className="primary" onClick={onViewInContent} autoFocus>
            View in Content
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
