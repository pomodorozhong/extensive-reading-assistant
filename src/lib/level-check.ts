import { CEFR_LEVELS, type CefrLevel } from '../types.ts'

// Ten reviewed words per band, each listed at that band in src/data/cefr.json. They avoid
// inflections, proper nouns, and words whose everyday sense sits at a different band.
export const LEVEL_CHECK_WORDS: Readonly<Record<CefrLevel, readonly string[]>> = {
  A1: ['family', 'hungry', 'weekend', 'listen', 'mountain', 'daughter', 'juice', 'pencil', 'shirt', 'forget'],
  A2: ['comfortable', 'mistake', 'wedding', 'disappear', 'lawyer', 'enormous', 'treasure', 'crime', 'slice', 'similar'],
  B1: ['whisper', 'debt', 'shallow', 'struggle', 'volcano', 'deny', 'injury', 'stare', 'eventually', 'recovery'],
  B2: ['coincidence', 'dominate', 'hesitation', 'oath', 'fleet', 'contaminate', 'sincerity', 'knot', 'regardless', 'desperation'],
  C1: ['altruism', 'bequeath', 'orchard', 'remorse', 'mingle', 'wary', 'salvage', 'nocturnal', 'deceit', 'pinnacle'],
  C2: ['hapless', 'palatable', 'magnanimity', 'disseminate', 'histrionic', 'equable', 'vermin', 'wane', 'cosset', 'incongruous'],
}

// Made-up words that follow English spelling patterns. None is in the CEFR data, the bundled
// WordNet dictionary, or the macOS word list. Short and long forms catch guessing at every band.
export const LEVEL_CHECK_PSEUDOWORDS: readonly string[] = [
  'plinder', 'wastion', 'grumbic', 'sporrow', 'cranter', 'dowsel', 'pellicate', 'quarnish', 'skivolous', 'tramplet',
  'yorrish', 'zandle', 'brastic', 'lumbrate', 'flindery', 'torvish', 'gavelous', 'dremnant', 'obliquor', 'nostrous',
]

/** The check runs in this many sets; each later set probes the bands where the reader's level seems to be. */
export const LEVEL_CHECK_SETS = 3
/** The first set samples every band with this many words. */
const SCREENING_WORDS_PER_BAND = 2
/** Later sets add this many words from each of the two bands at the boundary. */
const PROBE_WORDS_PER_BAND = 4
const PSEUDOWORDS_PER_SET = 4

/** A band passes when, after the guessing correction, the reader knows at least this share of its words. */
export const PASS_THRESHOLD = 0.8
/** Claiming more than this share of made-up words makes the estimate unreliable. */
export const GUESSING_WARNING_RATE = 0.25

export type LevelCheckItem = { word: string; level: CefrLevel | 'pseudo' }

export type BandScore = { level: CefrLevel; known: number; total: number; corrected: number }

export type LevelCheckResult = {
  suggested: CefrLevel
  bands: BandScore[]
  pseudoClaimed: number
  pseudoTotal: number
  guessingWarning: boolean
}

function shuffle<T>(values: T[], random: () => number): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return values
}

/** Up to `count` words from `pool` not yet in `shown`, picked at random. */
function pick(pool: readonly string[], shown: ReadonlySet<string>, count: number, random: () => number): string[] {
  return shuffle(pool.filter((word) => !shown.has(word)), random).slice(0, count)
}

function buildSet(counts: Partial<Record<CefrLevel, number>>, shown: readonly LevelCheckItem[], random: () => number): LevelCheckItem[] {
  const used = new Set(shown.map((item) => item.word))
  const items: LevelCheckItem[] = [
    ...CEFR_LEVELS.flatMap((level) => pick(LEVEL_CHECK_WORDS[level], used, counts[level] ?? 0, random).map((word) => ({ word, level }))),
    ...pick(LEVEL_CHECK_PSEUDOWORDS, used, PSEUDOWORDS_PER_SET, random).map((word) => ({ word, level: 'pseudo' as const })),
  ]
  return shuffle(items, random)
}

/** The first set: a few words from every band plus made-up words, in random order. */
export function firstLevelCheckSet(random: () => number = Math.random): LevelCheckItem[] {
  return buildSet(Object.fromEntries(CEFR_LEVELS.map((level) => [level, SCREENING_WORDS_PER_BAND])), [], random)
}

/**
 * The bands to probe next: the suggested level and the band above it, where the reader's
 * knowledge seems to drop off. At the ends of the scale this is A1–A2 or C1–C2.
 */
export function boundaryBands(result: LevelCheckResult): [CefrLevel, CefrLevel] {
  const lower = Math.min(CEFR_LEVELS.indexOf(result.suggested), CEFR_LEVELS.length - 2)
  return [CEFR_LEVELS[lower], CEFR_LEVELS[lower + 1]]
}

/** The next set, tuned by every answer so far: unseen words from the two boundary bands. */
export function nextLevelCheckSet(
  shown: readonly LevelCheckItem[],
  answers: ReadonlyMap<string, boolean>,
  random: () => number = Math.random,
): LevelCheckItem[] {
  const [lower, upper] = boundaryBands(scoreLevelCheck(shown, answers))
  return buildSet({ [lower]: PROBE_WORDS_PER_BAND, [upper]: PROBE_WORDS_PER_BAND }, shown, random)
}

/**
 * Score answers keyed by word; a word shown but not ticked counts as unknown. Each band's
 * known share is corrected for guessing with (hits − false alarms) / (1 − false alarms), where false alarms are made-up words claimed as
 * known. The suggestion is the highest band reached without a failing band below it, and A1
 * when even A1 fails.
 */
export function scoreLevelCheck(items: readonly LevelCheckItem[], answers: ReadonlyMap<string, boolean>): LevelCheckResult {
  const pseudo = items.filter((item) => item.level === 'pseudo')
  const pseudoClaimed = pseudo.filter((item) => answers.get(item.word) === true).length
  const falseAlarms = pseudo.length ? pseudoClaimed / pseudo.length : 0

  const bands = CEFR_LEVELS.map((level) => {
    const words = items.filter((item) => item.level === level)
    const known = words.filter((item) => answers.get(item.word) === true).length
    const hits = words.length ? known / words.length : 0
    const corrected = falseAlarms >= 1 ? 0 : Math.max(0, (hits - falseAlarms) / (1 - falseAlarms))
    return { level, known, total: words.length, corrected }
  })

  let suggested: CefrLevel = 'A1'
  for (const band of bands) {
    if (band.corrected < PASS_THRESHOLD) break
    suggested = band.level
  }

  return {
    suggested,
    bands,
    pseudoClaimed,
    pseudoTotal: pseudo.length,
    guessingWarning: pseudo.length > 0 && falseAlarms > GUESSING_WARNING_RATE,
  }
}
