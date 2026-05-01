const ACCOUNTS_PREVIEW_ENABLED_KEY = 'smm-accounts-preview-enabled'

export function isInAppAccountPreviewEnabled(): boolean {
  try {
    const v = localStorage.getItem(ACCOUNTS_PREVIEW_ENABLED_KEY)
    return v === null ? true : v === 'true'
  } catch {
    return true
  }
}

export function setInAppAccountPreviewEnabled(on: boolean): void {
  try {
    localStorage.setItem(ACCOUNTS_PREVIEW_ENABLED_KEY, String(on))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('smm-accounts-preview-change', { detail: on }))
}
