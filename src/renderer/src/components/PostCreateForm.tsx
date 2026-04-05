import { useState } from 'react'
import { useAccounts } from '../accounts/context'
import { ACCOUNT_PLATFORM_LABELS, PLATFORM_META } from '../accounts/types'
import { toDatetimeLocalValue } from '../posts/datetime'
import { PLATFORM_OPTIONS, type Status } from '../posts/types'
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
    accountIds: string[]
    status: Extract<Status, 'draft' | 'scheduled'>
    scheduledAt: string | null
  }) => void
  showTitle?: boolean
  plain?: boolean
}): React.ReactElement {
  const { accounts } = useAccounts()

  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [body, setBody] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [isDraft, setIsDraft] = useState(initialDraft)
  const [dtLocal, setDtLocal] = useState(() =>
    toDatetimeLocalValue(initialDate ?? new Date().toISOString())
  )

  const titleError = titleTouched && !title.trim()

  function togglePlatform(p: string): void {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleAccount(id: string): void {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function save(): void {
    setTitleTouched(true)
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    // Derive platforms from selected account IDs
    const accountDerivedPlatforms = [
      ...new Set(
        selectedAccountIds
          .map((id) => accounts.find((a) => a.id === id)?.platform)
          .filter(Boolean)
          .map((p) => PLATFORM_META[p!].label)
      )
    ]
    const allPlatforms = [...new Set([...selectedPlatforms, ...accountDerivedPlatforms])]

    const text = body.trim()
    if (isDraft) {
      onCreate({
        title: trimmedTitle,
        body: text,
        platforms: allPlatforms,
        accountIds: selectedAccountIds,
        status: 'draft',
        scheduledAt: null
      })
      return
    }
    const dt = dtLocal.trim()
    if (!dt) return
    onCreate({
      title: trimmedTitle,
      body: text,
      platforms: allPlatforms,
      accountIds: selectedAccountIds,
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
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleTouched(true)
          }}
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

      {/* Platform / account picker — one row per platform */}
      <div className="platform-picker-stack">
        <span className="label">
          Platforms
          {accounts.length === 0 && (
            <span className="platform-picker-hint muted">
              — add accounts in Settings to select specific profiles
            </span>
          )}
        </span>
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
