import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  value: string // "YYYY-MM-DDTHH:MM" or ""
  onChange: (value: string) => void
  disabled?: boolean
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function pad(n: number): string { return String(n).padStart(2, '0') }

function parseLocal(value: string): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

function buildGrid(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const cells: { day: number; offset: -1 | 0 | 1 }[] = []
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, offset: -1 })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, offset: 0 })
  const trail = 42 - cells.length
  for (let d = 1; d <= trail; d++) cells.push({ day: d, offset: 1 })
  return cells
}

function formatDisplay(value: string): string {
  const d = parseLocal(value)
  if (!d) return 'Select date & time'
  return d.toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })
}

export default function DateTimePicker({ value, onChange, disabled = false }: Props): React.ReactElement {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hourColRef = useRef<HTMLDivElement>(null)
  const minColRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, minWidth: 380 })

  const now = new Date()
  const parsed = parseLocal(value)

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth())
  const [selYear, setSelYear] = useState<number | null>(parsed?.getFullYear() ?? null)
  const [selMonth, setSelMonth] = useState<number | null>(parsed?.getMonth() ?? null)
  const [selDay, setSelDay] = useState<number | null>(parsed?.getDate() ?? null)
  const [hour24, setHour24] = useState(parsed?.getHours() ?? 12)
  const [minute, setMinute] = useState(
    parsed ? Math.floor(parsed.getMinutes() / 5) * 5 : 0
  )

  // Sync from external value changes
  useEffect(() => {
    const d = parseLocal(value)
    if (d) {
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      setSelYear(d.getFullYear())
      setSelMonth(d.getMonth())
      setSelDay(d.getDate())
      setHour24(d.getHours())
      setMinute(Math.floor(d.getMinutes() / 5) * 5)
    } else {
      setSelYear(null); setSelMonth(null); setSelDay(null)
    }
  }, [value])

  // Scroll time columns to selected items when opening
  useEffect(() => {
    if (!open) return
    const h12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    requestAnimationFrame(() => {
      if (hourColRef.current) {
        const idx = HOURS.indexOf(h12)
        const el = hourColRef.current.children[idx] as HTMLElement
        el?.scrollIntoView({ block: 'nearest' })
      }
      if (minColRef.current) {
        const idx = MINUTES.indexOf(minute)
        const el = minColRef.current.children[idx] as HTMLElement
        el?.scrollIntoView({ block: 'nearest' })
      }
    })
  }, [open])

  function calcPos() {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const popH = 270
    const spaceBelow = window.innerHeight - rect.bottom
    const top = spaceBelow >= popH ? rect.bottom + 4 : rect.top - popH - 4
    setPos({ top, left: rect.left, minWidth: 0 })
  }

  function openPicker() {
    if (disabled) return
    calcPos()
    setOpen(true)
  }

  // Reposition on window resize / scroll while open
  useEffect(() => {
    if (!open) return
    window.addEventListener('resize', calcPos)
    window.addEventListener('scroll', calcPos, true)
    return () => {
      window.removeEventListener('resize', calcPos)
      window.removeEventListener('scroll', calcPos, true)
    }
  }, [open])

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return
    function onMouse(e: MouseEvent) {
      if (
        !popoverRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function emit(y: number, mo: number, d: number, h: number, m: number) {
    onChange(`${y}-${pad(mo + 1)}-${pad(d)}T${pad(h)}:${pad(m)}`)
  }

  function pickDay(day: number, offset: -1 | 0 | 1) {
    let y = viewYear, mo = viewMonth
    if (offset === -1) { mo--; if (mo < 0) { mo = 11; y-- } }
    if (offset === 1) { mo++; if (mo > 11) { mo = 0; y++ } }
    setSelYear(y); setSelMonth(mo); setSelDay(day)
    setViewYear(y); setViewMonth(mo)
    emit(y, mo, day, hour24, minute)
  }

  function pickHour(h12: number) {
    const ampm: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM'
    const h24 = ampm === 'AM' ? (h12 === 12 ? 0 : h12) : (h12 === 12 ? 12 : h12 + 12)
    setHour24(h24)
    if (selYear != null && selMonth != null && selDay != null) emit(selYear, selMonth, selDay, h24, minute)
  }

  function pickMinute(m: number) {
    setMinute(m)
    if (selYear != null && selMonth != null && selDay != null) emit(selYear, selMonth, selDay, hour24, m)
  }

  function pickAmPm(p: 'AM' | 'PM') {
    const ampm: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM'
    if (p === ampm) return
    const h24 = p === 'AM' ? hour24 - 12 : hour24 + 12
    setHour24(h24)
    if (selYear != null && selMonth != null && selDay != null) emit(selYear, selMonth, selDay, h24, minute)
  }

  function goToday() {
    const n = new Date()
    const h24 = n.getHours()
    const m = Math.floor(n.getMinutes() / 5) * 5
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth())
    setSelYear(n.getFullYear()); setSelMonth(n.getMonth()); setSelDay(n.getDate())
    setHour24(h24); setMinute(m)
    emit(n.getFullYear(), n.getMonth(), n.getDate(), h24, m)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const grid = buildGrid(viewYear, viewMonth)
  const ampm: 'AM' | 'PM' = hour24 < 12 ? 'AM' : 'PM'
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
  const todayY = now.getFullYear(), todayMo = now.getMonth(), todayD = now.getDate()

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={`dtp-trigger${disabled ? ' dtp-trigger--disabled' : ''}`}
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="dtp-display-text">{formatDisplay(value)}</span>
        <svg className="dtp-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          className="dtp-popover"
          role="dialog"
          aria-modal="true"
          style={{ top: pos.top, left: pos.left }}
        >
          <div className="dtp-body">
            {/* ── Calendar ── */}
            <div className="dtp-cal">
              <div className="dtp-cal-nav">
                <button type="button" className="dtp-nav-btn" onClick={prevMonth}>‹</button>
                <span className="dtp-cal-title">{MONTH_NAMES[viewMonth]} {viewYear}</span>
                <button type="button" className="dtp-nav-btn" onClick={nextMonth}>›</button>
              </div>
              <div className="dtp-weekdays">
                {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
              </div>
              <div className="dtp-grid">
                {grid.map((cell, i) => {
                  const isSel = cell.offset === 0 && cell.day === selDay && viewYear === selYear && viewMonth === selMonth
                  const isToday = cell.offset === 0 && cell.day === todayD && viewYear === todayY && viewMonth === todayMo
                  return (
                    <button
                      key={i}
                      type="button"
                      className={[
                        'dtp-day',
                        cell.offset !== 0 ? 'dtp-day--other' : '',
                        isSel ? 'dtp-day--sel' : '',
                        isToday && !isSel ? 'dtp-day--today' : ''
                      ].join(' ').trim()}
                      onClick={() => pickDay(cell.day, cell.offset)}
                    >
                      {cell.day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="dtp-divider" />

            {/* ── Time ── */}
            <div className="dtp-time">
              <div className="dtp-time-col" ref={hourColRef}>
                {HOURS.map(h => (
                  <button key={h} type="button" className={`dtp-time-btn${h === hour12 ? ' dtp-time-btn--sel' : ''}`} onClick={() => pickHour(h)}>
                    {pad(h)}
                  </button>
                ))}
              </div>
              <div className="dtp-time-col" ref={minColRef}>
                {MINUTES.map(m => (
                  <button key={m} type="button" className={`dtp-time-btn${m === minute ? ' dtp-time-btn--sel' : ''}`} onClick={() => pickMinute(m)}>
                    {pad(m)}
                  </button>
                ))}
              </div>
              <div className="dtp-time-col dtp-time-col--ampm">
                {(['AM', 'PM'] as const).map(p => (
                  <button key={p} type="button" className={`dtp-time-btn${p === ampm ? ' dtp-time-btn--sel' : ''}`} onClick={() => pickAmPm(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="dtp-footer">
            <button type="button" className="dtp-footer-btn" onClick={() => { onChange(''); setOpen(false) }}>Clear</button>
            <button type="button" className="dtp-footer-btn" onClick={goToday}>Today</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
