import { useEffect, useState } from 'react'

export default function NotesView(): React.ReactElement {
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let loaded = ''
      try {
        const read = window.api?.readNotes
        if (typeof read === 'function') {
          const t = await read()
          loaded = typeof t === 'string' ? t : ''
        }
      } catch {
        /* missing IPC handler (restart app) or read error */
      } finally {
        if (!cancelled) {
          setText((prev) => (prev === '' ? loaded : prev))
          setReady(true)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const id = setTimeout(() => {
      void window.api.writeNotes(text)
    }, 400)
    return () => clearTimeout(id)
  }, [text, ready])

  async function copyAll(): Promise<void> {
    await window.api.copyText(text)
  }

  function clearPad(): void {
    if (text.trim() !== '' && !window.confirm('Clear the whole notepad?')) return
    setText('')
  }

  return (
    <div className="page notepad-page">
      <header className="page-header notepad-header">
        <div>
          <h1>Notepad</h1>
          <p className="sub">Scratch space — saved automatically on this device.</p>
        </div>
        <div className="notepad-actions">
          <button type="button" onClick={() => copyAll()}>
            Copy all
          </button>
          <button type="button" className="ghost" onClick={clearPad}>
            Clear
          </button>
        </div>
      </header>

      <textarea
        className="notepad-editor"
        placeholder="Jot ideas, hooks, hashtags, reminders…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck
        aria-label="Scratch notes"
        aria-busy={!ready}
      />
    </div>
  )
}
