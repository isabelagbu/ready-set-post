import { PLATFORM_OPTIONS } from '../posts/types'

const KEY = 'smm-platforms-form-enabled'

export const ENABLED_PLATFORMS_EVENT = 'smm-enabled-platforms-change'

function isValidLabel(s: string): s is (typeof PLATFORM_OPTIONS)[number] {
  return (PLATFORM_OPTIONS as readonly string[]).includes(s)
}

/** Labels shown in post create/edit and Content filters (order preserved from PLATFORM_OPTIONS). */
export function getEnabledPlatformFormLabels(): (typeof PLATFORM_OPTIONS)[number][] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw == null) return [...PLATFORM_OPTIONS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0) return [...PLATFORM_OPTIONS]
    const next: (typeof PLATFORM_OPTIONS)[number][] = []
    for (const p of parsed) {
      if (typeof p === 'string' && isValidLabel(p)) next.push(p)
    }
    return next.length > 0 ? next : [...PLATFORM_OPTIONS]
  } catch {
    return [...PLATFORM_OPTIONS]
  }
}

export function setEnabledPlatformFormLabels(
  labels: readonly (typeof PLATFORM_OPTIONS)[number][]
): void {
  const allowed = new Set(PLATFORM_OPTIONS as readonly string[])
  const dedup: (typeof PLATFORM_OPTIONS)[number][] = []
  for (const l of labels) {
    if (allowed.has(l) && !dedup.includes(l)) dedup.push(l)
  }
  const toStore = dedup.length > 0 ? dedup : [...PLATFORM_OPTIONS]
  try {
    localStorage.setItem(KEY, JSON.stringify(toStore))
  } catch { /* ignore */ }
  window.dispatchEvent(new Event(ENABLED_PLATFORMS_EVENT))
}

export function isPlatformFormEnabled(label: (typeof PLATFORM_OPTIONS)[number]): boolean {
  return getEnabledPlatformFormLabels().includes(label)
}
