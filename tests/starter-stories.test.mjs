import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { STARTER_STORIES, isStarterStory } from '../src/lib/starter-stories.ts'
import { tokenize } from '../src/lib/tokenize.ts'
import {
  DEFAULT_SETTINGS, getStory, loadStories, loadVisibleStories, loadVocabulary, markVocabularyKnown,
  saveSettings, updateWordExplanation, updateWordMark, upsertStory,
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

const words = (story) => tokenize(story.body).filter((token) => token.type === 'word').length

test('four reviewed starters, one per level from A1 to B2, each a 2-minute read with its generation record', () => {
  assert.deepEqual(STARTER_STORIES.map((story) => story.level), ['A1', 'A2', 'B1', 'B2'])
  assert.deepEqual(STARTER_STORIES.map((story) => story.id), ['starter-a1', 'starter-a2', 'starter-b1', 'starter-b2'])
  for (const story of STARTER_STORIES) {
    assert.equal(story.readingMinutes, 2)
    assert.equal(story.generation?.minWords, 160)
    assert.equal(story.generation?.maxWords, 240)
    assert.ok(story.generation?.userPrompt.includes(`CEFR ${story.level}`), story.title)
    assert.ok(story.textType && story.topic, story.title)
    assert.doesNotMatch(story.body, /THE END/, story.title)
    // The reader shows Markdown emphasis and separators literally.
    assert.doesNotMatch(story.body, /\*/, story.title)
    assert.ok(words(story) >= 160 && words(story) <= 280, `${story.title}: ${words(story)} words`)
  }
})

test('starters are listed with no key, no settings, and no saved stories, without being saved', () => {
  assert.deepEqual(loadVisibleStories().map((story) => story.id), STARTER_STORIES.map((story) => story.id))
  assert.equal(getStory('starter-b1')?.title, 'The Whispering Books')
  assert.equal(localStorage.getItem('era.v1.stories'), null)
  assert.ok(isStarterStory('starter-a1'))
  assert.ok(!isStarterStory('debug-cefr-a1'))
})

test('starters stay listed after the reader saves stories of their own, and when fixtures are on', () => {
  upsertStory({ ...STARTER_STORIES[0], id: 'mine', title: 'Mine' })
  saveSettings({ ...DEFAULT_SETTINGS, showDebugFixtures: true })
  const ids = loadVisibleStories().map((story) => story.id)
  assert.deepEqual(ids.slice(0, 5), ['mine', 'starter-a1', 'starter-a2', 'starter-b1', 'starter-b2'])
  assert.equal(ids.length, 11)
})

test('the first change saves one copy of the starter, and later changes update it without duplicating', () => {
  updateWordMark('starter-a1', 'puppy', 'unknown')
  assert.deepEqual(loadStories().map((story) => story.id), ['starter-a1'])
  updateWordExplanation('starter-a1', 'puppy', 'a young dog')
  updateWordMark('starter-a1', 'fur', 'unknown')
  const saved = loadStories()
  assert.equal(saved.length, 1)
  assert.deepEqual(saved[0].wordMarks, { puppy: 'unknown', fur: 'unknown' })
  assert.equal(saved[0].explanations.puppy, 'a young dog')
  assert.equal(saved[0].generation?.model, STARTER_STORIES[0].generation?.model)
  assert.equal(loadVisibleStories().filter((story) => story.id === 'starter-a1').length, 1)
  assert.deepEqual(loadVocabulary().map((word) => word.key).sort(), ['fur', 'puppy'])
})

test('marking a word known in Vocabulary does not save untouched starters', () => {
  updateWordMark('starter-b1', 'aisle', 'unknown')
  markVocabularyKnown('aisle')
  assert.deepEqual(loadStories().map((story) => story.id), ['starter-b1'])
  assert.equal(getStory('starter-b1')?.wordMarks.aisle, 'known')
})
