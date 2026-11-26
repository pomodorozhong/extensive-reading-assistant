import assert from 'node:assert/strict'
import { test } from 'node:test'
import { splitSectionBreaks, tokenize } from '../src/lib/tokenize.ts'

test('a whole line of three or more asterisks, hyphens, or underscores is a break, with its blank lines', () => {
  for (const line of ['***', '* * *', '  ****  ', '---', '- - -', '___']) {
    assert.deepEqual(splitSectionBreaks(`,\n\n${line}\n\n`), [',', ''], line)
    assert.deepEqual(splitSectionBreaks(`.\n${line}\n`), ['.', ''], line)
  }
  assert.deepEqual(splitSectionBreaks('.\n***\n---\n'), ['.', '', ''])
})

test('a break at the very start or end of the story counts, since those token edges are line edges', () => {
  assert.deepEqual(splitSectionBreaks('***\n\n', true, false), ['', ''])
  assert.deepEqual(splitSectionBreaks('.\n\n***', false, true), ['.', ''])
  assert.deepEqual(splitSectionBreaks('***', true, true), ['', ''])
  assert.deepEqual(splitSectionBreaks('.\n', false, true), ['.\n'])
  assert.deepEqual(splitSectionBreaks('"', true, false), ['"'])
})

test('text that is not a whole break line stays as it is', () => {
  for (const text of [', ', '.\n\n', '!\n\n**\n\n', ' *** ', '\n***', '***\n', '\n*-*\n', '. — ', '\n\n*Thump.']) {
    assert.deepEqual(splitSectionBreaks(text), [text], JSON.stringify(text))
  }
})

test('breaks never change word tokens, so saved word positions stay valid', () => {
  const body = 'Best wishes,\n\nElena\n\n***\n\nDear Elena,'
  const tokens = tokenize(body)
  const words = tokens.filter((token) => token.type === 'word').map((token) => token.value)
  assert.deepEqual(words, ['Best', 'wishes', 'Elena', 'Dear', 'Elena'])
  const between = tokens.find((token) => token.value.includes('***'))
  assert.deepEqual(splitSectionBreaks(between.value), ['', ''])
})
