import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { readdirSync, readFileSync } from 'node:fs'
import { classifyWord } from '../src/lib/cefr.ts'
import {
  boundaryBands, firstLevelCheckSet, LEVEL_CHECK_PSEUDOWORDS, LEVEL_CHECK_SETS, LEVEL_CHECK_WORDS,
  nextLevelCheckSet, scoreLevelCheck,
} from '../src/lib/level-check.ts'
import { loadNewStoryDraft, saveNewStoryDraft, setNewStoryDraftLevel } from '../src/lib/new-story-draft.ts'
import { CEFR_LEVELS } from '../src/types.ts'

const cefr = JSON.parse(readFileSync(new URL('../src/data/cefr.json', import.meta.url)))

beforeEach(() => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  })
})

// Every word at once, for scoring tests independent of how sets are chosen.
const items = [
  ...CEFR_LEVELS.flatMap((level) => LEVEL_CHECK_WORDS[level].map((word) => ({ word, level }))),
  ...LEVEL_CHECK_PSEUDOWORDS.map((word) => ({ word, level: 'pseudo' })),
]

/** Answer Yes to every real word up to `through` and to `pseudo` made-up words. */
function answersThrough(through, pseudo = 0) {
  const answers = new Map()
  const last = through ? CEFR_LEVELS.indexOf(through) : -1
  CEFR_LEVELS.forEach((level, index) => {
    for (const word of LEVEL_CHECK_WORDS[level]) answers.set(word, index <= last)
  })
  LEVEL_CHECK_PSEUDOWORDS.forEach((word, index) => answers.set(word, index < pseudo))
  return answers
}

test('each check word is listed at its band in the bundled CEFR data', () => {
  for (const level of CEFR_LEVELS) {
    assert.equal(LEVEL_CHECK_WORDS[level].length, 10)
    for (const word of LEVEL_CHECK_WORDS[level]) assert.equal(cefr[word], level, word)
  }
})

test('made-up words are not in the CEFR data or the bundled dictionary', () => {
  const dictionaryDir = new URL('../public/dictionary/', import.meta.url)
  const dictionary = Object.assign({}, ...readdirSync(dictionaryDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(new URL(file, dictionaryDir)))))
  for (const word of LEVEL_CHECK_PSEUDOWORDS) {
    assert.equal(classifyWord(word), undefined, word)
    assert.equal(Object.hasOwn(dictionary, word), false, word)
  }
})

test('the first set samples every band and includes made-up words', () => {
  const set = firstLevelCheckSet()
  for (const level of CEFR_LEVELS) assert.equal(set.filter((item) => item.level === level).length, 2)
  assert.equal(set.filter((item) => item.level === 'pseudo').length, 4)
})

/** Run every set, ticking the words a reader who knows `answers` would tick. */
function runCheck(answers) {
  let shown = firstLevelCheckSet()
  const sets = [shown]
  for (let set = 2; set <= LEVEL_CHECK_SETS; set++) {
    const next = nextLevelCheckSet(shown, answers)
    sets.push(next)
    shown = [...shown, ...next]
  }
  return { shown, sets, result: scoreLevelCheck(shown, answers) }
}

test('later sets probe the boundary bands with unseen words', () => {
  const { shown, sets, result } = runCheck(answersThrough('B1'))
  assert.equal(new Set(shown.map((item) => item.word)).size, shown.length)
  for (const set of sets.slice(1)) {
    assert.deepEqual([...new Set(set.filter((item) => item.level !== 'pseudo').map((item) => item.level))].sort(), ['B1', 'B2'])
    assert.equal(set.length, 12)
  }
  assert.equal(result.suggested, 'B1')
})

test('the boundary stays inside the scale at both ends', () => {
  assert.deepEqual(boundaryBands(scoreLevelCheck(items, answersThrough(undefined))), ['A1', 'A2'])
  assert.deepEqual(boundaryBands(scoreLevelCheck(items, answersThrough('C2'))), ['C1', 'C2'])
  assert.equal(runCheck(answersThrough('C2')).result.suggested, 'C2')
  assert.equal(runCheck(answersThrough(undefined)).result.suggested, 'A1')
})

test('a missed word in the first set is rechecked by the next sets', () => {
  // Missing one of two A1 words fails A1 at first; more A1 and A2 words then show the real level.
  const answers = answersThrough('A2')
  const first = firstLevelCheckSet()
  const missed = first.find((item) => item.level === 'A1').word
  answers.set(missed, false)
  assert.equal(scoreLevelCheck(first, answers).suggested, 'A1')
  let shown = first
  for (let set = 2; set <= LEVEL_CHECK_SETS; set++) shown = [...shown, ...nextLevelCheckSet(shown, answers)]
  assert.equal(scoreLevelCheck(shown, answers).suggested, 'A2')
})

test('suggests the highest band known without a gap below it', () => {
  assert.equal(scoreLevelCheck(items, answersThrough('B1')).suggested, 'B1')
  assert.equal(scoreLevelCheck(items, answersThrough('C2')).suggested, 'C2')
  const gap = answersThrough('C1')
  for (const word of LEVEL_CHECK_WORDS.A2) gap.set(word, false)
  assert.equal(scoreLevelCheck(items, gap).suggested, 'A1')
})

test('suggests A1 when even A1 words are mostly unknown', () => {
  const result = scoreLevelCheck(items, answersThrough(undefined))
  assert.equal(result.suggested, 'A1')
  assert.equal(result.bands[0].corrected, 0)
})

test('corrects for made-up words answered Yes and warns about guessing', () => {
  // 8 of 10 B1 words known passes alone; with 3 of 20 made-up words claimed it drops below 80%.
  const answers = answersThrough('A2', 3)
  LEVEL_CHECK_WORDS.B1.forEach((word, index) => answers.set(word, index < 8))
  const result = scoreLevelCheck(items, answers)
  assert.equal(result.suggested, 'A2')
  assert.equal(result.pseudoClaimed, 3)
  assert.equal(result.guessingWarning, false)
  assert.equal(scoreLevelCheck(items, answersThrough('B2', 6)).guessingWarning, true)
})

test('applying a level keeps the rest of the New Story draft', () => {
  const fallback = { level: 'A2', topic: '', textType: null, tone: null, pointOfView: null, readingMinutes: 10, model: 'gemini-3.1-flash-lite' }
  saveNewStoryDraft({ ...fallback, topic: 'A weekend in Tokyo', textType: 'letter', readingMinutes: 5 })
  setNewStoryDraftLevel('B2', fallback)
  assert.deepEqual(loadNewStoryDraft(fallback), { ...fallback, topic: 'A weekend in Tokyo', textType: 'letter', readingMinutes: 5, level: 'B2' })
})

test('applying a level clears a draft text type that the level does not offer', () => {
  const fallback = { level: 'A2', topic: '', textType: null, tone: null, pointOfView: null, readingMinutes: 10, model: 'gemini-3.1-flash-lite' }
  saveNewStoryDraft({ ...fallback, textType: 'fairy-tale' })
  setNewStoryDraftLevel('C1', fallback)
  assert.deepEqual(loadNewStoryDraft(fallback), { ...fallback, level: 'C1' })
})
