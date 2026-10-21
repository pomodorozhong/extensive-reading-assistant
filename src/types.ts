export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

export type ReadingMinutes = 5 | 10 | 15

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

export type Story = {
  id: string
  title: string
  body: string
  level: CefrLevel
  theme?: string
  readingMinutes?: ReadingMinutes
  createdAt: string
  wordMarks: Record<string, WordMark>
  explanations: Record<string, string>
}
