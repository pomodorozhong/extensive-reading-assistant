import { CEFR_LEVELS, type CefrLevel, type Settings, type Story, type WordMark } from '../types'

const SETTINGS_KEY = 'era.v1.settings'
const STORIES_KEY = 'era.v1.stories'

export const DEFAULT_SETTINGS: Settings = {
  cefrLevel: 'A1',
  apiKey: '',
  apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-3.1-flash-lite',
}

function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value)
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) {
      return { ...DEFAULT_SETTINGS }
    }
    const parsed = JSON.parse(raw) as Partial<Settings>
    const previousDefaultModel = parsed.model === 'gemini-2.5-flash'
    const legacyOpenAi =
      parsed.apiBaseUrl?.includes('api.openai.com') ||
      (typeof parsed.model === 'string' && parsed.model.startsWith('gpt-'))
    const useDefaultModel = legacyOpenAi || previousDefaultModel

    return {
      cefrLevel: isCefrLevel(parsed.cefrLevel) ? parsed.cefrLevel : DEFAULT_SETTINGS.cefrLevel,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : DEFAULT_SETTINGS.apiKey,
      apiBaseUrl:
        !legacyOpenAi && typeof parsed.apiBaseUrl === 'string' && parsed.apiBaseUrl.trim()
          ? parsed.apiBaseUrl
          : DEFAULT_SETTINGS.apiBaseUrl,
      model:
        !useDefaultModel && typeof parsed.model === 'string' && parsed.model.trim()
          ? parsed.model
          : DEFAULT_SETTINGS.model,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function loadStories(): Story[] {
  try {
    const raw = localStorage.getItem(STORIES_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as Story[]
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed
      .filter((story) => story && typeof story.id === 'string' && typeof story.body === 'string')
      .map((story) => ({
        ...story,
        wordMarks: story.wordMarks ?? {},
        explanations: story.explanations ?? {},
      }))
  } catch {
    return []
  }
}

function saveStories(stories: Story[]): void {
  localStorage.setItem(STORIES_KEY, JSON.stringify(stories))
}

export function getStory(id: string): Story | undefined {
  return loadStories().find((story) => story.id === id)
}

export function upsertStory(story: Story): void {
  const stories = loadStories().filter((item) => item.id !== story.id)
  stories.unshift(story)
  saveStories(stories)
}

export function updateWordMark(id: string, key: string, mark: WordMark | undefined): Story | undefined {
  const stories = loadStories()
  const index = stories.findIndex((story) => story.id === id)
  if (index < 0) {
    return undefined
  }

  const current = stories[index]
  const wordMarks = { ...current.wordMarks }
  if (mark) {
    wordMarks[key] = mark
  } else {
    delete wordMarks[key]
  }

  const next = { ...current, wordMarks, explanations: current.explanations ?? {} }
  stories[index] = next
  saveStories(stories)
  return next
}

export function updateWordExplanation(id: string, key: string, explanation: string): Story | undefined {
  const stories = loadStories()
  const index = stories.findIndex((story) => story.id === id)
  if (index < 0) {
    return undefined
  }

  const current = stories[index]
  const next = {
    ...current,
    explanations: { ...current.explanations, [key]: explanation },
  }
  stories[index] = next
  saveStories(stories)
  return next
}
