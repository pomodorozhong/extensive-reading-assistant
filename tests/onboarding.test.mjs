import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import {
  isOnboardingOpen,
  loadOnboardingOutcome,
  saveOnboardingOutcome,
  setOnboardingOpen,
  shouldOfferOnboarding,
  subscribeOnboarding,
} from '../src/lib/onboarding.ts'

let values

beforeEach(() => {
  values = new Map()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    },
  })
  setOnboardingOpen(false)
})

test('a new reader with no stories is offered the introduction', () => {
  assert.equal(loadOnboardingOutcome(), null)
  assert.equal(shouldOfferOnboarding(), true)
})

test('finishing or skipping is remembered and stops the offer', () => {
  for (const outcome of ['completed', 'skipped']) {
    values.clear()
    saveOnboardingOutcome(outcome)
    assert.equal(loadOnboardingOutcome(), outcome)
    assert.equal(shouldOfferOnboarding(), false)
  }
})

test('readers who already have stories are not interrupted', () => {
  values.set('era.v1.stories', JSON.stringify([{ id: 's1', body: 'A story.' }]))
  assert.equal(shouldOfferOnboarding(), false)
})

test('saving the outcome writes only the onboarding entry', () => {
  const existing = {
    'era.v1.settings': JSON.stringify({ cefrLevel: 'B1' }),
    'era.v1.stories': JSON.stringify([{ id: 's1', body: 'A story.', wordMarks: { fox: 'unknown' } }]),
    'era.v1.vocabulary': JSON.stringify([{ key: 'fox', word: 'fox' }]),
    'era.v1.gemini-key': 'synthetic-key-onboarding-test',
  }
  for (const [key, value] of Object.entries(existing)) values.set(key, value)
  saveOnboardingOutcome('completed')
  assert.deepEqual(Object.fromEntries(values), { ...existing, 'era.v1.onboarding': 'completed' })
})

test('an unrecognized stored value counts as not seen', () => {
  values.set('era.v1.onboarding', 'maybe')
  assert.equal(loadOnboardingOutcome(), null)
})

test('opening from anywhere notifies subscribers once per change', () => {
  let calls = 0
  const unsubscribe = subscribeOnboarding(() => calls++)
  setOnboardingOpen(true)
  setOnboardingOpen(true)
  assert.equal(isOnboardingOpen(), true)
  setOnboardingOpen(false)
  unsubscribe()
  setOnboardingOpen(true)
  assert.equal(calls, 2)
})
