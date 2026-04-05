import { useState } from 'react'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAccounts } from '../accounts/context'
import { PLATFORM_META, PLATFORMS, type Platform } from '../accounts/types'
import { ACCENT_PRESETS, type AccentPresetId, type AppTheme } from '../theme'
import { isSoundEnabled, setSoundEnabled } from '../utils/sound'

const APPEARANCE: { id: AppTheme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' }
]

export default function SettingsView({
  theme,
  accent,
  onThemeChange,
  onAccentChange
}: {
  theme: AppTheme
  accent: AccentPresetId
  onThemeChange: (theme: AppTheme) => void
  onAccentChange: (accent: AccentPresetId) => void
}): React.ReactElement {
  const { accounts, addAccount, updateAccount, removeAccount } = useAccounts()
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled())

  function toggleSound(): void {
    const next = !soundOn
    setSoundOn(next)
    setSoundEnabled(next)
  }

  const [addingFor, setAddingFor] = useState<Platform | null>(null)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')

  function openAdd(platform: Platform): void {
    setAddingFor(platform)
    setNewName('')
    setNewUrl('')
    setEditingId(null)
  }

  function submitAdd(): void {
    if (!addingFor || !newName.trim()) return
    addAccount(
      addingFor,
      newName.trim(),
      newUrl.trim() || PLATFORM_META[addingFor].defaultUrl
    )
    setAddingFor(null)
    setNewName('')
    setNewUrl('')
  }

  function openEdit(id: string, name: string, url: string): void {
    setEditingId(id)
    setEditName(name)
    setEditUrl(url)
    setAddingFor(null)
  }

  function submitEdit(): void {
    if (!editingId) return
    updateAccount(editingId, { name: editName.trim(), url: editUrl.trim() })
    setEditingId(null)
  }

  return (
    <div className="page settings-page">
      <header className="page-header">
        <h1>Settings</h1>
        <p className="sub">Appearance and app preferences.</p>
      </header>

      <section className="settings-section card" aria-labelledby="settings-accent-heading">
        <h2 id="settings-accent-heading" className="settings-section-title">
          Primary color
        </h2>
        <p className="muted small settings-section-lead">
          Tap a circle to choose the accent used for buttons, highlights, and focus.
        </p>
        <div className="accent-picker" role="group" aria-label="Primary color">
          {ACCENT_PRESETS.map((p) => {
            const selected = accent === p.id
            return (
              <button
                key={p.id}
                type="button"
                className={`accent-circle${selected ? ' selected' : ''}`}
                style={{ backgroundColor: p.hex }}
                onClick={() => onAccentChange(p.id)}
                aria-pressed={selected}
                aria-label={p.label}
                title={p.label}
              />
            )
          })}
        </div>
        <p className="accent-picker-caption muted small">
          {ACCENT_PRESETS.find((p) => p.id === accent)?.label ?? accent}
        </p>
      </section>

      <section className="settings-section card settings-section--compact" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="settings-section-title">
          Appearance
        </h2>
        <p className="muted small settings-section-lead">
          Light, dark, or match your device.
        </p>
        <div className="appearance-toggle" role="group" aria-label="Color mode">
          {APPEARANCE.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`appearance-pill${theme === opt.id ? ' active' : ''}`}
              onClick={() => onThemeChange(opt.id)}
              aria-pressed={theme === opt.id}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section card settings-section--compact" aria-labelledby="settings-sound-heading">
        <h2 id="settings-sound-heading" className="settings-section-title">
          Sound
        </h2>
        <p className="muted small settings-section-lead">
          Play a pop sound on clicks and navigation.
        </p>
        <label className="settings-toggle-row">
          <span className="settings-toggle-label">Click sounds</span>
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            className={`settings-toggle${soundOn ? ' settings-toggle--on' : ''}`}
            onClick={toggleSound}
            aria-label="Toggle click sounds"
          >
            <span className="settings-toggle-thumb" />
          </button>
        </label>
      </section>

      <section className="settings-section card" aria-labelledby="settings-accounts-heading">
        <h2 id="settings-accounts-heading" className="settings-section-title">
          Accounts
        </h2>
        <p className="muted small settings-section-lead">
          Add multiple accounts per platform. Each account gets its own browser tab in the Accounts view.
        </p>

        {PLATFORMS.map((platform) => {
          const meta = PLATFORM_META[platform]
          const platformAccounts = accounts.filter((a) => a.platform === platform)
          const isAdding = addingFor === platform

          return (
            <div key={platform} className="settings-platform-group">
              <div className="settings-platform-header">
                <span
                  className="settings-account-dot"
                  style={{ background: meta.color }}
                  aria-hidden
                />
                <span className="settings-platform-label">{meta.label}</span>
                <button
                  type="button"
                  className="settings-add-btn"
                  onClick={() => openAdd(platform)}
                  aria-label={`Add ${meta.label} account`}
                >
                  + Add account
                </button>
              </div>

              {platformAccounts.length > 0 && (
                <ul className="settings-account-list">
                  {platformAccounts.map((acc) => (
                    <li key={acc.id} className="settings-account-item">
                      {editingId === acc.id ? (
                        <div className="settings-account-edit-form">
                          <input
                            type="text"
                            placeholder="Handle (e.g. @mypage)"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                          />
                          <input
                            type="url"
                            placeholder={meta.defaultUrl}
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                          />
                          <div className="settings-account-edit-actions">
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={submitEdit}
                              disabled={!editName.trim()}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => setEditingId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="settings-account-name">{acc.name}</span>
                          <span className="settings-account-url muted small">{acc.url || meta.defaultUrl}</span>
                          <div className="settings-account-actions">
                            <button
                              type="button"
                              className="settings-account-btn"
                              onClick={() => openEdit(acc.id, acc.name, acc.url)}
                              aria-label={`Edit ${acc.name}`}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="settings-account-btn settings-account-btn--danger"
                              onClick={() => setConfirmRemoveId(acc.id)}
                              aria-label={`Remove ${acc.name}`}
                            >
                              Remove
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isAdding && (
                <div className="settings-account-add-form">
                  <input
                    type="text"
                    placeholder="Handle (e.g. @mypage)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                  />
                  <input
                    type="url"
                    placeholder={meta.defaultUrl}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
                  />
                  <div className="settings-account-add-actions">
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={submitAdd}
                      disabled={!newName.trim()}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setAddingFor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {platformAccounts.length === 0 && !isAdding && (
                <p className="settings-platform-empty muted small">No accounts added yet.</p>
              )}
            </div>
          )
        })}
      </section>

      <footer className="settings-footer">
        Designed &amp; developed by Isabel Agbu
      </footer>

      {confirmRemoveId && (() => {
        const acc = accounts.find((a) => a.id === confirmRemoveId)
        return (
          <ConfirmDialog
            title="Remove account?"
            message={acc ? `"${acc.name}" will be removed from the app.` : 'This account will be removed.'}
            confirmLabel="Remove"
            onConfirm={() => { removeAccount(confirmRemoveId); setConfirmRemoveId(null) }}
            onCancel={() => setConfirmRemoveId(null)}
          />
        )
      })()}
    </div>
  )
}
