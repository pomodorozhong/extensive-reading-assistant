export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

export type ReadingMinutes = 5 | 10 | 15

export const TEXT_MODES = ['stories', 'real-life', 'ideas', 'practical'] as const

export type TextMode = (typeof TEXT_MODES)[number]

export const TEXT_TYPES = [
  'short-story',
  'fairy-tale',
  'fable',
  'myth',
  'play-script',
  'personal-narrative',
  'diary',
  'news-report',
  'biography',
  'descriptive',
  'expository',
  'reflective',
  'argumentative',
  'letter',
  'notice',
  'instructions',
] as const

export type TextType = (typeof TEXT_TYPES)[number]

export const TONES = ['cozy', 'tense', 'funny', 'thoughtful'] as const

export type Tone = (typeof TONES)[number]

export const POINTS_OF_VIEW = ['first', 'third'] as const

export type PointOfView = (typeof POINTS_OF_VIEW)[number]

export type WordMark = 'known' | 'unknown'

export type Settings = {
  cefrLevel: CefrLevel
  apiKey: string
  /** Keep the key in browser storage across reloads; when false it lives only in memory. */
  rememberApiKey: boolean
  apiBaseUrl: string
  model: string
  showDebugFixtures: boolean
  showVocabularyReport: boolean
}

/** What was sent to the model, saved so a story's origin stays known after the prompt code changes. */
export type StoryGeneration = {
  model: string
  temperature: number
  minWords: number
  maxWords: number
  systemPrompt: string
  userPrompt: string
}

export type Story = {
  id: string
  title: string
  body: string
  level: CefrLevel
  topic?: string
  textType?: TextType
  tone?: Tone
  pointOfView?: PointOfView
  readingMinutes?: ReadingMinutes
  /** The request that produced the story; absent on stories saved before it was recorded. */
  generation?: StoryGeneration
  createdAt: string
  wordMarks: Record<string, WordMark>
  explanations: Record<string, string>
}
