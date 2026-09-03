export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const

export type CefrLevel = (typeof CEFR_LEVELS)[number]

export type WordMark = 'known' | 'unknown'

export type Settings = {
  cefrLevel: CefrLevel
  apiKey: string
  apiBaseUrl: string
  model: string
}

export type Story = {
  id: string
  title: string
  body: string
  level: CefrLevel
  theme?: string
  createdAt: string
  wordMarks: Record<string, WordMark>
  explanations: Record<string, string>
}
