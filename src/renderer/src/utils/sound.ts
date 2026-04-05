import popSrc from '../assets/pop.mp3'
import triplePopSrc from '../assets/triple-pop.mp3'

const SOUND_KEY = 'smm-sound-enabled'

export function isSoundEnabled(): boolean {
  try { return localStorage.getItem(SOUND_KEY) !== '0' } catch { return true }
}

export function setSoundEnabled(on: boolean): void {
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch {}
}

function play(src: string, volume = 0.6): void {
  if (!isSoundEnabled()) return
  try {
    const audio = new Audio(src)
    audio.volume = volume
    audio.play().catch(() => {})
  } catch {
    // Audio unavailable — silently skip
  }
}

export function playPop(): void {
  play(popSrc)
}

export function playTriplePop(): void {
  play(triplePopSrc)
}
