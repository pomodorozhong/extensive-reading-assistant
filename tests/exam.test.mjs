import assert from 'node:assert/strict'
import test from 'node:test'
import {
  makeVocabularyQuestions,
  parseReadingQuestions,
  practiceMissedQuestions,
} from '../src/lib/exam.ts'

const valid = { question: 'Why?', options: ['a', 'b', 'c', 'd'], correct: 2, explanation: 'Because.' }

test('reading questions are parsed from plain or fenced JSON', () => {
  assert.equal(parseReadingQuestions(JSON.stringify([valid])).length, 1)
  assert.equal(parseReadingQuestions('```json\n' + JSON.stringify([valid]) + '\n```').length, 1)
})

test('malformed reading questions are dropped', () => {
  const bad = [
    { ...valid, options: ['a', 'b'] },
    { ...valid, correct: 4 },
    { ...valid, question: '' },
    valid,
  ]
  assert.deepEqual(parseReadingQuestions(JSON.stringify(bad)).map((q) => q.question), ['Why?'])
  assert.deepEqual(parseReadingQuestions('not json'), [])
  assert.deepEqual(parseReadingQuestions('{"a":1}'), [])
})

const targets = ['alpha', 'beta', 'gamma', 'delta'].map((word) => ({
  word,
  definition: `meaning of ${word}`,
  sentence: `A sentence with ${word}.`,
  story: 'Story',
}))
const definitions = [...targets.map((target) => target.definition), 'meaning of epsilon']

test('vocabulary questions put the right definition among three others', () => {
  const questions = makeVocabularyQuestions(targets, definitions, 3)
  assert.equal(questions.length, 3)
  for (const question of questions) {
    assert.equal(question.options.length, 4)
    assert.equal(new Set(question.options).size, 4)
    assert.equal(question.options[question.correct], question.definition)
  }
})

test('too few definitions give no questions', () => {
  assert.deepEqual(makeVocabularyQuestions(targets.slice(0, 1), ['meaning of alpha', 'x'], 5), [])
})

test('practice rebuilds questions only for missed words', () => {
  const questions = makeVocabularyQuestions(targets, definitions, 4)
  const answers = questions.map((question, index) => (index === 0 ? (question.correct + 1) % 4 : question.correct))
  const practice = practiceMissedQuestions(questions, answers)
  assert.deepEqual(practice.map((question) => question.word), [questions[0].word])
})
