import vocabulary from '../data/cefr.json' with { type: 'json' }
import nlp from 'compromise'
import lemmatize from 'wink-lemmatizer'
import { CEFR_LEVELS, type CefrLevel } from '../types.ts'
import { tokenize } from './tokenize.ts'

const lexicon: Readonly<Record<string, CefrLevel>> = vocabulary as Record<string, CefrLevel>
// Reviewed spelling equivalences reuse a listed lemma's level, not a derived word's level.
const spellingAliases: Readonly<Record<string, string>> = {
  tranquillity: 'tranquility',
}
// wink-lemmatizer handles nouns/verbs/adjectives, but not this plural pronoun.
const pronounAliases: Readonly<Record<string, string>> = { others: 'other' }
const contractions: Record<string, string[]> = {
  "can't": ['can', 'not'], "cannot": ['can', 'not'], "won't": ['will', 'not'],
  "shan't": ['shall', 'not'], "ain't": ['be', 'not'], "let's": ['let', 'us'],
}

function lemma(word: string): string | undefined {
  if (Object.hasOwn(lexicon, word)) return word
  if (Object.hasOwn(spellingAliases, word) && Object.hasOwn(lexicon, spellingAliases[word])) {
    return spellingAliases[word]
  }
  const base = word.endsWith("'s") ? word.slice(0, -2) : word
  const candidates = [base, pronounAliases[base], lemmatize.verb(base), lemmatize.noun(base), lemmatize.adjective(base)]
  return candidates.find((candidate) => candidate !== undefined && Object.hasOwn(lexicon, candidate))
}

function expand(word: string): string[] {
  if (Object.hasOwn(contractions, word)) return contractions[word]
  if (word.endsWith("n't")) return [word.slice(0, -3), 'not']
  const suffixes: Record<string, string> = { "'m": 'be', "'re": 'be', "'ve": 'have', "'ll": 'will', "'d": 'would' }
  for (const [suffix, expansion] of Object.entries(suffixes)) {
    if (word.endsWith(suffix)) return [word.slice(0, -suffix.length), expansion]
  }
  // Pronoun 's is treated as is/has (both A1); other 's forms are possessives.
  if (/^(?:he|she|it|that|there|here|what|who|where|how)'s$/.test(word)) {
    return [word.slice(0, -2), 'be']
  }
  return [word]
}

export type VocabularyEntry = {
  word: string
  count: number
  level?: CefrLevel
  lemmas: string[]
}

export function analyzeVocabulary(body: string, target: CefrLevel) {
  const entries = new Map<string, VocabularyEntry>()
  const names = new Map<string, VocabularyEntry>()
  // Character offsets preserve context: a detected name does not exempt every
  // lowercase occurrence of the same word elsewhere in the story.
  const spans: { offset: { start: number; length: number } }[] = nlp(body).match('#Person').json({ offset: true })
  let total = 0
  let nameCount = 0
  let offset = 0
  for (const token of tokenize(body)) {
    const start = offset
    offset += token.value.length
    if (token.type !== 'word') continue
    const word = token.value.toLowerCase().replaceAll('’', "'")
    if (spans.some(({ offset: span }) => start >= span.start && offset <= span.start + span.length)) {
      nameCount++
      const existing = names.get(word)
      if (existing) existing.count++
      else names.set(word, { word, count: 1, lemmas: [] })
      continue
    }
    total++
    const existing = entries.get(word)
    if (existing) {
      existing.count++
      continue
    }
    const parts = expand(word)
    const lemmas = parts.map(lemma)
    const resolved = lemmas.filter((value): value is string => value !== undefined)
    const level = resolved.length === parts.length
      ? CEFR_LEVELS[Math.max(...resolved.map((value) => CEFR_LEVELS.indexOf(lexicon[value])))]
      : undefined
    entries.set(word, { word, count: 1, level, lemmas: resolved })
  }
  const sorted = [...entries.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
  const aboveLevel = sorted.filter((entry) => entry.level && CEFR_LEVELS.indexOf(entry.level) > CEFR_LEVELS.indexOf(target))
  const unlisted = sorted.filter((entry) => !entry.level)
  const aboveCount = aboveLevel.reduce((sum, entry) => sum + entry.count, 0)
  const unlistedCount = unlisted.reduce((sum, entry) => sum + entry.count, 0)
  return {
    target, total, aboveLevel, unlisted, aboveCount, unlistedCount,
    names: [...names.values()].sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)),
    nameCount, wordCount: total + nameCount,
    abovePercent: total ? aboveCount / total * 100 : 0,
  }
}
