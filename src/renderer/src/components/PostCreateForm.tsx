import { useState } from 'react'
import { useAccounts } from '../accounts/context'
import { ACCOUNT_PLATFORM_LABELS, PLATFORM_META } from '../accounts/types'
import { scheduledAtFromParts, toDateInputValue, toTimeInputValue } from '../posts/datetime'
import { type Status } from '../posts/types'
import { useEnabledPlatformFormLabels } from '../hooks/useEnabledPlatformFormLabels'
import ScheduleDateTimeFields from './ScheduleDateTimeFields'
import PlatformLogoImg from './PlatformLogoImg'

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
    status: Status
    scheduledAt: string | null
    postedUrl: string | null
  }) => void
  showTitle?: boolean
  plain?: boolean
}): React.ReactElement {
  const { accounts } = useAccounts()
  const formPlatformLabels = useEnabledPlatformFormLabels()

  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [body, setBody] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [mode, setMode] = useState<'draft' | 'schedule' | 'posted'>(() => (initialDraft ? 'draft' : 'schedule'))
  const [dateStr, setDateStr] = useState(() =>
    toDateInputValue(initialDate ?? new Date().toISOString())
  )
  const [timeStr, setTimeStr] = useState(() =>
    toTimeInputValue(initialDate ?? new Date().toISOString())
  )
  const [noTime, setNoTime] = useState(false)
  const [scheduleDateTouched, setScheduleDateTouched] = useState(false)
  const [postedUrlDraft, setPostedUrlDraft] = useState('')

  const titleError = titleTouched && !title.trim()
  const scheduleDateError = scheduleDateTouched && mode === 'schedule' && !dateStr.trim()

  function togglePlatform(p: string): void {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function toggleAccount(id: string): void {
    setSelectedAccountIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function save(): void {
    setTitleTouched(true)
    if (mode === 'schedule') setScheduleDateTouched(true)
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
    if (mode === 'draft') {
      onCreate({
        title: trimmedTitle,
        body: text,
        platforms: allPlatforms,
        accountIds: selectedAccountIds,
        status: 'draft',
        scheduledAt: null,
        postedUrl: null
      })
      return
    }
    if (mode === 'posted') {
      const url = postedUrlDraft.trim()
      onCreate({
        title: trimmedTitle,
        body: text,
        platforms: allPlatforms,
        accountIds: selectedAccountIds,
        status: 'posted',
        scheduledAt: null,
        postedUrl: url.length > 0 ? url : null
      })
      return
    }
    if (!dateStr.trim()) return
    const at = scheduledAtFromParts(dateStr, noTime ? '' : timeStr)
    if (!at) return
    onCreate({
      title: trimmedTitle,
      body: text,
      platforms: allPlatforms,
      accountIds: selectedAccountIds,
      status: 'scheduled',
      scheduledAt: at,
      postedUrl: null
    })
  }

  return (
    <div className={`${plain ? '' : 'card '}${'composer post-create-form'}`}>
      {showTitle && (
        <h2 className="filter-panel-title" style={{ margin: '0 0 10px' }}>
          Create new
        </h2>
      )}

      {/* Draft / Schedule / Already posted */}
      <div className="pcf-tabs" role="tablist" aria-label="New post type">
        <button
          type="button"
          role="tab"
          className={`pcf-tab${mode === 'schedule' ? ' pcf-tab--active' : ''}`}
          onClick={() => setMode('schedule')}
        >
          Schedule
        </button>
        <button
          type="button"
          role="tab"
          className={`pcf-tab${mode === 'draft' ? ' pcf-tab--active' : ''}`}
          onClick={() => setMode('draft')}
        >
          Draft
        </button>
        <button
          type="button"
          role="tab"
          className={`pcf-tab${mode === 'posted' ? ' pcf-tab--active' : ''}`}
          onClick={() => setMode('posted')}
        >
          Posted
        </button>
      </div>
      {mode === 'posted' && (
        <p className="pcf-hint muted small" style={{ margin: '-4px 0 12px' }}>
          Log something you have already published — add a link if you have one.
        </p>
      )}

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

      <label className="pcf-body-field">
        <span className="label">Body / notes</span>
        <textarea
          placeholder="Post text…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      {mode === 'schedule' && (
        <div className="grow">
          <span className="label" style={{ display: 'block', marginBottom: 6 }}>
            When
          </span>
          <ScheduleDateTimeFields
            idPrefix="pcf"
            dateValue={dateStr}
            timeValue={timeStr}
            onDateChange={setDateStr}
            onTimeChange={setTimeStr}
            noTime={noTime}
            onNoTimeChange={(v) => {
              setNoTime(v)
              if (v) setTimeStr('')
            }}
            showDateError={scheduleDateError}
          />
        </div>
      )}

      {mode === 'posted' && (
        <label>
          <span className="label">Link to live post (optional)</span>
          <input
            type="url"
            inputMode="url"
            placeholder="https://…"
            value={postedUrlDraft}
            onChange={(e) => setPostedUrlDraft(e.target.value)}
            autoComplete="off"
          />
        </label>
      )}

      {/* Platform / account picker — one row per platform */}
      <div className="platform-picker-stack">
        <span className="label">
          Platforms
          <span className="platform-picker-hint muted">
            — toggle active platforms in Settings
          </span>
        </span>
        {formPlatformLabels.map((p) => {
          const platformKey = ACCOUNT_PLATFORM_LABELS[p]
          const grpAccounts = platformKey ? accounts.filter((a) => a.platform === platformKey) : []
          const meta = platformKey ? PLATFORM_META[platformKey] : null

          return (
            <div key={p} className="platform-picker-row">
              <span className="platform-picker-row-label">
                {platformKey && <PlatformLogoImg platform={platformKey} size={20} />}
                <span className="platform-picker-row-name">{p}</span>
              </span>
              {grpAccounts.length > 0 ? (
                <div className="platform-picker-row-accounts">
                  {grpAccounts.map((acc) => (
                    <label key={acc.id} className="chip chip--account">
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(acc.id)}
                        onChange={() => toggleAccount(acc.id)}
                        aria-label={`${p}: ${acc.name}`}
                      />
                      <span className="chip-account-dot" style={{ background: meta!.color }} aria-hidden />
                      {acc.name}
                    </label>
                  ))}
                </div>
              ) : (
                <label className="chip chip--platform-solo">
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(p)}
                    onChange={() => togglePlatform(p)}
                    aria-label={`Include ${p}`}
                  />
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
