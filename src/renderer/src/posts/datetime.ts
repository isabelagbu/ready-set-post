export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Readable date for schedule UI — matches list views (e.g. day panel: long weekday, long month).
 * `ymd` must be `YYYY-MM-DD` in local terms.
 */
export function formatScheduleDateLabel(ymd: string): string {
  const t = ymd?.trim() ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return ''
  const [y, mo, d] = t.split('-').map(Number)
  if (!y || !mo || !d) return ''
  const local = new Date(y, mo - 1, d)
  if (Number.isNaN(local.getTime())) return ''
  return local.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** `YYYY-MM-DD` in local calendar, for `<input type="date" />`. */
export function toDateInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** `HH:MM` in local time, for `<input type="time" />`. */
export function toTimeInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

/**
 * Optional time defaults to local midnight.
 * Returns `null` if the date part is missing or invalid.
 */
export function scheduledAtFromParts(dateYmd: string, timeHm: string | undefined | null): string | null {
  const trimmed = dateYmd?.trim() ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  const [y, mo, d] = trimmed.split('-').map(Number)
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  let hh = 0
  let mm = 0
  const t = (timeHm ?? '').trim()
  if (t) {
    const parts = t.split(':')
    const h = parseInt(parts[0] ?? '', 10)
    const m = parseInt(parts[1] ?? '0', 10)
    if (Number.isFinite(h)) hh = Math.min(23, Math.max(0, h))
    if (Number.isFinite(m)) mm = Math.min(59, Math.max(0, m))
  }
  const local = new Date(y, mo - 1, d, hh, mm, 0, 0)
  if (Number.isNaN(local.getTime())) return null
  return local.toISOString()
}
