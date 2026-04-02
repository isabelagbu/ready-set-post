import type { PostContentNotes } from '../posts/types'

const FIELDS: { key: keyof PostContentNotes; label: string; hint: string }[] = [
  { key: 'script', label: 'Script', hint: 'Lines, shot list, or teleprompter copy' },
  { key: 'hashtags', label: 'Hashtags', hint: '#tags separated by spaces or lines' },
  { key: 'caption', label: 'Caption', hint: 'Platform-specific caption or CTA' },
  { key: 'other', label: 'Other', hint: 'Anything else — links, ideas, reminders' }
]

export default function PostContentNotesEditor({
  notes,
  onChange,
  plain = false
}: {
  notes: PostContentNotes
  onChange: (next: PostContentNotes) => void
  /** Lighter chrome when nested inside another card (e.g. modal). */
  plain?: boolean
}): React.ReactElement {
  function setField(key: keyof PostContentNotes, value: string): void {
    onChange({ ...notes, [key]: value })
  }

  return (
    <div
      className={`post-content-notes${plain ? ' post-content-notes--plain' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <p className="post-content-notes-title">Production notes</p>
      {FIELDS.map(({ key, label, hint }) => (
        <label key={key} className="content-note-field">
          <span className="label">{label}</span>
          <span className="muted small content-note-hint">{hint}</span>
          <textarea
            className="content-note-textarea"
            value={notes[key]}
            onChange={(e) => setField(key, e.target.value)}
            rows={key === 'hashtags' ? 2 : 3}
            spellCheck={true}
          />
        </label>
      ))}
    </div>
  )
}
