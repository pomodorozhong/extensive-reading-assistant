import type { Settings, Story } from '../types.ts'
import { classifyWord } from './cefr.ts'
import { callGemini } from './generate.ts'
import type { ExamQuestion } from './progress.ts'
import { lookupDefinition } from './dictionary.ts'
import { normalizeWord, tokenize } from './tokenize.ts'
import { sourceSentence, type VocabularyWord } from './vocabulary.ts'

export const READING_QUESTION_COUNT = 4

export function shuffled<T>(items: readonly T[]): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function readingExamPrompt(story: Pick<Story, 'title' | 'body' | 'level'>): { system: string; user: string } {
  return {
    system:
      'You write reading comprehension questions for English learners. Output only a JSON array, with no commentary and no code fences.',
    user: [
      `Write ${READING_QUESTION_COUNT} multiple-choice reading comprehension questions about the text below, for a learner at CEFR ${story.level}.`,
      'Cover the main idea and key details, and use simple wording.',
      'Each item has: "question" (string), "options" (exactly 4 short strings, only one correct), "correct" (index 0-3 of the right option), and "explanation" (one sentence that says why, using the text).',
      'Vary the position of the correct option.',
      '',
      `Title: ${story.title}`,
      '',
      story.body,
    ].join('\n'),
  }
}

/** Reads the model's JSON, keeping only well-formed questions. */
export function parseReadingQuestions(raw: string): ExamQuestion[] {
  let text = raw.trim()
  if (text.startsWith('```')) text = text.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []
  const questions: ExamQuestion[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const { question, options, correct, explanation } = item as Record<string, unknown>
    if (
      typeof question !== 'string' ||
      !question.trim() ||
      !Array.isArray(options) ||
      options.length !== 4 ||
      !options.every((option) => typeof option === 'string' && option.trim()) ||
      !Number.isInteger(correct) ||
      (correct as number) < 0 ||
      (correct as number) > 3
    ) {
      continue
    }
    questions.push({
      question: question.trim(),
      options: (options as string[]).map((option) => option.trim()),
      correct: correct as number,
      explanation: typeof explanation === 'string' ? explanation.trim() : '',
    })
  }
  return questions
}

export type QuestionsResult = { ok: true; questions: ExamQuestion[] } | { ok: false; message: string }

export async function generateReadingQuestions(
  story: Pick<Story, 'title' | 'body' | 'level'>,
  settings: Settings,
  signal?: AbortSignal,
): Promise<QuestionsResult> {
  if (!settings.apiKey.trim()) {
    return { ok: false, message: 'Add your Gemini API key in Settings to create questions about this story.' }
  }
  const prompt = readingExamPrompt(story)
  const result = await callGemini(settings, {
    system: prompt.system,
    user: prompt.user,
    temperature: 0.4,
    model: settings.model as Parameters<typeof callGemini>[1]['model'],
    signal,
    task: { name: 'Writing exam questions', finished: 'the questions were finished' },
  })
  if (!result.ok) {
    let message = result.message
    for (const key of [settings.apiKey, settings.apiKey.trim()]) {
      if (key) message = message.split(key).join('[redacted]')
    }
    return { ok: false, message }
  }
  const questions = parseReadingQuestions(result.text)
  if (questions.length === 0) return { ok: false, message: 'Gemini did not return usable questions. Try again.' }
  return { ok: true, questions }
}

export type VocabularyTarget = {
  word: string
  definition: string
  sentence: string
  story: string
}

export function vocabularyExplanation(target: Pick<VocabularyTarget, 'word' | 'definition' | 'story'>): string {
  const definition = /[.!?]$/u.test(target.definition) ? target.definition : `${target.definition}.`
  const meaning = `“${target.word}” means ${definition}`
  return target.story ? `From “${target.story}”: ${meaning}` : meaning
}

