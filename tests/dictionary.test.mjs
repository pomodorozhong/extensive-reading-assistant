import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { dictionaryForms, lookupDefinition } from '../src/lib/dictionary.ts'

// The npm script rebuilds these shards from the bundled WordNet data before the tests run.
const shards = new Map()
async function loadBundled(name) {
  if (!shards.has(name)) {
    shards.set(name, JSON.parse(readFileSync(new URL(`../public/dictionary/${name}.json`, import.meta.url), 'utf8')))
  }
  return shards.get(name)
}

async function gloss(key) {
  const first = key.charAt(0).toLowerCase()
  return (await loadBundled(/[a-z]/.test(first) ? first : '_'))[key]
}

// Checks that looking up `word` shows the bundled entry stored under `key`.
async function assertResolves(word, key, options) {
  const expected = await gloss(key)
  assert.ok(expected, `no bundled entry for ${key}`)
  assert.deepEqual(await lookupDefinition(word, loadBundled, options), { ok: true, text: expected }, word)
}

test('irregular verbs, plural nouns, and comparative adjectives resolve to their base entries', async () => {
  for (const [word, base] of [
    ['met', 'meet'],
    ['drank', 'drink'],
    ['children', 'child'],
    ['knives', 'knife'],
    ['happier', 'happy'],
    ['Children', 'child'],
    ["children's", 'child'],
  ]) {
    await assertResolves(word, base)
  }
})

// These surface forms have only a proper-noun or acronym entry (Ate the goddess, LED,
// the Sung dynasty), so the base verb must come first.
test('irregular past forms prefer the base verb over a proper-noun entry', async () => {
  for (const [word, base] of [
    ['ate', 'eat'],
    ['bade', 'bid'],
    ['drew', 'draw'],
    ['fed', 'feed'],
    ['led', 'lead'],
    ['lent', 'lend'],
    ['sung', 'sing'],
  ]) {
    await assertResolves(word, base)
  }
})

test('lookups that already succeeded keep the same entry', async () => {
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
    await assertResolves(word, form)
  }
})

// These plurals have only a name entry (Banks the botanist, W. C. Fields), and the
// lemmatizer would map a real name to an unrelated word (James to jam).
test('a word met in lowercase prefers the base word over a name', async () => {
  for (const [word, base] of [
    ['banks', 'bank'],
    ['fields', 'field'],
    ['laws', 'law'],
    ['gates', 'gate'],
    ['windows', 'window'],
  ]) {
    await assertResolves(word, base, { mayBeName: false })
  }
})

// The old order tried "-es" first, so "notes" showed "not" and "bites" showed "bit".
test('plurals of words ending in e drop only the s', async () => {
  for (const [word, base] of [
    ['bites', 'bite'],
    ['notes', 'note'],
    ['games', 'game'],
    ['cones', 'cone'],
    ['boxes', 'box'],
    ['wishes', 'wish'],
  ]) {
    await assertResolves(word, base)
  }
})

test('a word that may be a name keeps its name entry', async () => {
  for (const [word, name] of [
    ['james', 'James'],
    ['mars', 'Mars'],
    ['kent', 'Kent'],
    ['banks', 'Banks'],
  ]) {
    await assertResolves(word, name)
  }
})

test('a name is still found for a lowercase word with no other entry', async () => {
  const load = async () => ({ Zork: 'a made-up name' })
  assert.deepEqual(await lookupDefinition('zork', load, { mayBeName: false }), { ok: true, text: 'a made-up name' })
})

test('a word whose best sense is a name keeps its ordinary sense too', async () => {
  await assertResolves('august', 'August')
  await assertResolves('august', 'august', { mayBeName: false })
  assert.notEqual(await gloss('august'), await gloss('August'))
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
