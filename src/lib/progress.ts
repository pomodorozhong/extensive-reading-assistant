export type ExamQuestion = {
  question: string
  options: string[]
  correct: number
  explanation: string
  /** Vocabulary exams only: the word asked about, so missed words can be practiced again. */
  word?: string
  definition?: string
  sentence?: string
  story?: string
}

export type ExamResult = {
  type: 'reading' | 'vocabulary'
  source: 'stories' | 'vocabulary' | null
  storyId: string | null
  score: number
  total: number
  questions: ExamQuestion[]
  answers: number[]
  createdAt: string
}

export type Progress = {
  read: string[]
  readingResults: Record<string, ExamResult>
  vocabularyResults: ExamResult[]
}

const PROGRESS_KEY = 'era.v1.progress'
const MAX_VOCABULARY_RESULTS = 30

function empty(): Progress {
  return { read: [], readingResults: {}, vocabularyResults: [] }
}

export function loadProgress(): Progress {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? 'null') as Partial<Progress> | null
    if (!parsed || typeof parsed !== 'object') return empty()
    return {
      read: Array.isArray(parsed.read) ? parsed.read.filter((id) => typeof id === 'string') : [],
      readingResults:
        parsed.readingResults && typeof parsed.readingResults === 'object' && !Array.isArray(parsed.readingResults)
          ? parsed.readingResults
          : {},
      vocabularyResults: Array.isArray(parsed.vocabularyResults) ? parsed.vocabularyResults : [],
    }
  } catch {
    return empty()
  }
}

function save(progress: Progress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Progress is a convenience; a full or blocked store only loses it.
  }
}

export function markStoryRead(id: string): void {
  const progress = loadProgress()
  if (progress.read.includes(id)) return
  save({ ...progress, read: [...progress.read, id] })
}

export function saveReadingResult(result: ExamResult): void {
  if (!result.storyId) return
  const progress = loadProgress()
  save({ ...progress, readingResults: { ...progress.readingResults, [result.storyId]: result } })
}

export function saveVocabularyResult(result: ExamResult): void {
  const progress = loadProgress()
  save({ ...progress, vocabularyResults: [...progress.vocabularyResults, result].slice(-MAX_VOCABULARY_RESULTS) })
}

export function scoreAnswers(questions: ExamQuestion[], answers: number[]): number {
  return questions.reduce((total, question, index) => total + (question.correct === answers[index] ? 1 : 0), 0)
}
