import { loadStories } from './storage.ts'

const ONBOARDING_KEY = 'era.v1.onboarding'

export type OnboardingOutcome = 'completed' | 'skipped'

export function loadOnboardingOutcome(): OnboardingOutcome | null {
  try {
    const value = localStorage.getItem(ONBOARDING_KEY)
    return value === 'completed' || value === 'skipped' ? value : null
  } catch {
    return null
  }
}

/** Writes only the onboarding entry; stories, words, and settings are left alone. */
export function saveOnboardingOutcome(outcome: OnboardingOutcome): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, outcome)
  } catch {
    // Without storage the introduction is offered again next time, which is harmless.
  }
}

/** First use means no recorded outcome and no saved stories, so existing readers are not interrupted. */
export function shouldOfferOnboarding(): boolean {
  return loadOnboardingOutcome() === null && loadStories().length === 0
}

let open = false
const listeners = new Set<() => void>()

export function subscribeOnboarding(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function isOnboardingOpen(): boolean {
  return open
}

/** Opens or closes the introduction wherever it is mounted, such as from Settings. */
export function setOnboardingOpen(next: boolean): void {
  if (open === next) return
  open = next
  listeners.forEach((listener) => listener())
}