/** Builds up to `count` definition questions; each needs three other definitions as wrong answers. */
export function makeVocabularyQuestions(
  targets: VocabularyTarget[],
  definitions: string[],
  count: number,
): ExamQuestion[] {
  const questions: ExamQuestion[] = []
  for (const target of shuffled(targets)) {
    if (questions.length >= count) break
    const others = shuffled([...new Set(definitions)].filter((definition) => definition !== target.definition)).slice(0, 3)
    if (others.length < 3) continue
    const options = shuffled([target.definition, ...others])
    const inContext = target.sentence && questions.length % 2 === 0
    questions.push({
      question: inContext
        ? `What does “${target.word}” mean in this sentence? “${target.sentence}”`
        : `Which definition best matches “${target.word}”?`,
      options,
      correct: options.indexOf(target.definition),
      explanation: vocabularyExplanation(target),
      word: target.word,
      definition: target.definition,
      sentence: target.sentence,
      story: target.story,
    })
  }
  return questions
}

type Candidate = { key: string; word: string; sentence: string; story: string }

/** Distinct words from the stories that are above basic level and not marked as known. */
export function storyCandidates(stories: Story[]): Candidate[] {
  const seen = new Set<string>()
  const candidates: Candidate[] = []
  for (const story of stories) {
    const marks = new Map(Object.entries(story.wordMarks).map(([key, mark]) => [normalizeWord(key), mark]))
    let offset = 0
    for (const token of tokenize(story.body)) {
      const start = offset
      offset += token.value.length
      if (token.type !== 'word' || seen.has(token.key) || marks.get(token.key) === 'known') continue
      const level = classifyWord(token.key)
      if (!level || level === 'A1' || level === 'A2') continue
      seen.add(token.key)
      candidates.push({
        key: token.key,
        word: token.value,
        sentence: sourceSentence(story.body, start, offset),
        story: story.title,
      })
    }
  }
  return candidates
}

async function resolve(candidates: Candidate[], wanted: number, maxTries: number): Promise<VocabularyTarget[]> {
  const found: VocabularyTarget[] = []
  for (const candidate of candidates.slice(0, maxTries)) {
    if (found.length >= wanted) break
    const result = await lookupDefinition(candidate.key, undefined, { mayBeName: false })
    if (result.ok) {
      found.push({
        word: candidate.word,
        definition: result.text,
        sentence: candidate.sentence,
        story: candidate.story,
      })
    }
  }
  return found
}

export function vocabularyTargets(words: VocabularyWord[]): Candidate[] {
  return words.map((entry) => ({
    key: entry.key,
    word: entry.word,
    sentence: entry.sources[0]?.sentence ?? '',
    story: entry.sources[0]?.title ?? '',
  }))
}

export async function buildVocabularyExam(
  source: 'stories' | 'vocabulary',
  count: number,
  stories: Story[],
  saved: VocabularyWord[],
): Promise<QuestionsResult> {
  const fromStories = shuffled(storyCandidates(stories))
  const primary = source === 'vocabulary' ? shuffled(vocabularyTargets(saved)) : fromStories
  const targets = await resolve(primary, count, count * 4)
  // Wrong answers come from other words in the library, so a short list still gets a full quiz.
  const savedKeys = new Set(primary.map((candidate) => candidate.key))
  const extras = await resolve(
    fromStories.filter((candidate) => !savedKeys.has(candidate.key)),
    count * 3 + 6,
    count * 6 + 12,
  )
  const questions = makeVocabularyQuestions(targets, [...targets, ...extras].map((target) => target.definition), count)
  if (questions.length === 0) {
    return {
      ok: false,
      message:
        source === 'vocabulary'
          ? 'Mark a few more words as unknown while reading, then try again.'
          : 'Read a few more stories so there are enough words to ask about.',
    }
  }
  return { ok: true, questions }
}

export function practiceMissedQuestions(questions: ExamQuestion[], answers: number[]): ExamQuestion[] {
  const missed = questions.filter((question, index) => question.word && question.correct !== answers[index])
  const targets: VocabularyTarget[] = missed.map((question) => ({
    word: question.word ?? '',
    definition: question.definition ?? '',
    sentence: question.sentence ?? '',
    story: question.story ?? '',
  }))
  const definitions = questions.flatMap((question) => question.options)
  return makeVocabularyQuestions(targets, definitions, targets.length)
}
