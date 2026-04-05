import { useEffect, useRef, useState } from 'react'

const NUM_TABS = 10
const TABS_KEY = 'smm-notepad-tabs-v2'
const ACTIVE_KEY = 'smm-notepad-active'

type TabData = { name: string; text: string }

const TAB_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

function defaultTabs(): TabData[] {
  return Array.from({ length: NUM_TABS }, (_, i) => ({ name: TAB_LABELS[i], text: '' }))
}

function readTabs(): TabData[] {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    if (!raw) return defaultTabs()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length !== NUM_TABS) return defaultTabs()
    return parsed.map((t, i) => ({
      name: typeof t.name === 'string' && t.name.trim() ? t.name : TAB_LABELS[i] ?? String(i + 1),
      text: typeof t.text === 'string' ? t.text : ''
    }))
  } catch {
    return defaultTabs()
  }
}

function readActive(): number {
  try {
    const v = parseInt(localStorage.getItem(ACTIVE_KEY) ?? '0', 10)
    return Number.isFinite(v) && v >= 0 && v < NUM_TABS ? v : 0
  } catch {
    return 0
  }
}

export default function NotesView(): React.ReactElement {
  const [tabs, setTabs] = useState<TabData[]>(readTabs)
  const [active, setActive] = useState<number>(readActive)
  const [editingTab, setEditingTab] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  const renameRef = useRef<HTMLInputElement | null>(null)

  // Persist tabs on change
  useEffect(() => {
    try {
      localStorage.setItem(TABS_KEY, JSON.stringify(tabs))
    } catch { /* ignore */ }
  }, [tabs])

  // Persist active tab
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, String(active))
    } catch { /* ignore */ }
  }, [active])

  // Focus rename input when opened
  useEffect(() => {
    if (editingTab !== null) renameRef.current?.select()
  }, [editingTab])

  function updateText(text: string): void {
    setTabs((prev) => prev.map((t, i) => (i === active ? { ...t, text } : t)))
  }

  function startRename(idx: number): void {
    setEditingTab(idx)
    setEditingName(tabs[idx].name)
  }

  function commitRename(): void {
    if (editingTab === null) return
    const name = editingName.trim() || TAB_LABELS[editingTab] || String(editingTab + 1)
    setTabs((prev) => prev.map((t, i) => (i === editingTab ? { ...t, name } : t)))
    setEditingTab(null)
  }

  async function copyAll(): Promise<void> {
    await window.api.copyText(tabs[active].text)
  }

  function clearPad(): void {
    const t = tabs[active].text
    if (t.trim() !== '' && !window.confirm('Clear this tab?')) return
    setTabs((prev) => prev.map((tab, i) => (i === active ? { ...tab, text: '' } : tab)))
  }

  const currentText = tabs[active]?.text ?? ''

  return (
    <div className="page notepad-page">
      <header className="page-header notepad-header">
        <div>
          <h1>Notepad</h1>
          <p className="sub">Scratch space — saved automatically. Double-click a tab to rename it.</p>
        </div>
        <div className="notepad-actions">
          <button type="button" onClick={copyAll}>
            Copy all
          </button>
          <button type="button" className="ghost" onClick={clearPad}>
            Clear
          </button>
        </div>
      </header>

      {/* Tab bar */}
      <div className="notepad-tabs" role="tablist" aria-label="Notepad tabs">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={active === idx}
            className={`notepad-tab${active === idx ? ' notepad-tab--active' : ''}`}
            onClick={() => { setActive(idx); setEditingTab(null) }}
            onDoubleClick={(e) => { e.stopPropagation(); startRename(idx) }}
            title={`${tab.name} — double-click to rename`}
          >
            {editingTab === idx ? (
              <input
                ref={renameRef}
                className="notepad-tab-rename"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename()
                  if (e.key === 'Escape') setEditingTab(null)
                  e.stopPropagation()
                }}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="notepad-tab-name">{tab.name}</span>
            )}
          </button>
        ))}
      </div>

      <textarea
        className="notepad-editor"
        placeholder="Jot ideas, hooks, hashtags, reminders…"
        value={currentText}
        onChange={(e) => updateText(e.target.value)}
        spellCheck
        aria-label={`${tabs[active]?.name ?? 'Notepad'} scratch notes`}
      />
    </div>
  )
}
