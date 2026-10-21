import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../src/lib/storage.ts'

const apiKey = 'synthetic-key-storage-test-do-not-send'
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
  // Reset the in-memory key left by the previous test.
  saveSettings({ ...DEFAULT_SETTINGS })
  values.clear()
})

function storedText() {
  return [...values.values()].join('\n')
}

test('keys are remembered by default in their own entry, outside the settings object', () => {
  assert.equal(loadSettings().rememberApiKey, true)
  saveSettings({ ...DEFAULT_SETTINGS, apiKey, cefrLevel: 'B2' })
  assert.equal(values.get('era.v1.gemini-key'), apiKey)
  assert.ok(!values.get('era.v1.settings').includes(apiKey))
  assert.equal(loadSettings().apiKey, apiKey)
  assert.equal(loadSettings().cefrLevel, 'B2')
})

test('a key saved by an earlier version moves to its own entry and stays remembered', () => {
  values.set('era.v1.settings', JSON.stringify({ cefrLevel: 'C1', apiKey, model: 'gemini-3.1-flash-lite' }))
  const settings = loadSettings()
  assert.equal(settings.apiKey, apiKey)
  assert.equal(settings.rememberApiKey, true)
  assert.equal(settings.cefrLevel, 'C1')
  assert.equal(values.get('era.v1.gemini-key'), apiKey)
  assert.ok(!values.get('era.v1.settings').includes(apiKey))
})

test('a legacy key is still read when moving it fails', () => {
  values.set('era.v1.settings', JSON.stringify({ cefrLevel: 'C1', apiKey }))
  localStorage.setItem = () => { throw new Error('QuotaExceededError') }
  assert.equal(loadSettings().apiKey, apiKey)
  assert.equal(loadSettings().cefrLevel, 'C1')
})

test('a key the reader chooses not to remember stays in memory only', () => {
  saveSettings({ ...DEFAULT_SETTINGS, apiKey })
  saveSettings({ ...loadSettings(), rememberApiKey: false })
  assert.ok(!storedText().includes(apiKey))
  assert.equal(values.has('era.v1.gemini-key'), false)
  assert.equal(loadSettings().apiKey, apiKey)
  assert.equal(loadSettings().rememberApiKey, false)
})

test('turning remembering back on stores the in-memory key again', () => {
  saveSettings({ ...DEFAULT_SETTINGS, rememberApiKey: false, apiKey })
  saveSettings({ ...loadSettings(), rememberApiKey: true })
  assert.equal(values.get('era.v1.gemini-key'), apiKey)
  assert.equal(loadSettings().apiKey, apiKey)
})

test('forgetting the key clears it from storage and memory but keeps other settings', () => {
  for (const rememberApiKey of [true, false]) {
    saveSettings({ ...DEFAULT_SETTINGS, rememberApiKey, apiKey, cefrLevel: 'B1' })
    saveSettings({ ...loadSettings(), apiKey: '' })
    assert.ok(!storedText().includes(apiKey))
    assert.equal(loadSettings().apiKey, '')
    assert.equal(loadSettings().cefrLevel, 'B1')
    assert.equal(loadSettings().rememberApiKey, rememberApiKey)
  }
})
