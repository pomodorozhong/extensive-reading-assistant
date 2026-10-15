import type { CefrLevel, ReadingMinutes, Settings } from '../types.ts'

export const THEME_EXAMPLES = [
  'A rainy afternoon at a bookshop',
  'A weekend in Tokyo',
  "My dog's adventure",
  'A mysterious package',
  'Life on a space station',
] as const

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
] as const

export type GenerationModel = (typeof SUPPORTED_MODELS)[number]['id']
export const DEFAULT_MODEL = SUPPORTED_MODELS[0].id
export const DEFAULT_READING_MINUTES: ReadingMinutes = 10

// Product targets for a reading session, not measured or guaranteed reading times.
export const READING_LENGTHS: Record<ReadingMinutes, { minWords: number; maxWords: number }> = {
  5: { minWords: 400, maxWords: 600 },
  10: { minWords: 800, maxWords: 1200 },
  15: { minWords: 1200, maxWords: 1800 },
}

export const READING_MINUTE_OPTIONS = [5, 10, 15] as const satisfies readonly ReadingMinutes[]

export type GenerationChoices = {
  level: CefrLevel
  theme: string
  readingMinutes: ReadingMinutes
  model: GenerationModel
}

export function initialGenerationChoices(settings: Pick<Settings, 'cefrLevel' | 'model'>): GenerationChoices {
  const savedModel = settings.model.trim().replace(/^models\//, '')
  return {
    level: settings.cefrLevel,
    theme: '',
    readingMinutes: DEFAULT_READING_MINUTES,
    model: SUPPORTED_MODELS.find((model) => model.id === savedModel)?.id ?? DEFAULT_MODEL,
  }
}
