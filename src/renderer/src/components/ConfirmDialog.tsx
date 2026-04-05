import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}): React.ReactElement {
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return createPortal(
    <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-dialog">
        <h2 id="confirm-title" className="confirm-title">{title}</h2>
        <p className="confirm-message muted">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
