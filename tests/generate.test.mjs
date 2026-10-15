import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { createGeneratedStory, generateStory, parseGeneratedStory } from '../src/lib/generate.ts'
import { DEFAULT_MODEL, initialGenerationChoices } from '../src/lib/generation-options.ts'
import { DEFAULT_SETTINGS, getStory, loadSettings, loadStories, saveSettings, upsertStory } from '../src/lib/storage.ts'

const apiKey = 'synthetic-generation-test-key-do-not-send'
const settings = { ...DEFAULT_SETTINGS, cefrLevel: 'C2', model: 'saved-custom-model', apiKey }
const choices = { level: 'B1', theme: '  A weekend in Tokyo  ', readingMinutes: 5, model: DEFAULT_MODEL }
const responseText = 'Title: "A Weekend"\n\nA friend visits a garden.\n\nTHE END.'

beforeEach((t) => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Unexpected request; tests must mock Gemini') })
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

function mockGemini(t, data = { candidates: [{ content: { parts: [{ text: responseText }] }, finishReason: 'STOP' }] }, status = 200) {
  const requests = []
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url, ...init, json: JSON.parse(init.body) })
    return Response.json(data, { status })
  })
  return requests
}

test('initial choices default to A2 and ten minutes while preserving a saved level and excluding credentials', () => {
  assert.equal(initialGenerationChoices(loadSettings()).level, 'A2')
  assert.equal(initialGenerationChoices(loadSettings()).readingMinutes, 10)
  localStorage.setItem('era.v1.settings', JSON.stringify({ cefrLevel: 'invalid' }))
  assert.equal(initialGenerationChoices(loadSettings()).level, 'A2')
  const original = structuredClone(settings)
  const initial = initialGenerationChoices(settings)
  assert.equal(initial.level, 'C2')
  assert.equal(initial.readingMinutes, 10)
  assert.equal(initial.model, 'gemini-3.1-flash-lite')
  assert.equal(initial.theme, '')
  assert.ok(!JSON.stringify(initial).includes(apiKey))
  assert.deepEqual(settings, original)
  assert.equal(initialGenerationChoices({ ...settings, model: 'models/gemini-3.1-flash-lite' }).model, DEFAULT_MODEL)
})

test('each reading length sends its agreed word band and selected level and model, rather than Settings defaults', async (t) => {
  const requests = mockGemini(t)
  for (const [readingMinutes, min, max] of [[5, 400, 600], [10, 800, 1200], [15, 1200, 1800]]) {
    const result = await generateStory({ ...choices, readingMinutes, settings: { ...settings, apiBaseUrl: `${settings.apiBaseUrl}/` } })
    const request = requests.at(-1)
    assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent')
    assert.equal(request.method, 'POST')
    assert.equal(request.headers['x-goog-api-key'], apiKey)
    const prompt = request.json.contents[0].parts[0].text
    assert.match(prompt, /CEFR B1/)
    assert.ok(!prompt.includes('CEFR C2'))
    assert.match(prompt, /Theme or topic: A weekend in Tokyo\n/)
    assert.ok(prompt.includes(`${min}-${max} words, approximately ${readingMinutes} minutes`))
    assert.ok(!request.body.includes(apiKey))
    assert.ok(!request.url.includes(apiKey))
    assert.ok(!request.body.includes('Gemini 3.1 Flash Lite'))
    assert.deepEqual(result, { ok: true, title: 'A Weekend', body: 'A friend visits a garden.\n\nTHE END.' })
  }
})

test('all six selected CEFR levels reach the prompt', async (t) => {
  const requests = mockGemini(t)
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.equal((await generateStory({ ...choices, level, settings })).ok, true)
    assert.ok(requests.at(-1).json.contents[0].parts[0].text.includes(`CEFR ${level} (`))
  }
})

test('omitted and whitespace-only themes use the original-theme instruction', async (t) => {
  const requests = mockGemini(t)
  for (const theme of [undefined, '', '   ']) {
    await generateStory({ ...choices, theme, settings })
    const prompt = requests.at(-1).json.contents[0].parts[0].text
    assert.match(prompt, /Choose a pleasant, original theme/)
    assert.ok(!prompt.includes('Theme or topic:'))
  }
})

test('generated stories persist submitted choices without changing global defaults or copying provider settings', async (t) => {
  mockGemini(t)
  saveSettings(settings)
  const submitted = { ...choices }
  const pending = generateStory({ ...submitted, settings })
  const result = await pending
  assert.equal(result.ok, true)
  const story = createGeneratedStory(result, submitted)
  upsertStory(story)
  const restored = getStory(story.id)
  assert.equal(restored.level, 'B1')
  assert.equal(restored.readingMinutes, 5)
  assert.equal(restored.theme, 'A weekend in Tokyo')
  assert.equal(restored.body, result.body)
  assert.deepEqual(restored.wordMarks, {})
  assert.deepEqual(restored.explanations, {})
  assert.ok(!JSON.stringify(restored).includes(apiKey))
  assert.ok(!('settings' in restored || 'apiKey' in restored || 'apiBaseUrl' in restored))
  assert.equal(loadSettings().cefrLevel, 'C2')
  assert.equal(loadSettings().model, 'saved-custom-model')
})

test('legacy stories still load unchanged alongside new duration metadata', () => {
  const legacy = JSON.parse(readFileSync(new URL('./fixtures/cefr-stories.json', import.meta.url), 'utf8')).stories[0]
  localStorage.setItem('era.v1.stories', JSON.stringify([legacy]))
  assert.deepEqual(getStory(legacy.id), legacy)
  const next = createGeneratedStory({ title: 'New story', body: 'A cat sits.' }, { ...choices, theme: '   ', readingMinutes: 15 })
  upsertStory(next)
  assert.deepEqual(getStory(legacy.id), legacy)
  assert.equal(getStory(legacy.id).readingMinutes, undefined)
  assert.equal(getStory(next.id).readingMinutes, 15)
  assert.ok(!('theme' in getStory(next.id)))
  assert.equal(loadStories().length, 2)
})

test('provider failures redact echoed keys from every displayed provider detail', async (t) => {
  for (const [data, status] of [
    [{ error: { message: `Rejected ${apiKey}, repeated ${apiKey}` } }, 400],
    [{ promptFeedback: { blockReason: apiKey } }, 200],
    [{ candidates: [{ finishReason: apiKey, content: { parts: [] } }] }, 200],
    [{ error: { message: apiKey } }, 401],
  ]) {
    mockGemini(t, data, status)
    const result = await generateStory({ ...choices, settings: { ...settings, apiKey: ` ${apiKey} ` } })
    assert.equal(result.ok, false)
    assert.ok(!result.message.includes(apiKey))
  }
  assert.deepEqual(loadStories(), [])
})

test('empty credentials do not corrupt an ordinary provider error', async (t) => {
  mockGemini(t, { error: { message: 'Provider unavailable' } }, 503)
  assert.deepEqual(await generateStory({ ...choices, settings: { ...settings, apiKey: '' } }), {
    ok: false, message: 'Generation failed: Provider unavailable',
  })
})

test('title and body parsing retain existing supported response formats', () => {
  for (const raw of ['Title: "A Day"\n\nA cat sits.', '# A Day\n\nA cat sits.', 'A Day\nA cat sits.', '```text\nTitle: A Day\n\nA cat sits.\n```']) {
    assert.deepEqual(parseGeneratedStory(raw), { title: 'A Day', body: 'A cat sits.' })
  }
  assert.deepEqual(parseGeneratedStory('A cat sits.'), { title: 'Untitled story', body: 'A cat sits.' })
})
