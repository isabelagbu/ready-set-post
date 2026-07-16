/**
 * Applied before other app modules (import this first in main.tsx).
 * Replaces the previous inline index.html script so CSP can use script-src 'self' only.
 */
const ACCENTS: Record<string, 1> = {
  rose: 1,
  ocean: 1,
  forest: 1,
  violet: 1,
  amber: 1,
  slate: 1
}

const root = document.documentElement
try {
  const t = localStorage.getItem('smm-theme')
  if (t === 'light' || t === 'dark' || t === 'system') {
    root.setAttribute('data-theme', t)
  } else {
    root.setAttribute('data-theme', 'light')
  }
  const a = localStorage.getItem('smm-accent')
  if (a && ACCENTS[a]) root.setAttribute('data-accent', a)
  else root.setAttribute('data-accent', 'rose')
} catch {
  root.setAttribute('data-theme', 'light')
  root.setAttribute('data-accent', 'rose')
}
