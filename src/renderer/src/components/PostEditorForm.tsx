import { useState } from 'react'
import { PLATFORM_OPTIONS, type Post, type Status } from '../posts/types'
import { toDatetimeLocalValue } from '../posts/datetime'
import DateTimePicker from './DateTimePicker'

export default function PostEditorForm({
  post,
  onSave,
  onCancel
}: {
  post: Post
  onSave: (patch: Partial<Post>) => void
  onCancel: () => void
}): React.ReactElement {
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [platforms, setPlatforms] = useState<string[]>(post.platforms)
  const [dtLocal, setDtLocal] = useState(() =>
    post.scheduledAt ? toDatetimeLocalValue(post.scheduledAt) : ''
  )
  const [status, setStatus] = useState<Status>(post.status)
  const [postedUrl, setPostedUrl] = useState(post.postedUrl ?? '')
  const [isDraft, setIsDraft] = useState(post.status === 'draft' && !post.scheduledAt)

  function togglePlatform(p: string): void {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function save(): void {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    if (isDraft) {
      onSave({
        title: trimmedTitle,
        body: body.trim() || post.body,
        platforms,
        scheduledAt: null,
        status: 'draft',
        postedUrl: null
      })
      return
    }
    const scheduledAt = dtLocal.trim() ? new Date(dtLocal).toISOString() : null
    let nextStatus = status
    if (scheduledAt && nextStatus === 'draft') nextStatus = 'scheduled'
    if (!scheduledAt && nextStatus === 'scheduled') nextStatus = 'draft'
    onSave({
      title: trimmedTitle,
      body: body.trim() || post.body,
      platforms,
      scheduledAt,
      status: nextStatus,
      postedUrl: nextStatus === 'posted' ? (postedUrl.trim() || null) : null
    })
  }

  return (
    <div className="day-post-editor">
      <label>
        <span className="label">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. TikTok caption ideas"
          required
        />
      </label>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} />
      <label className="grow">
        <span className="label">Date & time</span>
        <DateTimePicker value={dtLocal} onChange={setDtLocal} />
      </label>
      <div className="row platforms">
        <label className="chip chip-draft">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => {
              const on = e.target.checked
              setIsDraft(on)
              if (on) {
                setDtLocal('')
                setStatus('draft')
              }
            }}
          />
          Draft
        </label>
        {PLATFORM_OPTIONS.map((p) => (
          <label key={p} className="chip">
            <input
              type="checkbox"
              checked={platforms.includes(p)}
              onChange={() => togglePlatform(p)}
            />
            {p}
          </label>
        ))}
      </div>
      <label>
        <span className="label">Status</span>
        <select
          value={status}
          disabled={isDraft}
          onChange={(e) => setStatus(e.target.value as Status)}
        >
          <option value="draft">draft</option>
          <option value="scheduled">scheduled</option>
          <option value="posted">posted</option>
        </select>
      </label>
      {!isDraft && status === 'posted' && (
        <label>
          <span className="label">Live post URL</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={postedUrl}
            onChange={(e) => setPostedUrl(e.target.value)}
          />
          <span className="muted small">Optional. If empty, a placeholder link is used until you add one.</span>
        </label>
      )}
      <div className="row actions">
        <button type="button" className="primary" onClick={save}>
          Save
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
