import {
  CEFR_LEVELS,
  POINTS_OF_VIEW,
  TONES,
  type CefrLevel,
  type PointOfView,
  type ReadingMinutes,
  type Tone,
} from '../types.ts'
import {
  cleanTextType,
  MAX_TOPIC_LENGTH,
  READING_MINUTE_OPTIONS,
  SUPPORTED_MODELS,
  type GenerationChoices,
  type GenerationModel,
} from './generation-options.ts'

const DRAFT_KEY = 'era.v1.new-story-draft'

// Only non-secret form choices belong here; credentials and endpoints stay in Settings.
// Drafts saved before the rename hold the topic as `theme`.
type StoredDraft = Partial<Record<keyof GenerationChoices | 'theme', unknown>>

function isLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (CEFR_LEVELS as readonly string[]).includes(value)
}

function isReadingMinutes(value: unknown): value is ReadingMinutes {
  return (READING_MINUTE_OPTIONS as readonly unknown[]).includes(value)
}

function isTone(value: unknown): value is Tone {
  return (TONES as readonly unknown[]).includes(value)
}

function isPointOfView(value: unknown): value is PointOfView {
  return (POINTS_OF_VIEW as readonly unknown[]).includes(value)
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
  const topic = typeof stored.topic === 'string' ? stored.topic : stored.theme
  const level = isLevel(stored.level) ? stored.level : fallback.level
  return {
    topic: typeof topic === 'string' ? topic.slice(0, MAX_TOPIC_LENGTH) : fallback.topic,
    // A text type outside the restored level is dropped, as when the reader changes the level.
    textType: cleanTextType(stored.textType ?? fallback.textType, level),
    tone: stored.tone === null || isTone(stored.tone) ? stored.tone : fallback.tone,
    pointOfView:
      stored.pointOfView === null || isPointOfView(stored.pointOfView) ? stored.pointOfView : fallback.pointOfView,
    level,
    readingMinutes: isReadingMinutes(stored.readingMinutes) ? stored.readingMinutes : fallback.readingMinutes,
    model: isModel(stored.model) ? stored.model : fallback.model,
  }
}

export function saveNewStoryDraft(choices: GenerationChoices): void {
  const { topic, textType, tone, pointOfView, level, readingMinutes, model } = choices
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ topic, textType, tone, pointOfView, level, readingMinutes, model }),
    )
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

/** Change the level of the New Story draft, keeping the reader's other choices that still fit it. */
export function setNewStoryDraftLevel(level: CefrLevel, fallback: GenerationChoices): void {
  const draft = loadNewStoryDraft(fallback)
  saveNewStoryDraft({ ...draft, level, textType: cleanTextType(draft.textType, level) })
}
