import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { DEBUG_FIXTURES } from '../src/lib/debug-fixtures.ts'
import { analyzeVocabulary } from '../src/lib/cefr.ts'
import {
  DEFAULT_SETTINGS, getStory, loadSettings, loadStories, loadVisibleStories,
  saveSettings, updateWordExplanation, updateWordMark, upsertStory,
} from '../src/lib/storage.ts'

beforeEach(() => {
  const values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
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
