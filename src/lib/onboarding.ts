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
    // The outcome is only a record; without storage nothing is lost.
  }
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

/** Opens or closes the guide wherever it is mounted, such as from New Story or Settings. */
export function setOnboardingOpen(next: boolean): void {
  if (open === next) return
  open = next
  listeners.forEach((listener) => listener())
}
