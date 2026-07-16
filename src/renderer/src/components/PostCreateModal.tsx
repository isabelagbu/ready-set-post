import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import PostCreateForm from './PostCreateForm'
import type { PublishSuccessInfo } from './PublishSuccessDialog'
import { type CreatePostPayload, type Post } from '../posts/types'

export default function PostCreateModal({
  initialDraft,
  initialDate,
  onClose,
  onCreate,
  onPostPublished
}: {
  initialDraft: boolean
  initialDate?: string
  onClose: () => void
  onCreate: (payload: CreatePostPayload) => Post
  onPostPublished?: (post: Post, info: PublishSuccessInfo) => void
}): React.ReactElement {
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (publishing) return
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, publishing])

  return createPortal(
    <div
      className="post-create-modal-backdrop"
      role="presentation"
      onClick={() => {
        if (!publishing) onClose()
      }}
    >
      <div
        className="post-create-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-create-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="post-create-modal-header">
          <div>
            <h2 id="post-create-modal-title" className="post-create-modal-title">
              Create new post
            </h2>
            <p className="muted small post-create-modal-sub">
              Draft, schedule, or log something already published — add platforms, then save.
            </p>
          </div>
          <button
            type="button"
            className="ghost post-create-modal-close"
            onClick={onClose}
            disabled={publishing}
          >
            Close
          </button>
        </header>

        <PostCreateForm
          initialDraft={initialDraft}
          initialDate={initialDate}
          onCancel={onClose}
          onCreate={onCreate}
          onPostPublished={onPostPublished}
          onPublishingChange={setPublishing}
          showTitle={false}
          plain
        />
      </div>
    </div>,
    document.body
  )
}

