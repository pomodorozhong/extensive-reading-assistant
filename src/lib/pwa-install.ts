interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export interface PwaInstallSnapshot {
  canPrompt: boolean
  isInstalled: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let installed = detectInstalledState()
const listeners = new Set<() => void>()
let snapshot: PwaInstallSnapshot = { canPrompt: false, isInstalled: installed }

function detectInstalledState(): boolean {
  if (typeof window === 'undefined') return false

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return isStandalone || isIosStandalone
}

function publishSnapshot() {
  installed = installed || detectInstalledState()
  snapshot = { canPrompt: Boolean(deferredPrompt) && !installed, isInstalled: installed }
  listeners.forEach((listener) => listener())
}

function handleBeforeInstallPrompt(event: Event) {
  event.preventDefault()
  if (installed || detectInstalledState()) return

  deferredPrompt = event as BeforeInstallPromptEvent
  publishSnapshot()
}

function handleAppInstalled() {
  installed = true
  deferredPrompt = null
  publishSnapshot()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
}

export function subscribePwaInstall(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getPwaInstallSnapshot() {
  return snapshot
}

export async function promptPwaInstall(): Promise<'accepted' | 'dismissed' | null> {
  const promptEvent = deferredPrompt
  if (!promptEvent) return null

  deferredPrompt = null
  publishSnapshot()
  await promptEvent.prompt()
  return (await promptEvent.userChoice).outcome
}
