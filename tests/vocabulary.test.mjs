import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { reconcileVocabulary, vocabularySourcePath } from '../src/lib/vocabulary.ts'
import {
  DEFAULT_SETTINGS, loadStories, loadVocabulary, markVocabularyKnown, saveSettings,
  updateWordExplanation, updateWordMark, upsertStory,
} from '../src/lib/storage.ts'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/vocabulary-stories.json', import.meta.url)))

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

function seed() {
  localStorage.setItem('era.v1.stories', JSON.stringify(fixture))
}

test('legacy stories seed separate storage with case-insensitive deduplication and per-source context', () => {
  seed()
  const original = localStorage.getItem('era.v1.stories')
  const entries = loadVocabulary()
  assert.deepEqual(entries.map((entry) => entry.key), ['cat', 'zorblax'])
  const cat = entries[0]
  assert.equal(cat.sources.length, 2)
  assert.deepEqual(cat.sources.map((source) => source.definition), ['A small animal.', 'A pet that purrs.'])
  assert.deepEqual(cat.sources.map((source) => source.sentence), ['Cat sat by the window.', 'A CAT slept on the rug.'])
  assert.equal(entries[1].sources[0].definition, null)
  assert.equal(localStorage.getItem('era.v1.stories'), original)
  assert.deepEqual(JSON.parse(localStorage.getItem('era.v1.vocabulary')), entries)
  assert.deepEqual(loadVocabulary(), entries)
})

test('source links use the exact token occurrence and safely encode story IDs', () => {
  const entries = reconcileVocabulary([], fixture)
  for (const source of entries[0].sources) {
    const story = fixture.find((story) => story.id === source.storyId)
    assert.equal(vocabularySourcePath(source), `/stories/${story.id}?word=${source.tokenIndex}`)
  }
  assert.equal(entries[0].sources[0].tokenIndex, 0)
  assert.equal(entries[0].sources[1].tokenIndex, 2)
  assert.equal(vocabularySourcePath({ storyId: 'with /?#', tokenIndex: 4 }), '/stories/with%20%2F%3F%23?word=4')
})

test('mixed-case stored keys and repeated words produce one source with the first sentence', () => {
  const story = { ...fixture[0], body: 'An introduction!\nA CAT ran. Another cat slept.',
    wordMarks: { CAT: 'unknown' }, explanations: { Cat: 'A pet.' } }
  const [entry] = reconcileVocabulary([], [story])
  assert.equal(entry.key, 'cat')
  assert.equal(entry.sources.length, 1)
  assert.equal(entry.sources[0].sentence, 'A CAT ran.')
  assert.equal(entry.sources[0].definition, 'A pet.')
})

test('marking a word unknown captures it before the Vocabulary screen is ever opened', () => {
  upsertStory({ ...fixture[0], wordMarks: {}, explanations: {} })
  updateWordMark(fixture[0].id, 'cat', 'unknown')
  updateWordExplanation(fixture[0].id, 'cat', 'A saved definition.')
  localStorage.removeItem('era.v1.stories')
  const entries = loadVocabulary()
  assert.equal(entries.length, 1)
  assert.equal(entries[0].sources[0].definition, 'A saved definition.')
  assert.equal(entries[0].sources[0].sentence, 'Cat sat by the window.')
  assert.deepEqual(loadVocabulary(), entries)
})

test('removed stories retain words, differing definitions, and sentences across reloads', () => {
  seed()
  const entries = loadVocabulary()
  localStorage.setItem('era.v1.stories', JSON.stringify([fixture[2]]))
  assert.deepEqual(loadVocabulary(), entries)
  localStorage.removeItem('era.v1.stories')
  assert.deepEqual(loadVocabulary(), entries)
})

test('known/unknown marks refresh by source without clearing another unknown source', () => {
  seed()
  loadVocabulary()
  updateWordMark(fixture[0].id, 'cat', 'known')
  assert.deepEqual(loadVocabulary()[0].sources.map((source) => source.storyId), [fixture[1].id])
  updateWordMark(fixture[1].id, 'cat', 'known')
  assert.deepEqual(loadVocabulary().map((entry) => entry.key), ['zorblax'])
  updateWordMark(fixture[0].id, 'cat', 'unknown')
  assert.deepEqual(loadVocabulary().map((entry) => entry.key), ['cat', 'zorblax'])
  updateWordMark(fixture[0].id, 'cat', undefined)
  assert.deepEqual(loadVocabulary().map((entry) => entry.key), ['zorblax'])
})

test('clearing a surviving source leaves an unknown removed-story source tracked', () => {
  seed()
  loadVocabulary()
  localStorage.setItem('era.v1.stories', JSON.stringify([fixture[1], fixture[2]]))
  updateWordMark(fixture[1].id, 'cat', 'known')
  assert.deepEqual(loadVocabulary()[0].sources.map((source) => source.storyId), [fixture[0].id])
})

test('Vocabulary mark-as-known clears archived sources and updates all saved story marks', () => {
  seed()
  loadVocabulary()
  localStorage.setItem('era.v1.stories', JSON.stringify([fixture[1], fixture[2]]))
  markVocabularyKnown('CAT')
  assert.deepEqual(loadVocabulary().map((entry) => entry.key), ['zorblax'])
  assert.ok(loadStories().every((story) => story.wordMarks.cat === 'known'))
  assert.equal(loadStories()[0].explanations.cat, 'A pet that purrs.')
  localStorage.removeItem('era.v1.stories')
  markVocabularyKnown('zorblax')
  assert.deepEqual(loadVocabulary(), [])
})

test('blank/missing definitions and stale text marks do not hide unknown words', () => {
  const story = { ...fixture[0], body: 'Nothing here.', explanations: { cat: '  ' } }
  const [entry] = reconcileVocabulary([], [story])
  assert.equal(entry.key, 'cat')
  assert.equal(entry.sources[0].definition, null)
  assert.equal(entry.sources[0].sentence, '')
  assert.equal(vocabularySourcePath(entry.sources[0]), `/stories/${story.id}`)
})

test('debug fixture marks never enter saved Vocabulary', () => {
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  updateWordMark('debug-cefr-a1', 'garden', 'unknown')
  assert.deepEqual(loadVocabulary(), [])
  assert.deepEqual(loadStories(), [])
})

test('invalid vocabulary storage is repaired from saved stories', () => {
  seed()
  for (const value of ['{broken', '{}', '[null]', '[{"key":"cat","word":"cat","sources":[null]}]']) {
    localStorage.setItem('era.v1.vocabulary', value)
    assert.equal(loadVocabulary().length, 2)
  }
})
