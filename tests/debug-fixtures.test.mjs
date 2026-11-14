import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { DEBUG_FIXTURES, EXAMPLE_VOCABULARY } from '../src/lib/debug-fixtures.ts'
import { tokenize } from '../src/lib/tokenize.ts'
import { analyzeVocabulary } from '../src/lib/cefr.ts'
import {
  DEFAULT_SETTINGS, getStory, loadSettings, loadStories, loadVisibleStories,
  loadVocabulary, markVocabularyKnown, saveSettings, updateWordExplanation, updateWordMark, upsertStory,
} from '../src/lib/storage.ts'

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

test('fixtures are hidden by default, including for legacy and invalid settings', () => {
  assert.equal(loadSettings().showDebugFixtures, false)
  assert.equal(loadVisibleStories().length, 0)
  assert.equal(getStory('debug-cefr-a1'), undefined)
  for (const setting of [{ cefrLevel: 'B1' }, { showDebugFixtures: 'true' }, { showDebugFixtures: 1 }]) {
    localStorage.setItem('era.v1.settings', JSON.stringify(setting))
    assert.equal(loadSettings().showDebugFixtures, false)
  }
  localStorage.setItem('era.v1.settings', '{broken')
  assert.equal(loadVisibleStories().length, 0)
})

test('enable shows six readable fixtures without adding them to saved story storage', () => {
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  assert.deepEqual(loadVisibleStories().map((story) => story.level), ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
  assert.equal(new Set(DEBUG_FIXTURES.map((story) => story.id)).size, 6)
  assert.equal(loadStories().length, 0)
  assert.equal(localStorage.getItem('era.v1.stories'), null)
  for (const fixture of DEBUG_FIXTURES) {
    const story = getStory(fixture.id)
    assert.equal(story.body, fixture.body)
    const report = analyzeVocabulary(story.body, story.level)
    assert.ok(report.total > 50)
    assert.equal(report.target, fixture.level)
  }
})

test('fixture marks and definitions persist independently across hiding and re-enabling', () => {
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  assert.equal(updateWordMark('debug-cefr-a1', 'garden', 'unknown').wordMarks.garden, 'unknown')
  updateWordExplanation('debug-cefr-a1', 'garden', 'A place for plants.')
  assert.equal(getStory('debug-cefr-a1').explanations.garden, 'A place for plants.')
  assert.equal(loadStories().length, 0)
  assert.equal(DEBUG_FIXTURES[0].wordMarks.garden, undefined)
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: false })
  assert.equal(getStory('debug-cefr-a1'), undefined)
  assert.equal(updateWordMark('debug-cefr-a1', 'garden', 'known'), undefined)
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  assert.equal(getStory('debug-cefr-a1').wordMarks.garden, 'unknown')
  assert.equal(getStory('debug-cefr-a1').explanations.garden, 'A place for plants.')
})

test('toggling preserves saved stories and their ordinary mark/definition updates', () => {
  const saved = { ...DEBUG_FIXTURES[0], id: 'saved-story', title: 'My own story' }
  upsertStory(saved)
  const originalStorage = localStorage.getItem('era.v1.stories')
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  assert.equal(loadVisibleStories().length, 7)
  assert.equal(loadVisibleStories()[0].id, 'saved-story')
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: false })
  assert.equal(localStorage.getItem('era.v1.stories'), originalStorage)
  assert.deepEqual(loadVisibleStories(), [saved])
  updateWordMark(saved.id, 'garden', 'unknown')
  updateWordExplanation(saved.id, 'garden', 'A saved definition.')
  assert.equal(getStory(saved.id).wordMarks.garden, 'unknown')
  assert.equal(getStory(saved.id).explanations.garden, 'A saved definition.')
  updateWordMark(saved.id, 'garden', undefined)
  assert.equal(getStory(saved.id).wordMarks.garden, undefined)
})

test('malformed fixture state falls back to readable unmarked fixtures', () => {
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  localStorage.setItem('era.v1.debug-fixtures', '{broken')
  assert.deepEqual(getStory('debug-cefr-a1').wordMarks, {})
})

test('article coverage resolves reviewed inflections and spelling aliases', () => {
  const expected = [[], [], [], ['unused'],
    ['incidental', 'measurable', 'promotional', 'solely'],
    ['allocation', 'belies', 'collective', 'communal', 'countable', 'discerning',
      'eclipse', 'inadequacy', 'ownership', 'transience', 'uncomplicated', 'unequal'],
  ]
  for (const [index, story] of DEBUG_FIXTURES.entries()) {
    const report = analyzeVocabulary(story.body, story.level)
    assert.deepEqual(report.unlisted.map((entry) => entry.word), expected[index], story.level)
  }
})

const exampleKeys = Object.values(EXAMPLE_VOCABULARY).flat()

test('every example word appears in its fixture article', () => {
  for (const [id, keys] of Object.entries(EXAMPLE_VOCABULARY)) {
    const fixture = DEBUG_FIXTURES.find((story) => story.id === id)
    const words = new Set(tokenize(fixture.body).filter((token) => token.type === 'word').map((token) => token.key))
    for (const key of keys) assert.ok(words.has(key), `${key} in ${id}`)
  }
})

test('example words fill Vocabulary only while the option and fixtures are on', () => {
  assert.equal(loadSettings().addExampleVocabulary, false)
  localStorage.setItem('era.v1.settings', JSON.stringify({ addExampleVocabulary: true }))
  assert.equal(loadSettings().addExampleVocabulary, false, 'needs the fixture articles')
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  assert.deepEqual(loadVocabulary(), [])
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true, addExampleVocabulary: true })
  assert.deepEqual(loadVocabulary().map((word) => word.key).sort(), [...exampleKeys].sort())
  assert.equal(getStory('debug-cefr-b2').wordMarks.proposal, 'unknown')
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true, addExampleVocabulary: false })
  assert.deepEqual(loadVocabulary(), [])
})

test('example words stay out of stored fixture state, while the reader\'s own marks are kept', () => {
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true, addExampleVocabulary: true })
  updateWordMark('debug-cefr-b2', 'garden', 'unknown')
  markVocabularyKnown('expense')
  const stored = JSON.parse(localStorage.getItem('era.v1.debug-fixtures'))['debug-cefr-b2'].wordMarks
  assert.deepEqual(stored, { garden: 'unknown', expense: 'known' })
  assert.equal(getStory('debug-cefr-b2').wordMarks.expense, 'known')
  assert.ok(!loadVocabulary().some((word) => word.key === 'expense'))
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true, addExampleVocabulary: false })
  assert.deepEqual(loadVocabulary().map((word) => word.key), ['garden'])
})

test('the "How this story was made" card is off by default and turns on only for a saved true', () => {
  assert.equal(loadSettings().showGenerationDetails, false)
  for (const setting of [{ cefrLevel: 'B1' }, { showGenerationDetails: 'true' }, { showGenerationDetails: 1 }]) {
    localStorage.setItem('era.v1.settings', JSON.stringify(setting))
    assert.equal(loadSettings().showGenerationDetails, false)
  }
  saveSettings({ ...DEFAULT_SETTINGS, showGenerationDetails: true })
  assert.equal(loadSettings().showGenerationDetails, true)
  saveSettings({ ...DEFAULT_SETTINGS, showGenerationDetails: false })
  assert.equal(loadSettings().showGenerationDetails, false)
})
