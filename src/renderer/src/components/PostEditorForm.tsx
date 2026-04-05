import { useState } from 'react'
import { useAccounts } from '../accounts/context'
import { ACCOUNT_PLATFORM_LABELS, PLATFORM_META } from '../accounts/types'
import { toDatetimeLocalValue } from '../posts/datetime'
import { PLATFORM_OPTIONS, type Post, type Status } from '../posts/types'
import { playTriplePop } from '../utils/sound'
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
  const { accounts } = useAccounts()

  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() =>
    // Filter out platform names that are now managed via account checkboxes
    post.platforms.filter((p) => {
      const platformKey = ACCOUNT_PLATFORM_LABELS[p]
      if (!platformKey) return true
      return !accounts.some((a) => a.platform === platformKey)
    })
  )
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(post.accountIds)
  const [dtLocal, setDtLocal] = useState(() =>
    post.scheduledAt ? toDatetimeLocalValue(post.scheduledAt) : ''
  )
  const [status, setStatus] = useState<Status>(post.status)
  const [postedUrl, setPostedUrl] = useState(post.postedUrl ?? '')
  const [isDraft, setIsDraft] = useState(post.status === 'draft' && !post.scheduledAt)

  function togglePlatform(p: string): void {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleAccount(id: string): void {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function save(): void {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const accountDerivedPlatforms = [
      ...new Set(
        selectedAccountIds
          .map((id) => accounts.find((a) => a.id === id)?.platform)
          .filter(Boolean)
          .map((p) => PLATFORM_META[p!].label)
      )
    ]
    const allPlatforms = [...new Set([...selectedPlatforms, ...accountDerivedPlatforms])]

    if (isDraft) {
      onSave({
        title: trimmedTitle,
        body: body.trim() || post.body,
        platforms: allPlatforms,
        accountIds: selectedAccountIds,
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
    if (nextStatus === 'posted') playTriplePop()
    onSave({
      title: trimmedTitle,
      body: body.trim() || post.body,
      platforms: allPlatforms,
      accountIds: selectedAccountIds,
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
        <span className="label">Date &amp; time</span>
        <DateTimePicker value={dtLocal} onChange={setDtLocal} />
      </label>

      {/* Draft toggle */}
      <div className="row platforms">
        <label className="chip chip-draft">
          <input
            type="checkbox"
            checked={isDraft}
            onChange={(e) => {
              const on = e.target.checked
              setIsDraft(on)
              if (on) { setDtLocal(''); setStatus('draft') }
            }}
          />
          Draft
        </label>
      </div>

      {/* Platform / account picker — one row per platform */}
      <div className="platform-picker-stack">
        <span className="label">Platforms</span>
        {PLATFORM_OPTIONS.map((p) => {
          const platformKey = ACCOUNT_PLATFORM_LABELS[p]
          const grpAccounts = platformKey ? accounts.filter((a) => a.platform === platformKey) : []
          const meta = platformKey ? PLATFORM_META[platformKey] : null

          return (
            <div key={p} className="platform-picker-row">
              <span
                className="platform-picker-row-label"
                style={meta ? { color: meta.color } : undefined}
              >
                {p}
              </span>
              {grpAccounts.length > 0 ? (
                <div className="platform-picker-row-accounts">
                  {grpAccounts.map((acc) => (
                    <label key={acc.id} className="chip chip--account">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(acc.id)}
                        onChange={() => toggleAccount(acc.id)}
                      />
                      <span className="chip-account-dot" style={{ background: meta!.color }} aria-hidden />
                      {acc.name}
                    </label>
                  ))}
                </div>
              ) : (
                <label className="chip">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                  />
                  Select
                </label>
              )}
            </div>
          )
        })}
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
