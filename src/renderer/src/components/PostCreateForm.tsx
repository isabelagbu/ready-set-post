import { useState } from 'react'
import { PLATFORM_OPTIONS, type Status } from '../posts/types'
import { toDatetimeLocalValue } from '../posts/datetime'
import DateTimePicker from './DateTimePicker'

export default function PostCreateForm({
  initialDraft,
  initialDate,
  onCancel,
  onCreate,
  showTitle = true,
  plain = false
}: {
  initialDraft: boolean
  /** Pre-fill the date picker with this ISO string. Defaults to now. */
  initialDate?: string
  onCancel: () => void
  onCreate: (payload: {
    title: string
    body: string
    platforms: string[]
    status: Extract<Status, 'draft' | 'scheduled'>
    scheduledAt: string | null
  }) => void
  showTitle?: boolean
  plain?: boolean
}): React.ReactElement {
  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [body, setBody] = useState('')
  const [platforms, setPlatforms] = useState<string[]>([])
  const [isDraft, setIsDraft] = useState(initialDraft)
  const [dtLocal, setDtLocal] = useState(() =>
    toDatetimeLocalValue(initialDate ?? new Date().toISOString())
  )

  const titleError = titleTouched && !title.trim()

  function togglePlatform(p: string): void {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function save(): void {
    setTitleTouched(true)
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return
    const text = body.trim()
    if (isDraft) {
      onCreate({ title: trimmedTitle, body: text, platforms, status: 'draft', scheduledAt: null })
      return
    }
    const dt = dtLocal.trim()
    if (!dt) return
    onCreate({
      title: trimmedTitle,
      body: text,
      platforms,
      status: 'scheduled',
      scheduledAt: new Date(dt).toISOString()
    })
  }

  return (
    <div className={`${plain ? '' : 'card '}${'composer post-create-form'}`}>
      {showTitle && (
        <h2 className="filter-panel-title" style={{ margin: '0 0 10px' }}>
          Create new
        </h2>
      )}

      {/* Schedule / Draft tabs */}
      <div className="pcf-tabs">
        <button
          type="button"
          className={`pcf-tab${!isDraft ? ' pcf-tab--active' : ''}`}
          onClick={() => setIsDraft(false)}
        >
          Schedule
        </button>
        <button
          type="button"
          className={`pcf-tab${isDraft ? ' pcf-tab--active' : ''}`}
          onClick={() => setIsDraft(true)}
        >
          Draft
        </button>
      </div>

      <label>
        <span className="label">
          Title <span className="pcf-required" aria-hidden="true">*</span>
        </span>
        <input
          type="text"
          placeholder="e.g. TikTok caption ideas"
          value={title}
          className={titleError ? 'input-error' : ''}
          onChange={(e) => { setTitle(e.target.value); setTitleTouched(true) }}
          onBlur={() => setTitleTouched(true)}
        />
        {titleError && <span className="pcf-error-msg">Title is required</span>}
      </label>

      <textarea
        placeholder="Post text…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {!isDraft && (
        <label className="grow">
          <span className="label">Date &amp; time</span>
          <DateTimePicker value={dtLocal} onChange={setDtLocal} />
        </label>
      )}

      <div className="row platforms">
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

