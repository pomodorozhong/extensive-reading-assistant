import { useEffect, useState } from 'react'

const TYPE_MS = 60
const HOLD_MS = 1800
const GAP_MS = 300

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/**
 * A placeholder that types out each phrase in turn while `active`, or the static fallback when
 * inactive and for readers who prefer reduced motion.
 */
export function useTypingPlaceholder(phrases: readonly string[], fallback: string, active: boolean): string {
  const [typed, setTyped] = useState('')
  const animate = active && phrases.length > 0 && !prefersReducedMotion()

  useEffect(() => {
    if (!animate) return
    let phrase = 0
    let length = 0
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      const current = phrases[phrase]
      if (length < current.length) {
        length += 1
        setTyped(current.slice(0, length))
        timer = setTimeout(step, length === current.length ? HOLD_MS : TYPE_MS)
      } else {
        phrase = (phrase + 1) % phrases.length
        length = 0
        setTyped('')
        timer = setTimeout(step, GAP_MS)
      }
    }
    timer = setTimeout(step, GAP_MS)
    return () => clearTimeout(timer)
  }, [phrases, animate])

  return animate ? typed : fallback
}
