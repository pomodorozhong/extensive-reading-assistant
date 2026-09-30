import { CEFR_LEVELS, type CefrLevel, type Settings, type Story, type WordMark } from '../types.ts'
import { DEBUG_FIXTURES, isDebugFixture } from './debug-fixtures.ts'

const SETTINGS_KEY = 'era.v1.settings'
const STORIES_KEY = 'era.v1.stories'
const FIXTURE_STATE_KEY = 'era.v1.debug-fixtures'

export const DEFAULT_SETTINGS: Settings = {
  cefrLevel: 'A1',
  apiKey: '',
  apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  model: 'gemini-3.1-flash-lite',
  showDebugFixtures: false,
  showVocabularyReport: false,
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
      showDebugFixtures: parsed.showDebugFixtures === true,
      showVocabularyReport: parsed.showVocabularyReport === true,
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

type FixtureState = Pick<Story, 'wordMarks' | 'explanations'>

function loadFixtureState(): Record<string, FixtureState> {
  try {
    const parsed = JSON.parse(localStorage.getItem(FIXTURE_STATE_KEY) ?? '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** Debug fixtures are a view overlay; they never become generated/saved stories. */
export function loadVisibleStories(): Story[] {
  const saved = loadStories()
  if (!loadSettings().showDebugFixtures) return saved
  const state = loadFixtureState()
  const savedIds = new Set(saved.map((story) => story.id))
  return [...saved, ...DEBUG_FIXTURES.filter((story) => !savedIds.has(story.id)).map((story) => ({
    ...story,
    wordMarks: state[story.id]?.wordMarks ?? {},
    explanations: state[story.id]?.explanations ?? {},
  }))]
}

export function getStory(id: string): Story | undefined {
  return loadVisibleStories().find((story) => story.id === id)
}

function saveStoryChanges(story: Story): void {
  const saved = loadStories()
  const index = saved.findIndex((item) => item.id === story.id)
  if (index >= 0) {
    saved[index] = story
    saveStories(saved)
  } else if (isDebugFixture(story.id) && loadSettings().showDebugFixtures) {
    const state = loadFixtureState()
    state[story.id] = { wordMarks: story.wordMarks, explanations: story.explanations }
    localStorage.setItem(FIXTURE_STATE_KEY, JSON.stringify(state))
  }
}

export function upsertStory(story: Story): void {
  const stories = loadStories().filter((item) => item.id !== story.id)
  stories.unshift(story)
  saveStories(stories)
}

export function updateWordMark(id: string, key: string, mark: WordMark | undefined): Story | undefined {
  const current = getStory(id)
  if (!current) {
    return undefined
  }

  const wordMarks = { ...current.wordMarks }
  if (mark) {
    wordMarks[key] = mark
  } else {
    delete wordMarks[key]
  }

  const next = { ...current, wordMarks, explanations: current.explanations ?? {} }
  saveStoryChanges(next)
  return next
}

export function updateWordExplanation(id: string, key: string, explanation: string): Story | undefined {
  const current = getStory(id)
  if (!current) {
    return undefined
  }

  const next = {
    ...current,
    explanations: { ...current.explanations, [key]: explanation },
  }
  saveStoryChanges(next)
  return next
}
