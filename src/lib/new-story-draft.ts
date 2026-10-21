import { CEFR_LEVELS, type CefrLevel, type ReadingMinutes } from '../types.ts'
import { READING_MINUTE_OPTIONS, SUPPORTED_MODELS, type GenerationChoices, type GenerationModel } from './generation-options.ts'

const DRAFT_KEY = 'era.v1.new-story-draft'

// Only non-secret form choices belong here; credentials and endpoints stay in Settings.
type StoredDraft = Partial<Record<keyof GenerationChoices, unknown>>

function isLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value)
}

function isReadingMinutes(value: unknown): value is ReadingMinutes {
  return (READING_MINUTE_OPTIONS as readonly unknown[]).includes(value)
}

function isModel(value: unknown): value is GenerationModel {
  return SUPPORTED_MODELS.some((model) => model.id === value)
}

/** Restore an unfinished draft, falling back field by field to the fresh-form choices. */
export function loadNewStoryDraft(fallback: GenerationChoices): GenerationChoices {
  let stored: StoredDraft
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return fallback
    stored = parsed as StoredDraft
  } catch {
    return fallback
  }
  return {
    theme: typeof stored.theme === 'string' ? stored.theme.slice(0, 120) : fallback.theme,
    level: isLevel(stored.level) ? stored.level : fallback.level,
    readingMinutes: isReadingMinutes(stored.readingMinutes) ? stored.readingMinutes : fallback.readingMinutes,
    model: isModel(stored.model) ? stored.model : fallback.model,
  }
}

export function saveNewStoryDraft(choices: GenerationChoices): void {
  const { theme, level, readingMinutes, model } = choices
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ theme, level, readingMinutes, model }))
  } catch {
    // A draft is a convenience; a full or blocked storage must not break the form.
  }
}

export function clearNewStoryDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // See saveNewStoryDraft.
  }
}

/** Change only the level of the New Story draft, keeping the reader's other choices. */
export function setNewStoryDraftLevel(level: CefrLevel, fallback: GenerationChoices): void {
  saveNewStoryDraft({ ...loadNewStoryDraft(fallback), level })
}
