import { useState } from 'react'
import { createPortal } from 'react-dom'
import BrandLogo from './BrandLogo'

const ONBOARDING_KEY = 'smm-onboarded'

export function hasSeenOnboarding(): boolean {
  try { return localStorage.getItem(ONBOARDING_KEY) === '1' } catch { return false }
}

function markOnboarded(): void {
  try { localStorage.setItem(ONBOARDING_KEY, '1') } catch {}
}

const STEPS = [
  {
    icon: <BrandLogo size={80} />,
    title: 'Welcome to Ready Set Post!',
    body: 'Your personal desktop studio for planning, scheduling, and managing social media content — all in one place, offline.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: 'Create & schedule posts',
    body: 'Hit the + button in Content or Calendar to write a post. Set a date to schedule it, or save as a draft to finish later.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: 'Drag to reschedule',
    body: 'The Calendar shows all your posts by date. Drag any post card onto a new day to reschedule it instantly — no editing required.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Your dashboard, your way',
    body: 'Upload a cover photo for your dashboard and double-click the greeting to make it yours. Stats, upcoming posts, and recent work are always at a glance.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <path d="M6 1v3M10 1v3M14 1v3" />
      </svg>
    ),
    title: 'Never miss a post',
    body: 'Enable Reminders in Settings and you\'ll get a system notification the moment a scheduled post is due. Test it with the button in Settings to make sure it works.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    title: 'Add your accounts',
    body: 'Go to Settings → Accounts to add your TikTok, Instagram, Threads, YouTube, LinkedIn, and X profiles. Each one gets its own live browser tab in the Accounts view.'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="52" height="52">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    title: 'Scripts, notes & sticky ideas',
    body: 'Click any post to keep all production notes in one big notes field. Use the Notepad\'s 10 tabs for free-form notes, and spawn colour-coded sticky notes for quick ideas.'
  }
]

export default function OnboardingModal({ onDone }: { onDone: () => void }): React.ReactElement {
  const [step, setStep] = useState(0)
  const isLast = step === STEPS.length - 1

  function finish(): void {
    markOnboarded()
    onDone()
  }

  const current = STEPS[step]

  return createPortal(
    <div className="onboarding-backdrop">
      <div className="onboarding-card" role="dialog" aria-modal="true" aria-label="Welcome to Ready Set Post!">

        {/* Progress dots */}
        <div className="onboarding-dots" aria-hidden>
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot${i === step ? ' onboarding-dot--active' : ''}`} />
          ))}
        </div>

        {/* Content */}
        <div className="onboarding-body">
          <div className="onboarding-icon" aria-hidden>{current.icon}</div>
          <h2 className="onboarding-title">{current.title}</h2>
          <p className="onboarding-text muted">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          {step > 0 ? (
            <button type="button" className="ghost" onClick={() => setStep(s => s - 1)}>
              Back
            </button>
          ) : (
            <button type="button" className="ghost" onClick={finish}>
              Skip
            </button>
          )}

          <button
            type="button"
            className="primary"
            onClick={isLast ? finish : () => setStep(s => s + 1)}
          >
            {isLast ? "Let's go!" : 'Next'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
