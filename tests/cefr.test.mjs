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

test('undetected words retain case-insensitive lookup; punctuation and numbers are excluded', () => {
  const report = analyzeVocabulary('Zorblax ZORBLAX Cat — 123 !!! cat-dog', 'C2')
  assert.equal(report.total, 5)
  assert.equal(report.unlisted[0].word, 'zorblax')
  assert.equal(report.unlisted[0].count, 2)
  assert.equal(report.aboveCount, 0)
  assert.equal(analyzeVocabulary('123 ...', 'A1').abovePercent, 0)
  assert.equal(analyzeVocabulary('', 'C2').total, 0)
})

test('morphology resolves irregular verbs without assigning levels to missing base words', () => {
  const report = analyzeVocabulary('sat drank drove wagged woof', 'A1')
  assert.equal(report.total, 5)
  assert.deepEqual(report.unlisted.map((entry) => entry.word), ['wagged', 'woof'])
  assert.equal(report.aboveCount, 0)
})

test('detected names and possessives are excluded from both vocabulary lists and denominator', () => {
  const report = analyzeVocabulary("Sarah concurred. Sarah’s cat drank. Sarah's dog drove home.", 'A1')
  assert.equal(report.wordCount, 9)
  assert.equal(report.nameCount, 3)
  assert.equal(report.total, 6)
  assert.equal(report.aboveCount, 1)
  assert.ok(Math.abs(report.abovePercent - 100 / 6) < 1e-10)
  assert.equal(report.unlistedCount, 0)
  assert.deepEqual(report.names.map(({ word, count }) => ({ word, count })), [
    { word: "sarah's", count: 2 }, { word: 'sarah', count: 1 },
  ])
  const namesOnly = analyzeVocabulary('Sarah Sarah Sarah', 'A1')
  assert.equal(namesOnly.total, 0)
  assert.equal(namesOnly.abovePercent, 0)
  assert.equal(namesOnly.nameCount, 3)
})

test('name detection uses occurrence spans rather than a lowercase blacklist', () => {
  const report = analyzeVocabulary('Mark said hello. Please mark the paper.', 'A1')
  assert.equal(report.nameCount, 1)
  assert.equal(report.names[0].word, 'mark')
  assert.equal(report.total, 6)
  // The common verb mark is still analyzed (B1), despite the earlier name.
  assert.equal(report.aboveLevel.find((entry) => entry.word === 'mark')?.count, 1)
  assert.equal(report.wordCount, report.total + report.nameCount)
})

test('prototype-like and non-Latin words are safely unlisted', () => {
  assert.equal(analyzeVocabulary('constructor toString 你好', 'A1').unlistedCount, 3)
})

test('duplicate senses use lowest level, without stripping already listed forms', () => {
  assert.equal(analyzeVocabulary('complexity', 'B2').aboveCount, 0)
  assert.equal(analyzeVocabulary('abandoned', 'B1').aboveCount, 1)
})

test('additional irregular verbs use their existing lemma levels', () => {
  const report = analyzeVocabulary('Met met became understood', 'A1')
  assert.equal(report.total, 4)
  assert.equal(report.unlistedCount, 0)
  assert.equal(report.aboveCount, 1)
  assert.deepEqual(report.aboveLevel[0], {
    word: 'understood', count: 1, level: 'A2', lemmas: ['understand'],
  })
  assert.equal(analyzeVocabulary('met became understood', 'A2').aboveCount, 0)
})

test('reviewed spelling alias preserves level and original displayed spelling', () => {
  const report = analyzeVocabulary('Tranquillity tranquillity tranquility', 'B2')
  assert.equal(report.total, 3)
  assert.equal(report.unlistedCount, 0)
  assert.equal(report.aboveCount, 3)
  assert.deepEqual(report.aboveLevel[0], {
    word: 'tranquillity', count: 2, level: 'C1', lemmas: ['tranquility'],
  })
  assert.equal(analyzeVocabulary('tranquillity', 'C1').aboveCount, 0)
})

test('derivations and missing base words do not inherit a related word level', () => {
  const words = 'unused incidental measurable promotional solely allocation belies collective communal countable discerning eclipse inadequacy ownership transience uncomplicated unequal'
  assert.equal(analyzeVocabulary(words, 'C2').unlistedCount, 17)
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
