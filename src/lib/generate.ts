import type { CefrLevel, Settings } from '../types'

const CEFR_GUIDE: Record<CefrLevel, string> = {
  A1: 'very simple words and short sentences; present tense; everyday topics',
  A2: 'simple connected text; common vocabulary; basic past and future',
  B1: 'clear standard language on familiar topics; some description and dialogue',
  B2: 'fluent narrative with a wider vocabulary; natural dialogue; some nuance',
  C1: 'sophisticated but readable prose; idioms used sparingly and clearly',
  C2: 'near-native style; rich vocabulary still suited to pleasure reading',
}

type GeminiPart = { text?: string }

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] }
    finishReason?: string
  }>
  promptFeedback?: { blockReason?: string }
  error?: { message?: string }
}

export type GenerateResult =
  | { ok: true; title: string; body: string }
  | { ok: false; message: string }

type GeminiTextResult = { ok: true; text: string } | { ok: false; message: string }

async function callGemini(
  settings: Settings,
  options: { system: string; user: string; temperature: number },
): Promise<GeminiTextResult> {
  const url = generateUrl(settings)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': settings.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: options.system }],
        },
        contents: [{ role: 'user', parts: [{ text: options.user }] }],
        generationConfig: { temperature: options.temperature },
      }),
    })
  } catch {
    return {
      ok: false,
      message:
        'The request failed in the browser. Check your network, then confirm the Gemini API key and model in Settings.',
    }
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      message: 'Gemini rejected the key. Check the API key in Settings (Google AI Studio).',
    }
  }

  let data: GeminiResponse
  try {
    data = (await response.json()) as GeminiResponse
  } catch {
    return { ok: false, message: 'Gemini returned a response that could not be read.' }
  }

  if (!response.ok) {
    const detail = data.error?.message || `HTTP ${response.status}`
    return { ok: false, message: `Generation failed: ${detail}` }
  }

  if (data.promptFeedback?.blockReason) {
    return {
      ok: false,
      message: `Gemini blocked the prompt (${data.promptFeedback.blockReason}). Try a different theme.`,
    }
  }

  const content = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? '')
    .join('')
    .trim()

  if (!content) {
    const reason = data.candidates?.[0]?.finishReason
    if (reason && reason !== 'STOP') {
      return { ok: false, message: `Gemini stopped early (${reason}). Try again.` }
    }
    return { ok: false, message: 'Gemini returned an empty response. Try again.' }
  }

  return { ok: true, text: content }
}

export function parseGeneratedStory(raw: string): { title: string; body: string } {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim()
  }

  const titled = text.match(/^(?:#{1,3}\s*|Title:\s*)(.+)\n+([\s\S]*)$/i)
  if (titled) {
    return {
      title: titled[1].trim().replace(/^["']|["']$/g, ''),
      body: titled[2].trim(),
    }
  }

  const newline = text.indexOf('\n')
  if (newline > 0) {
    const firstLine = text.slice(0, newline).trim()
    if (firstLine.length > 0 && firstLine.length < 80) {
      return {
        title: firstLine.replace(/^["']|["']$/g, ''),
        body: text.slice(newline + 1).trim(),
      }
    }
  }

  return { title: 'Untitled story', body: text }
}

function modelPath(model: string): string {
  const trimmed = model.trim().replace(/^models\//, '')
  return trimmed || 'gemini-3.1-flash-lite'
}

function generateUrl(settings: Settings): string {
  const base = settings.apiBaseUrl.replace(/\/$/, '')
  return `${base}/models/${encodeURIComponent(modelPath(settings.model))}:generateContent`
}

export async function generateStory(options: {
  level: CefrLevel
  theme?: string
  settings: Settings
}): Promise<GenerateResult> {
  const { level, theme, settings } = options

  const themeLine = theme?.trim()
    ? `Theme or topic: ${theme.trim()}`
    : 'Choose a pleasant, original theme suitable for extensive reading.'

  const userPrompt = [
    `Write a complete story at CEFR ${level} (${CEFR_GUIDE[level]}).`,
    themeLine,
    'Stay within that vocabulary level so a learner can read for pleasure without looking many words up.',
    'Include a title on the first line.',
    'Fill the story with as much dialogue as possible.',
    'End with THE END.',
    'No preamble, no notes, no word list — only the title and the story.',
  ].join('\n')

  const result = await callGemini(settings, {
    system:
      'You generate level-appropriate stories for extensive reading. Output only the title and the story.',
    user: userPrompt,
    temperature: 0.7,
  })

  if (!result.ok) {
    return result
  }

  return { ok: true, ...parseGeneratedStory(result.text) }
}
