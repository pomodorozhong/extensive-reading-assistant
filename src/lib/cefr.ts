import vocabulary from '../data/cefr.json' with { type: 'json' }
import { CEFR_LEVELS, type CefrLevel } from '../types.ts'
import { tokenize } from './tokenize.ts'

const lexicon: Readonly<Record<string, CefrLevel>> = vocabulary as Record<string, CefrLevel>
const irregular: Record<string, string> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', does: 'do', did: 'do', done: 'do', went: 'go', gone: 'go',
  ran: 'run', ate: 'eat', eaten: 'eat', saw: 'see', seen: 'see', took: 'take', taken: 'take',
  made: 'make', said: 'say', bought: 'buy', brought: 'bring', thought: 'think', knew: 'know',
  known: 'know', wrote: 'write', written: 'write', gave: 'give', given: 'give', got: 'get',
  gotten: 'get', came: 'come', felt: 'feel', found: 'find', left: 'leave', told: 'tell',
  children: 'child', men: 'man', women: 'woman', mice: 'mouse', feet: 'foot', teeth: 'tooth',
  people: 'person', better: 'good', best: 'good', worse: 'bad', worst: 'bad',
}
const contractions: Record<string, string[]> = {
  "can't": ['can', 'not'], "cannot": ['can', 'not'], "won't": ['will', 'not'],
  "shan't": ['shall', 'not'], "ain't": ['be', 'not'], "let's": ['let', 'us'],
}

function lemma(word: string): string | undefined {
  if (Object.hasOwn(lexicon, word)) return word
  if (irregular[word] && Object.hasOwn(lexicon, irregular[word])) return irregular[word]
  const candidates: string[] = []
  if (word.endsWith("'s")) candidates.push(word.slice(0, -2))
  if (word.endsWith('ies')) candidates.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('ied')) candidates.push(`${word.slice(0, -3)}y`)
  if (word.endsWith('ves')) candidates.push(`${word.slice(0, -3)}f`, `${word.slice(0, -3)}fe`)
  if (/(?:ches|shes|sses|xes|zes|oes)$/.test(word)) candidates.push(word.slice(0, -2))
  if (word.endsWith('s') && !word.endsWith('ss')) candidates.push(word.slice(0, -1))
  for (const suffix of ['ing', 'ed', 'er', 'est']) {
    if (!word.endsWith(suffix)) continue
    const stem = word.slice(0, -suffix.length)
    candidates.push(stem, `${stem}e`)
    if (/(.)\1$/.test(stem)) candidates.push(stem.slice(0, -1))
    if (stem.endsWith('i')) candidates.push(`${stem.slice(0, -1)}y`)
  }
  return candidates.find((candidate) => Object.hasOwn(lexicon, candidate))
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
  let total = 0
  for (const token of tokenize(body)) {
    if (token.type !== 'word') continue
    total++
    const word = token.value.toLowerCase().replaceAll('’', "'")
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
    abovePercent: total ? aboveCount / total * 100 : 0,
  }
}
