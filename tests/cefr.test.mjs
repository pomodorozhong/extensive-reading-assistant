import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { analyzeVocabulary } from '../src/lib/cefr.ts'

test('representative dataset entries and cumulative thresholds cover A1–C2', () => {
  const words = ['cat', 'adventure', 'abandon', 'accommodation', 'concur', 'ephemeral']
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  for (const [index, target] of levels.entries()) {
    const report = analyzeVocabulary(words.join(' '), target)
    assert.equal(report.total, 6)
    assert.equal(report.unlistedCount, 0)
    assert.equal(report.aboveCount, 5 - index)
    assert.deepEqual(report.aboveLevel.map((entry) => entry.level).sort(), levels.slice(index + 1))
  }
})

test('counts occurrences rather than distinct words, includes unlisted in denominator', () => {
  const report = analyzeVocabulary('Cat, CONCUR concur ephemeral Zorblax.', 'A1')
  assert.equal(report.total, 5)
  assert.equal(report.aboveCount, 3)
  assert.equal(report.abovePercent, 60)
  assert.equal(report.aboveLevel[0].count, 2)
  assert.equal(report.unlistedCount, 1)
})

test('handles common regular and irregular inflections and possessives', () => {
  const report = analyzeVocabulary("cats dogs studies walked walking stopped running children went knives dog's happier", 'A1')
  assert.equal(report.total, 12)
  assert.equal(report.unlistedCount, 0)
  // Exact A2 noun entries for running/walking take precedence over verb stemming.
  assert.equal(report.aboveCount, 2)
  assert.deepEqual(report.aboveLevel.map((entry) => entry.word), ['running', 'walking'])
  assert.equal(analyzeVocabulary('concurred concurring', 'B2').aboveCount, 2)
})

test('expands straight and curly contractions but counts each original token once', () => {
  const report = analyzeVocabulary("I'm she’s can't won’t didn’t we've they'd you're it'll let's", 'A1')
  assert.equal(report.total, 10)
  assert.equal(report.unlistedCount, 0)
  assert.equal(report.aboveCount, 0)
  assert.equal(analyzeVocabulary("zorblax'll", 'A1').unlistedCount, 1)
})

test('names follow ordinary case-insensitive lookup; punctuation and numbers are excluded', () => {
  const report = analyzeVocabulary('Zorblax ZORBLAX Cat — 123 !!! cat-dog', 'C2')
  assert.equal(report.total, 5)
  assert.equal(report.unlisted[0].word, 'zorblax')
  assert.equal(report.unlisted[0].count, 2)
  assert.equal(report.aboveCount, 0)
  assert.equal(analyzeVocabulary('123 ...', 'A1').abovePercent, 0)
  assert.equal(analyzeVocabulary('', 'C2').total, 0)
})

test('prototype-like and non-Latin words are safely unlisted', () => {
  assert.equal(analyzeVocabulary('constructor toString 你好', 'A1').unlistedCount, 3)
})

test('duplicate senses use lowest level, without stripping already listed forms', () => {
  assert.equal(analyzeVocabulary('complexity', 'B2').aboveCount, 0)
  assert.equal(analyzeVocabulary('abandoned', 'B1').aboveCount, 1)
})

test('saved fixture uses recorded level even when Settings has a different level', () => {
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/cefr-stories.json', import.meta.url), 'utf8'))
  assert.equal(fixture.settings.cefrLevel, 'C2')
  const report = analyzeVocabulary(fixture.stories[0].body, fixture.stories[0].level)
  assert.equal(report.target, 'A1')
  assert.equal(report.total, 8)
  assert.equal(report.aboveCount, 3)
  assert.equal(report.abovePercent, 37.5)
  assert.equal(report.unlistedCount, 1)
})
