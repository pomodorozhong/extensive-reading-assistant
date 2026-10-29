import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { dictionaryForms, lookupDefinition } from '../src/lib/dictionary.ts'

// The npm script rebuilds these shards from the bundled WordNet data before the tests run.
const shards = new Map()
function shard(word) {
  const name = /[a-z]/.test(word.charAt(0)) ? word.charAt(0) : '_'
  if (!shards.has(name)) {
    shards.set(name, JSON.parse(readFileSync(new URL(`../public/dictionary/${name}.json`, import.meta.url), 'utf8')))
  }
  return shards.get(name)
}

// Mirrors lookupDefinition: the first candidate with a bundled entry wins.
function resolvedForm(word) {
  return dictionaryForms(word).find((form) => Object.hasOwn(shard(form), form))
}

test('irregular verbs, plural nouns, and comparative adjectives resolve to their base entries', () => {
  for (const [word, base] of [
    ['met', 'meet'],
    ['drank', 'drink'],
    ['children', 'child'],
    ['knives', 'knife'],
    ['happier', 'happy'],
    ['Children', 'child'],
    ["children's", 'child'],
  ]) {
    assert.equal(resolvedForm(word), base, word)
  }
})

// These surface forms have only a proper-noun or acronym entry (Ate the goddess, LED,
// the Sung dynasty), so the base verb must come first.
test('irregular past forms prefer the base verb over a proper-noun entry', () => {
  for (const [word, base] of [
    ['ate', 'eat'],
    ['bade', 'bid'],
    ['drew', 'draw'],
    ['fed', 'feed'],
    ['led', 'lead'],
    ['lent', 'lend'],
    ['sung', 'sing'],
  ]) {
    assert.equal(resolvedForm(word), base, word)
  }
})

test('lookups that already succeeded keep the same entry', () => {
  for (const [word, form] of [
    ['saw', 'see'],
    ['went', 'go'],
    ['cats', 'cat'],
    ['stories', 'story'],
    ['running', 'running'],
    ['walked', 'walk'],
    ['garden', 'garden'],
    ['dog’s', 'dog'],
  ]) {
    assert.equal(resolvedForm(word), form, word)
  }
})

test('existing candidates keep their order ahead of lemmatizer candidates', () => {
  assert.deepEqual(dictionaryForms('saw').slice(0, 2), ['see', 'saw'])
  assert.equal(dictionaryForms('met')[0], 'met')
  assert.ok(dictionaryForms('met').includes('meet'))
  assert.ok(dictionaryForms('knives').indexOf('knife') > dictionaryForms('knives').indexOf('knive'))
})

test('lookups request every needed shard at once and keep form order', async () => {
  const requested = []
  const resolvers = new Map()
  const load = (name) => {
    requested.push(name)
    return new Promise((resolve) => resolvers.set(name, resolve))
  }

  // "went" needs the g shard (for "go") and the w shard (for "went").
  const result = lookupDefinition('went', load)
  await Promise.resolve()
  assert.deepEqual(requested.sort(), ['g', 'w'])

  // The w shard answering first must not beat "go", which comes first in form order.
  resolvers.get('w')({ went: 'wrong entry' })
  resolvers.get('g')({ go: 'move or travel' })
  assert.deepEqual(await result, { ok: true, text: 'move or travel' })
})

test('a failed shard after the winning form does not fail the lookup', async () => {
  const load = (name) =>
    name === 'g' ? Promise.resolve({ go: 'move or travel' }) : Promise.reject(new Error('offline'))
  assert.deepEqual(await lookupDefinition('went', load), { ok: true, text: 'move or travel' })
})

test('a failed shard before any entry is found reports the error', async () => {
  const load = (name) =>
    name === 'g' ? Promise.reject(new Error('offline')) : Promise.resolve({ went: 'wrong entry' })
  assert.deepEqual(await lookupDefinition('went', load), { ok: false, message: 'offline' })
})
