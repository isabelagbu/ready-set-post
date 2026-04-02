export type AppTheme = 'light' | 'dark' | 'system'

export const THEME_STORAGE_KEY = 'smm-theme'
export const ACCENT_STORAGE_KEY = 'smm-accent'

export const ACCENT_PRESETS = [
  { id: 'rose', label: 'Rose', hex: '#c97b92' },
  { id: 'ocean', label: 'Ocean', hex: '#2563eb' },
  { id: 'forest', label: 'Forest', hex: '#059669' },
  { id: 'violet', label: 'Violet', hex: '#7c3aed' },
  { id: 'amber', label: 'Amber', hex: '#d97706' },
  { id: 'slate', label: 'Slate', hex: '#64748b' }
] as const

export type AccentPresetId = (typeof ACCENT_PRESETS)[number]['id']

const ACCENT_IDS = new Set<string>(ACCENT_PRESETS.map((p) => p.id))

export function readStoredTheme(): AppTheme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    /* ignore */
  }
  return 'light'
}

export function readStoredAccent(): AccentPresetId {
  try {
    const t = localStorage.getItem(ACCENT_STORAGE_KEY)
    if (t && ACCENT_IDS.has(t)) return t as AccentPresetId
  } catch {
    /* ignore */
  }
  return 'rose'
}

export function persistTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function persistAccent(accent: AccentPresetId): void {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, accent)
  } catch {
    /* ignore */
  }
}

export function applyThemeToDocument(theme: AppTheme, accent: AccentPresetId): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-accent', accent)
}
