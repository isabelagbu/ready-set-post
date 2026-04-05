import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { AccountsProvider } from './accounts/context'
import { playPop } from './utils/sound'
import './main.css'

// Global click sound — fires for buttons/interactive elements but not nav (nav uses 'nav' variant)
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement
  const el = target.closest('button, [role="button"], label')
  if (!el) return
  if (el.closest('.nav-item')) return      // nav uses its own sound
  if (el.hasAttribute('data-silent')) return // element plays its own sound
  playPop()
}, { capture: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountsProvider>
      <App />
    </AccountsProvider>
  </StrictMode>
)
