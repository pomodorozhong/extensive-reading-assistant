export const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

export type GeminiEndpointCheck = { ok: true; base: string } | { ok: false; message: string }

/**
 * Decide whether a configured base URL may receive the Gemini API key.
 * Only Google's HTTPS endpoint qualifies; development builds also allow loopback
 * hosts so the local fixture (`npm run dev:gemini-fixture`) keeps working.
 */
export function checkGeminiEndpoint(value: string, allowLoopback: boolean): GeminiEndpointCheck {
  const base = value.trim().replace(/\/+$/, '')
  if (base === GEMINI_API_BASE_URL) return { ok: true, base }

  let url: URL | undefined
  try {
    url = new URL(base)
  } catch {
    url = undefined
  }
  if (
    allowLoopback &&
    url &&
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    LOOPBACK_HOSTS.has(url.hostname) &&
    !url.username &&
    !url.password &&
    !url.search &&
    !url.hash
  ) {
    return { ok: true, base }
  }

  return {
    ok: false,
    message: `For your key’s safety, Gemini requests are sent only to ${GEMINI_API_BASE_URL}.`,
  }
}

/** Loopback endpoints are a development aid only; production builds never allow them. */
export function allowsLoopbackEndpoint(): boolean {
  return import.meta.env?.DEV === true
}
