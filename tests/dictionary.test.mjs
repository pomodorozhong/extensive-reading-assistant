import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { dictionaryForms } from '../src/lib/dictionary.ts'

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
