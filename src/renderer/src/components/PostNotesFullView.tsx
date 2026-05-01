import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import ConfirmDialog from './ConfirmDialog'
import PostContentNotesEditor from './PostContentNotesEditor'
import PostEditorForm from './PostEditorForm'
import PostLivePreview from './PostLivePreview'
import PostPills from './PostPills'
import { livePostUrl, type Post, type PostContentNotes } from '../posts/types'

export default function PostNotesFullView({
  post,
  onClose,
  onNotesChange,
  onPostChange,
  onDelete
}: {
  post: Post
  onClose: () => void
  onNotesChange: (notes: PostContentNotes) => void
  onPostChange: (patch: Partial<Post>) => void
  onDelete: () => void
}): React.ReactElement {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        if (confirmDelete) { setConfirmDelete(false); return }
        if (editing) { setEditing(false); return }
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, editing, confirmDelete])

  return createPortal(
    <div
      className="post-notes-full-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-notes-full-title"
    >
      <header className={`post-notes-full-toolbar${editing ? ' post-notes-full-toolbar--editing' : ''}`}>
        <button type="button" className="ghost post-notes-full-back" onClick={onClose}>
          ← Back
        </button>
        <div className="post-notes-full-toolbar-text">
          <h1 id="post-notes-full-title" className="post-notes-full-title">
            {editing ? 'Edit post' : 'Full details'}
          </h1>
        </div>
        <div className="post-notes-full-toolbar-actions">
          <button
            type="button"
            className={editing ? 'ghost' : 'primary'}
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? 'Cancel edit' : 'Edit post'}
          </button>
          {!editing && (
            <button
              type="button"
              className="danger ghost"
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete post"
            >
              Delete
            </button>
          )}
        </div>
      </header>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete post?"
          message={`"${post.title || 'Untitled'}" will be permanently deleted.`}
          confirmLabel="Delete"
          onConfirm={onDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="post-notes-full-scroll">
        <div className="post-notes-full-inner">
          {editing ? (
            <PostEditorForm
              post={post}
              onSave={(patch) => {
                onPostChange(patch)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="post-notes-full-meta">
                <span className={`badge status-${post.status}`}>{post.status}</span>
                {post.scheduledAt && (
                  <span className="muted small post-notes-full-date">
                    {new Date(post.scheduledAt).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                )}
                {(post.platforms.length > 0 || post.accountIds.length > 0) && (
                  <PostPills post={post} />
                )}
              </div>

              <p className="post-notes-full-post-title">{post.title}</p>

              {post.status === 'posted' && livePostUrl(post) && (
                <div className="post-notes-full-live">
                  <PostLivePreview url={livePostUrl(post)!} />
                </div>
              )}

              <PostContentNotesEditor
                notes={post.contentNotes}
                onChange={onNotesChange}
                plain
                captionReadOnly
              />
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
