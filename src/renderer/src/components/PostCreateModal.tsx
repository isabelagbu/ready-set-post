import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import PostCreateForm from './PostCreateForm'
import { type Status } from '../posts/types'

export default function PostCreateModal({
  initialDraft,
  initialDate,
  onClose,
  onCreate
}: {
  initialDraft: boolean
  initialDate?: string
  onClose: () => void
  onCreate: (payload: {
    title: string
    body: string
    platforms: string[]
    status: Extract<Status, 'draft' | 'scheduled'>
    scheduledAt: string | null
  }) => void
}): React.ReactElement {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="post-create-modal-backdrop" role="presentation" onClick={onClose}>
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
              Choose Draft or Scheduled, add platforms, and save.
            </p>
          </div>
          <button type="button" className="ghost post-create-modal-close" onClick={onClose}>
            Close
          </button>
        </header>

        <PostCreateForm
          initialDraft={initialDraft}
          initialDate={initialDate}
          onCancel={onClose}
          onCreate={onCreate}
          showTitle={false}
          plain
        />
      </div>
    </div>,
    document.body
  )
}

