import type { AccountUrls } from '../App'
import { ACCENT_PRESETS, type AccentPresetId, type AppTheme } from '../theme'

const APPEARANCE: { id: AppTheme; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' }
]

const ACCOUNT_FIELDS: { key: keyof AccountUrls; label: string; placeholder: string; color: string }[] = [
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@yourhandle', color: '#010101' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/yourhandle', color: '#c13584' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@yourchannel', color: '#ff0000' }
]

export default function SettingsView({
  theme,
  accent,
  onThemeChange,
  onAccentChange,
  accountUrls,
  onAccountUrlChange
}: {
  theme: AppTheme
  accent: AccentPresetId
  onThemeChange: (theme: AppTheme) => void
  onAccentChange: (accent: AccentPresetId) => void
  accountUrls: AccountUrls
  onAccountUrlChange: (platform: keyof AccountUrls, url: string) => void
}): React.ReactElement {
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

      <section className="settings-section card" aria-labelledby="settings-accounts-heading">
        <h2 id="settings-accounts-heading" className="settings-section-title">
          Account links
        </h2>
        <p className="muted small settings-section-lead">
          Paste your profile or studio URL for each platform. This is loaded by default in the Accounts tab.
        </p>
        <div className="settings-account-fields">
          {ACCOUNT_FIELDS.map((f) => (
            <label key={f.key} className="settings-account-row">
              <span className="settings-account-label">
                <span
                  className="settings-account-dot"
                  style={{ background: f.color }}
                  aria-hidden
                />
                {f.label}
              </span>
              <input
                type="url"
                inputMode="url"
                placeholder={f.placeholder}
                value={accountUrls[f.key]}
                onChange={(e) => onAccountUrlChange(f.key, e.target.value)}
                spellCheck={false}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
