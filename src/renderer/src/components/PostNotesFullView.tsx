import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import PostContentNotesEditor from './PostContentNotesEditor'
import { livePostUrl, type Post, type PostContentNotes } from '../posts/types'

export default function PostNotesFullView({
  post,
  onClose,
  onNotesChange
}: {
  post: Post
  onClose: () => void
  onNotesChange: (notes: PostContentNotes) => void
}): React.ReactElement {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="post-notes-full-view"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-notes-full-title"
    >
      <header className="post-notes-full-toolbar">
        <button type="button" className="ghost post-notes-full-back" onClick={onClose}>
          ← Back to Content
        </button>
        <div className="post-notes-full-toolbar-text">
          <h1 id="post-notes-full-title" className="post-notes-full-title">
            Script & production notes
          </h1>
          <p className="muted small post-notes-full-sub">
            Full screen while you record — edits save automatically.
          </p>
        </div>
      </header>

      <div className="post-notes-full-scroll">
        <div className="post-notes-full-inner">
          <div className="post-notes-full-meta">
            <span className={`badge status-${post.status}`}>{post.status}</span>
            {post.scheduledAt && (
              <span className="muted small">
                {new Date(post.scheduledAt).toLocaleString()}
              </span>
            )}
            {post.platforms.length > 0 && (
              <div className="pills post-notes-full-pills">
                {post.platforms.map((p) => (
                  <span key={p} className="pill">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <section className="post-notes-full-section" aria-label="Post copy">
            <span className="label">Post</span>
            <p className="post-notes-full-post-title">{post.title}</p>
            <p className="post-notes-full-body">{post.body}</p>
          </section>

          {post.status === 'posted' && (
            <p className="post-notes-full-live">
              <a
                href={livePostUrl(post)!}
                target="_blank"
                rel="noopener noreferrer"
                className="post-live-link"
              >
                View live post
              </a>
            </p>
          )}

          <PostContentNotesEditor
            notes={post.contentNotes}
            onChange={onNotesChange}
            plain
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
