import type { PostContentNotes } from '../posts/types'

export default function PostContentNotesEditor({
  notes,
  onChange,
  plain = false,
  captionReadOnly = false
}: {
  notes: PostContentNotes
  onChange: (next: PostContentNotes) => void
  /** Lighter chrome when nested inside another card (e.g. modal). */
  plain?: boolean
  /** When true, Caption + Hashtags is view-only. */
  captionReadOnly?: boolean
}): React.ReactElement {
  const captionAndHashtags = [notes.caption.trim(), notes.hashtags.trim()].filter(Boolean).join('\n')
  return (
    <div
      className={`post-content-notes${plain ? ' post-content-notes--plain' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <label className="content-note-field">
        <span className="label">Caption + Hashtags</span>
        {captionReadOnly ? (
          <div className="post-notes-full-body">{captionAndHashtags || '—'}</div>
        ) : (
          <textarea
            className="content-note-textarea"
            value={captionAndHashtags}
            onChange={(e) => onChange({ ...notes, caption: e.target.value, hashtags: '' })}
            rows={3}
            spellCheck={true}
          />
        )}
      </label>
      <label className="content-note-field">
        <span className="label content-note-main-label">Notes</span>
        <span className="muted small content-note-hint">
          Ideas, reminders, links, or production details.
        </span>
        <textarea
          className="content-note-textarea"
          value={notes.notes}
          onChange={(e) => onChange({ ...notes, notes: e.target.value })}
          rows={8}
          spellCheck={true}
        />
      </label>
    </div>
  )
}
