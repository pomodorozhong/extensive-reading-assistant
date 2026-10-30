import type { CefrLevel, PointOfView, ReadingMinutes, Settings, Story, StoryGeneration, TextType, Tone } from '../types.ts'
import { allowsLoopbackEndpoint, checkGeminiEndpoint } from './gemini-endpoint.ts'
import {
  allowsPointOfView,
  cleanTextType,
  READING_LENGTHS,
  TEXT_TYPE_INFO,
  usesPlainWordsForInventions,
  type GenerationChoices,
  type GenerationModel,
} from './generation-options.ts'

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
  | { ok: true; title: string; body: string; generation: StoryGeneration }
  | { ok: false; message: string; canceled?: true }

type GeminiTextResult = { ok: true; text: string } | { ok: false; message: string; canceled?: true }

const CANCELED: GeminiTextResult = { ok: false, message: 'Story generation was canceled.', canceled: true }

async function callGemini(
  settings: Settings,
  options: { system: string; user: string; temperature: number; model: GenerationModel; signal?: AbortSignal },
): Promise<GeminiTextResult> {
  // Check the destination before the key is attached to any request.
  const endpoint = checkGeminiEndpoint(settings.apiBaseUrl, allowsLoopbackEndpoint())
  if (!endpoint.ok) return { ok: false, message: `${endpoint.message} Update the API base URL in Settings.` }
  const url = `${endpoint.base}/models/${encodeURIComponent(options.model)}:generateContent`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      // A redirect could forward the key elsewhere, so treat it as a failure.
      redirect: 'error',
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
      signal: options.signal,
    })
  } catch {
    if (options.signal?.aborted) return CANCELED
    return {
      ok: false,
      message:
        'Could not reach Gemini. Story generation requires an internet connection; check your network and API settings.',
    }
  }

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      message: 'Gemini rejected the key. Check the API key in Settings (Google AI Studio).',
    }
  }

  if (response.status === 429) {
    return {
      ok: false,
      message: 'Gemini is receiving too many requests for this key (rate limit). Wait a minute, then try again.',
    }
  }

  let data: GeminiResponse
  try {
    data = (await response.json()) as GeminiResponse
  } catch {
    if (options.signal?.aborted) return CANCELED
    return { ok: false, message: 'Gemini returned a response that could not be read.' }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, message: 'Gemini returned a response that could not be read.' }
  }

  if (!response.ok) {
    const detail = data.error?.message || `HTTP ${response.status}`
    return { ok: false, message: `Generation failed: ${detail}` }
  }

  if (data.promptFeedback?.blockReason) {
    return {
      ok: false,
      message: `Gemini blocked the prompt (${data.promptFeedback.blockReason}). Try a different topic.`,
    }
  }

  const parts = data.candidates?.[0]?.content?.parts
  const content = Array.isArray(parts)
    ? parts.map((part) => (typeof part?.text === 'string' ? part.text : '')).join('').trim()
    : ''
  const reason = data.candidates?.[0]?.finishReason

  // A story cut off before the model finished is incomplete, so it is never saved.
  if (reason && reason !== 'STOP') {
    return content
      ? { ok: false, message: `Gemini stopped before the story was finished (${reason}). Try again.` }
      : { ok: false, message: `Gemini stopped early (${reason}). Try again.` }
  }

  if (!content) {
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

const POINT_OF_VIEW_GUIDE: Record<PointOfView, string> = {
  first: 'Tell it in the first person, as "I".',
  third: 'Tell it in the third person.',
}

const VARIED_SENTENCES_GUIDE =
  'Vary sentence and paragraph length: mix short, punchy sentences with longer, flowing ones, and short paragraphs with longer ones, so the text has rhythm.'

const DIALOGUE_GUIDE = {
  plenty: 'Fill the story with as much dialogue as possible.',
  some: 'Use dialogue only where it fits naturally.',
} as const

export async function generateStory(options: {
  level: CefrLevel
  topic?: string
  textType?: TextType | null
  tone?: Tone | null
  pointOfView?: PointOfView | null
  variedSentences?: boolean
  readingMinutes: ReadingMinutes
  model: GenerationModel
  settings: Settings
  signal?: AbortSignal
}): Promise<GenerateResult> {
  const { level, topic, tone, variedSentences, readingMinutes, model, settings, signal } = options
  const textType = cleanTextType(options.textType, level)
  const info = textType ? TEXT_TYPE_INFO[textType] : null
  // A form with its own point of view, such as a diary, overrides the reader's choice.
  const pointOfView = allowsPointOfView(textType) ? options.pointOfView : null
  const length = READING_LENGTHS[readingMinutes]
  const dialogue = info ? info.dialogue : 'plenty'

  const topicLine = topic?.trim()
    ? `Topic: ${topic.trim()}`
    : 'Choose a pleasant, original topic suitable for extensive reading.'

  const userPrompt = [
    `Write a complete ${info?.noun ?? 'story'} at CEFR ${level} (${CEFR_GUIDE[level]}).`,
    ...(info ? [`Text type: ${info.label} — ${info.guide}.`] : []),
    topicLine,
    ...(tone ? [`Tone: ${tone}.`] : []),
    ...(pointOfView ? [POINT_OF_VIEW_GUIDE[pointOfView]] : []),
    `Aim for ${length.minWords}-${length.maxWords} words, approximately ${readingMinutes} minutes of reading. Reading time varies by learner.`,
    'Stay within that vocabulary level so a learner can read for pleasure without looking many words up.',
    ...(variedSentences ? [VARIED_SENTENCES_GUIDE] : []),
    // Invented words have no dictionary entry, so a learner could not look them up.
    ...(usesPlainWordsForInventions({ level, textType })
      ? ['Do not invent words; name magic, creatures, and technology with ordinary English words.']
      : []),
    ...(info?.factual
      ? ['Keep facts accurate; do not invent statistics, dates, or quotes. Explain each topic word in simple words the first time it appears.']
      : []),
    'Include a title on the first line.',
    ...(dialogue ? [DIALOGUE_GUIDE[dialogue]] : []),
    'End with THE END.',
    'No preamble, no notes, no word list — only the title and the text.',
  ].join('\n')

  const generation: StoryGeneration = {
    model,
    temperature: 0.7,
    minWords: length.minWords,
    maxWords: length.maxWords,
    systemPrompt: 'You generate level-appropriate texts for extensive reading. Output only the title and the text.',
    userPrompt,
  }
  const result = await callGemini(settings, {
    system: generation.systemPrompt,
    user: generation.userPrompt,
    temperature: generation.temperature,
    model,
    signal,
  })

  if (!result.ok && result.canceled) return result
  if (!result.ok) {
    // Provider error text can echo a credential. Keep it out of displayed errors.
    let message = result.message
    for (const key of [settings.apiKey, settings.apiKey.trim()]) {
      if (key) message = message.split(key).join('[redacted]')
    }
    return { ok: false, message }
  }

  return { ok: true, ...parseGeneratedStory(result.text), generation }
}

export function createGeneratedStory(
  result: { title: string; body: string; generation?: StoryGeneration },
  choices: GenerationChoices,
): Story {
  const story: Story = {
    id: crypto.randomUUID(),
    title: result.title,
    body: result.body,
    level: choices.level,
    readingMinutes: choices.readingMinutes,
    createdAt: new Date().toISOString(),
    wordMarks: {},
    explanations: {},
  }
  const topic = choices.topic.trim()
  const textType = cleanTextType(choices.textType, choices.level)
  if (topic) story.topic = topic
  if (textType) story.textType = textType
  if (choices.tone) story.tone = choices.tone
  if (choices.pointOfView && allowsPointOfView(textType)) story.pointOfView = choices.pointOfView
  if (result.generation) story.generation = result.generation
  return story
}
