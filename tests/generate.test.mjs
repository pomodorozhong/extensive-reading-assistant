import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { checkGeminiEndpoint, GEMINI_API_BASE_URL } from '../src/lib/gemini-endpoint.ts'
import { readFileSync } from 'node:fs'
import { createGeneratedStory, generateStory, parseGeneratedStory } from '../src/lib/generate.ts'
import { cleanTextType, DEFAULT_MODEL, generationNotes, initialGenerationChoices, lockedTextTypes, TEXT_TYPE_INFO, textTypeLevelRange, textTypesForLevel, TOPIC_EXAMPLES, topicExamples } from '../src/lib/generation-options.ts'
import { CEFR_LEVELS, TEXT_MODES, TEXT_TYPES } from '../src/types.ts'
import { clearNewStoryDraft, loadNewStoryDraft, saveNewStoryDraft } from '../src/lib/new-story-draft.ts'
import { storyDetails } from '../src/lib/story-details.ts'
import { DEFAULT_SETTINGS, getStory, loadSettings, loadStories, loadVocabulary, saveSettings, trySaveNewStory, upsertStory } from '../src/lib/storage.ts'

const apiKey = 'synthetic-generation-test-key-do-not-send'
const settings = { ...DEFAULT_SETTINGS, cefrLevel: 'C2', model: 'saved-custom-model', apiKey }
const choices = { level: 'B1', topic: '  A weekend in Tokyo  ', textType: null, tone: null, pointOfView: null, readingMinutes: 5, model: DEFAULT_MODEL }
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
  assert.equal(initial.topic, '')
  assert.equal(initial.textType, null)
  assert.equal(initial.tone, null)
  assert.equal(initial.pointOfView, null)
  assert.equal(initial.variedSentences, true)
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
    assert.match(prompt, /\nTopic: A weekend in Tokyo\n/)
    assert.ok(prompt.includes(`${min}-${max} words, approximately ${readingMinutes} minutes`))
    assert.ok(!request.body.includes(apiKey))
    assert.ok(!request.url.includes(apiKey))
    assert.ok(!request.body.includes('Gemini 3.1 Flash Lite'))
    assert.deepEqual(result, {
      ok: true,
      title: 'A Weekend',
      body: 'A friend visits a garden.\n\nTHE END.',
      generation: {
        model: 'gemini-3.1-flash-lite',
        temperature: request.json.generationConfig.temperature,
        minWords: min,
        maxWords: max,
        systemPrompt: request.json.systemInstruction.parts[0].text,
        userPrompt: prompt,
      },
    })
  }
})

test('all six selected CEFR levels reach the prompt', async (t) => {
  const requests = mockGemini(t)
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.equal((await generateStory({ ...choices, level, settings })).ok, true)
    assert.ok(requests.at(-1).json.contents[0].parts[0].text.includes(`CEFR ${level} (`))
  }
})

test('omitted and whitespace-only topics use the original-topic instruction', async (t) => {
  const requests = mockGemini(t)
  for (const topic of [undefined, '', '   ']) {
    await generateStory({ ...choices, topic, settings })
    const prompt = requests.at(-1).json.contents[0].parts[0].text
    assert.match(prompt, /Choose a pleasant, original topic/)
    assert.ok(!prompt.includes('Topic:'))
  }
})

test('without text type, tone, or point of view the prompt leaves them to the model', async (t) => {
  const requests = mockGemini(t)
  await generateStory({ ...choices, settings })
  const prompt = requests.at(-1).json.contents[0].parts[0].text
  assert.match(prompt, /^Write a complete story at CEFR B1 /)
  for (const line of ['Text type:', 'Tone:', 'Tell it in the', 'Do not invent words', 'Keep facts accurate']) {
    assert.ok(!prompt.includes(line), line)
  }
  assert.match(prompt, /Fill the story with as much dialogue as possible/)
})

test('a text type, tone, and point of view each reach the prompt', async (t) => {
  const requests = mockGemini(t)
  await generateStory({ ...choices, textType: 'fable', tone: 'cozy', pointOfView: 'first', settings })
  const prompt = requests.at(-1).json.contents[0].parts[0].text
  assert.match(prompt, /^Write a complete fable at CEFR B1 /)
  assert.match(prompt, /\nText type: Fable — animals or simple characters, a short plot, and a clear lesson stated at the end\.\n/)
  assert.match(prompt, /\nTone: cozy\.\n/)
  assert.match(prompt, /\nTell it in the first person, as "I"\.\n/)
  await generateStory({ ...choices, pointOfView: 'third', settings })
  assert.match(requests.at(-1).json.contents[0].parts[0].text, /\nTell it in the third person\.\n/)
})

test('a form with its own point of view overrides the reader choice, in the prompt and the saved story', async (t) => {
  const requests = mockGemini(t)
  for (const textType of ['diary', 'instructions']) {
    await generateStory({ ...choices, textType, pointOfView: 'third', settings })
    assert.ok(!requests.at(-1).json.contents[0].parts[0].text.includes('Tell it in the'), textType)
    const story = createGeneratedStory({ title: 'T', body: 'B' }, { ...choices, textType, pointOfView: 'third' })
    assert.ok(!('pointOfView' in story), textType)
  }
})

test('each text type sets its own dialogue line, and a play script relies on its guide', async (t) => {
  const requests = mockGemini(t)
  for (const [textType, expected] of [
    ['short-story', 'Fill the story with as much dialogue as possible.'],
    ['letter', 'Use dialogue only where it fits naturally.'],
    ['play-script', null],
  ]) {
    await generateStory({ ...choices, textType, settings })
    const prompt = requests.at(-1).json.contents[0].parts[0].text
    assert.equal(prompt.includes('as much dialogue as possible'), expected?.startsWith('Fill') ?? false, textType)
    assert.equal(prompt.includes('only where it fits naturally'), expected?.startsWith('Use') ?? false, textType)
  }
  assert.match(requests.at(-1).json.contents[0].parts[0].text, /speaker's name and a colon/)
})

test('stories avoid made-up words at A1 and A2, while real-life and practical forms do not need the rule', async (t) => {
  const requests = mockGemini(t)
  for (const [level, textType, expected] of [
    ['A2', null, true], ['A1', 'fairy-tale', true], ['A2', 'myth', true], ['B1', 'short-story', false], ['A2', 'letter', false],
  ]) {
    await generateStory({ ...choices, level, textType, settings })
    const prompt = requests.at(-1).json.contents[0].parts[0].text
    assert.equal(prompt.includes('Do not invent words'), expected, `${level} ${textType}`)
  }
})

test('factual forms ask for accurate facts and explained topic words', async (t) => {
  const requests = mockGemini(t)
  for (const [textType, expected] of [['expository', true], ['biography', true], ['news-report', false]]) {
    await generateStory({ ...choices, textType, settings })
    assert.equal(requests.at(-1).json.contents[0].parts[0].text.includes('do not invent statistics, dates, or quotes'), expected, textType)
  }
})

test('topic examples follow the chosen text type and notes explain how choices shape the text', () => {
  assert.deepEqual(topicExamples(null), TOPIC_EXAMPLES)
  assert.deepEqual(topicExamples('letter'), TEXT_TYPE_INFO.letter.examples)
  assert.deepEqual(generationNotes({ level: 'B1', textType: null, pointOfView: null }), [])
  assert.deepEqual(generationNotes({ level: 'A2', textType: null, pointOfView: null }), [])
  assert.deepEqual(generationNotes({ level: 'A2', textType: 'myth', pointOfView: null }), [
    'At A2, made-up words are left out, so every word can still be looked up.',
  ])
  assert.deepEqual(generationNotes({ level: 'B1', textType: 'expository', pointOfView: null }), [
    'Topic words are explained in the text the first time they appear.',
  ])
  assert.deepEqual(generationNotes({ level: 'A1', textType: null, pointOfView: 'third' }), ['First person is often easier to follow at A1.'])
  assert.deepEqual(generationNotes({ level: 'A1', textType: 'diary', pointOfView: 'third' }), [])
})

test('every mode offers a form at every level, and each level offers only the forms whose range includes it', () => {
  assert.equal(TEXT_TYPES.length, 16)
  for (const textType of TEXT_TYPES) {
    const [lowest, highest] = TEXT_TYPE_INFO[textType].levels
    assert.ok(CEFR_LEVELS.indexOf(lowest) <= CEFR_LEVELS.indexOf(highest), textType)
    assert.equal(TEXT_TYPE_INFO[textType].examples.length, 3, textType)
  }
  for (const level of CEFR_LEVELS) {
    for (const mode of TEXT_MODES) assert.ok(textTypesForLevel(mode, level).length > 0, `${mode} ${level}`)
  }
  assert.ok(textTypesForLevel('stories', 'A1').includes('fairy-tale'))
  assert.ok(!textTypesForLevel('stories', 'C1').includes('fairy-tale'))
  assert.ok(!textTypesForLevel('ideas', 'A2').includes('argumentative'))
  assert.ok(textTypesForLevel('ideas', 'B1').includes('argumentative'))
  assert.deepEqual(lockedTextTypes('real-life', 'A2'), ['biography'])
  assert.deepEqual(lockedTextTypes('real-life', 'B1'), [])
  assert.equal(textTypeLevelRange('reflective'), 'B1–C2')
  assert.equal(cleanTextType('argumentative', 'A2'), null)
  assert.equal(cleanTextType('argumentative', 'B2'), 'argumentative')
  assert.equal(cleanTextType('mystery', 'B2'), null)
})

test('a text type outside the level never reaches the prompt or the saved story', async (t) => {
  const requests = mockGemini(t)
  await generateStory({ ...choices, level: 'A1', textType: 'argumentative', settings })
  const prompt = requests.at(-1).json.contents[0].parts[0].text
  assert.match(prompt, /^Write a complete story at CEFR A1 /)
  assert.ok(!prompt.includes('Text type:'))
  const story = createGeneratedStory({ title: 'T', body: 'B' }, { ...choices, level: 'C2', textType: 'fairy-tale' })
  assert.ok(!('textType' in story))
})

test('generated stories persist submitted choices without changing global defaults or copying provider settings', async (t) => {
  const requests = mockGemini(t)
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
  assert.equal(restored.topic, 'A weekend in Tokyo')
  const sent = requests.at(-1).json
  assert.deepEqual(restored.generation, {
    model: DEFAULT_MODEL,
    temperature: 0.7,
    minWords: 400,
    maxWords: 600,
    systemPrompt: sent.systemInstruction.parts[0].text,
    userPrompt: sent.contents[0].parts[0].text,
  })
  assert.ok(!('textType' in restored || 'tone' in restored || 'pointOfView' in restored))
  const styled = createGeneratedStory(result, { ...submitted, textType: 'fable', tone: 'funny', pointOfView: 'third' })
  upsertStory(styled)
  const restoredStyled = getStory(styled.id)
  assert.equal(restoredStyled.textType, 'fable')
  assert.equal(restoredStyled.tone, 'funny')
  assert.equal(restoredStyled.pointOfView, 'third')
  assert.ok(!('variedSentences' in restored))
  for (const variedSentences of [true, false]) {
    const saved = createGeneratedStory(result, { ...submitted, variedSentences })
    upsertStory(saved)
    assert.equal(getStory(saved.id).variedSentences, variedSentences)
  }
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
  const next = createGeneratedStory({ title: 'New story', body: 'A cat sits.' }, { ...choices, topic: '   ', readingMinutes: 15 })
  upsertStory(next)
  assert.deepEqual(getStory(legacy.id), legacy)
  assert.equal(getStory(legacy.id).readingMinutes, undefined)
  assert.equal(getStory(legacy.id).generation, undefined)
  assert.ok(!('generation' in getStory(next.id)))
  assert.equal(getStory(next.id).readingMinutes, 15)
  assert.ok(!('topic' in getStory(next.id)))
  assert.equal(loadStories().length, 2)
})

test('stories saved with a theme load it as their topic', () => {
  localStorage.setItem('era.v1.stories', JSON.stringify([
    { id: 'old', title: 'Old', body: 'A cat sits.', level: 'A2', theme: 'Rain', createdAt: '2026-01-01T00:00:00.000Z', wordMarks: {}, explanations: {} },
    { id: 'both', title: 'Both', body: 'A dog runs.', level: 'A2', theme: 'Old name', topic: 'New name', createdAt: '2026-01-01T00:00:00.000Z' },
  ]))
  const [old, both] = loadStories()
  assert.equal(old.topic, 'Rain')
  assert.ok(!('theme' in old))
  assert.equal(both.topic, 'New name')
  assert.ok(!('theme' in both))
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

test('each provider failure produces its own inline message and saves nothing', async (t) => {
  const cases = [
    [{ error: { message: 'bad key' } }, 401, /rejected the key/],
    [{ error: { message: 'Quota exceeded' } }, 429, /too many requests.*rate limit/],
    [{ error: { message: 'Backend error' } }, 503, /Generation failed: Backend error/],
    [{ promptFeedback: { blockReason: 'SAFETY' } }, 200, /blocked the prompt \(SAFETY\)/],
    [{ candidates: [{ content: { parts: [] }, finishReason: 'STOP' }] }, 200, /empty response/],
    [{ candidates: [{ content: { parts: [{ text: 'Title: Half\n\nThe story began' }] }, finishReason: 'MAX_TOKENS' }] }, 200, /stopped before the story was finished \(MAX_TOKENS\)/],
    [{ candidates: [{ content: { parts: 'not-a-list' } }] }, 200, /empty response/],
    [null, 200, /could not be read/],
    [[1, 2], 200, /could not be read/],
  ]
  for (const [data, status, pattern] of cases) {
    mockGemini(t, data, status)
    const result = await generateStory({ ...choices, settings })
    assert.equal(result.ok, false)
    assert.match(result.message, pattern)
    assert.ok(!result.canceled)
  }
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>oops</html>', { status: 200 }))
  assert.match((await generateStory({ ...choices, settings })).message, /could not be read/)
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch') })
  assert.match((await generateStory({ ...choices, settings })).message, /Could not reach Gemini/)
  assert.deepEqual(loadStories(), [])
})

test('aborting a slow request reports a cancellation instead of a failure', async (t) => {
  t.mock.method(globalThis, 'fetch', (_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
  }))
  const controller = new AbortController()
  const pending = generateStory({ ...choices, settings, signal: controller.signal })
  controller.abort()
  assert.deepEqual(await pending, { ok: false, message: 'Story generation was canceled.', canceled: true })
  assert.deepEqual(loadStories(), [])
})

test('a failed save reports false and leaves saved stories and vocabulary unchanged', () => {
  const existing = createGeneratedStory({ title: 'Kept', body: 'A cat sits.' }, choices)
  existing.wordMarks = { cat: 'unknown' }
  upsertStory(existing)
  const vocabularyBefore = JSON.stringify(loadVocabulary())
  const storage = globalThis.localStorage
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      ...storage,
      setItem: (key, value) => {
        if (key === 'era.v1.stories') throw new Error('QuotaExceededError')
        storage.setItem(key, value)
      },
    },
  })
  const story = createGeneratedStory({ title: 'New', body: 'A dog runs.' }, choices)
  assert.equal(trySaveNewStory(story), false)
  assert.deepEqual(loadStories().map((item) => item.id), [existing.id])
  assert.equal(JSON.stringify(loadVocabulary()), vocabularyBefore)
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
  assert.equal(trySaveNewStory(story), true)
  assert.deepEqual(loadStories().map((item) => item.id), [story.id, existing.id])
})

test('an unfinished draft survives a reload and keeps only the non-secret choices', () => {
  saveSettings(settings)
  const fresh = initialGenerationChoices(loadSettings())
  assert.deepEqual(loadNewStoryDraft(fresh), fresh)
  saveNewStoryDraft({ ...choices, level: 'B2', readingMinutes: 15, textType: 'fable', tone: 'thoughtful', pointOfView: 'first', variedSentences: false, apiKey, apiBaseUrl: settings.apiBaseUrl })
  const raw = localStorage.getItem('era.v1.new-story-draft')
  assert.ok(!raw.includes(apiKey))
  assert.ok(!raw.includes('googleapis'))
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['level', 'model', 'pointOfView', 'readingMinutes', 'textType', 'tone', 'topic', 'variedSentences'])
  assert.deepEqual(loadNewStoryDraft(fresh), {
    level: 'B2', topic: '  A weekend in Tokyo  ', textType: 'fable', tone: 'thoughtful', pointOfView: 'first', variedSentences: false, readingMinutes: 15, model: DEFAULT_MODEL,
  })
  saveNewStoryDraft({ ...choices, tone: 'cozy' })
  saveNewStoryDraft({ ...choices, tone: null })
  assert.equal(loadNewStoryDraft({ ...fresh, tone: 'tense' }).tone, null)
  assert.equal(loadSettings().apiKey, apiKey)
  assert.equal(loadSettings().cefrLevel, 'C2')
})

test('invalid or legacy draft fields fall back individually, and clearing restores fresh choices', () => {
  const fresh = initialGenerationChoices(loadSettings())
  localStorage.setItem('era.v1.new-story-draft', JSON.stringify({ theme: 'Rain', level: 'Z9', readingMinutes: 7, model: 'gpt-4' }))
  assert.deepEqual(loadNewStoryDraft(fresh), { ...fresh, topic: 'Rain' })
  localStorage.setItem('era.v1.new-story-draft', JSON.stringify({ topic: 'Snow', theme: 'Rain', textType: 'letter', tone: 'grim', pointOfView: 'second' }))
  assert.deepEqual(loadNewStoryDraft(fresh), { ...fresh, topic: 'Snow', textType: 'letter' })
  localStorage.setItem('era.v1.new-story-draft', JSON.stringify({ textType: 'mystery', genres: ['fable'], topic: 7, variedSentences: 'yes' }))
  assert.deepEqual(loadNewStoryDraft(fresh), fresh)
  localStorage.setItem('era.v1.new-story-draft', JSON.stringify({ level: 'A1', textType: 'argumentative' }))
  assert.equal(loadNewStoryDraft(fresh).textType, null)
  for (const raw of ['not json', '[]', '"text"', 'null']) {
    localStorage.setItem('era.v1.new-story-draft', raw)
    assert.deepEqual(loadNewStoryDraft(fresh), fresh)
  }
  saveNewStoryDraft({ ...choices, level: 'C1' })
  clearNewStoryDraft()
  assert.deepEqual(loadNewStoryDraft(fresh), fresh)
  assert.deepEqual(loadStories(), [])
})

test('draft storage failures do not throw', () => {
  const failing = () => { throw new Error('QuotaExceededError') }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: failing, setItem: failing, removeItem: failing },
  })
  const fresh = initialGenerationChoices(DEFAULT_SETTINGS)
  assert.doesNotThrow(() => saveNewStoryDraft(choices))
  assert.doesNotThrow(() => clearNewStoryDraft())
  assert.deepEqual(loadNewStoryDraft(fresh), fresh)
})

test('title and body parsing retain existing supported response formats', () => {
  for (const raw of ['Title: "A Day"\n\nA cat sits.', '# A Day\n\nA cat sits.', 'A Day\nA cat sits.', '```text\nTitle: A Day\n\nA cat sits.\n```']) {
    assert.deepEqual(parseGeneratedStory(raw), { title: 'A Day', body: 'A cat sits.' })
  }
  assert.deepEqual(parseGeneratedStory('A cat sits.'), { title: 'Untitled story', body: 'A cat sits.' })
})

test('the key is sent only to Google’s HTTPS endpoint, never to other or redirected destinations', async (t) => {
  const requests = mockGemini(t)
  for (const apiBaseUrl of [
    'https://example.com/v1beta',
    'http://generativelanguage.googleapis.com/v1beta',
    'https://generativelanguage.googleapis.com.evil.test/v1beta',
    'https://generativelanguage.googleapis.com/v1beta?next=https://evil.test',
    'https://user:pass@generativelanguage.googleapis.com/v1beta',
    'http://127.0.0.1:5175/v1beta',
    'javascript:alert(1)',
    '',
  ]) {
    const result = await generateStory({ ...choices, settings: { ...settings, apiBaseUrl } })
    assert.equal(result.ok, false, apiBaseUrl)
    assert.match(result.message, /sent only to https:\/\/generativelanguage\.googleapis\.com\/v1beta/)
  }
  assert.equal(requests.length, 0)
  assert.equal((await generateStory({ ...choices, settings: { ...settings, apiBaseUrl: ` ${GEMINI_API_BASE_URL}/ ` } })).ok, true)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].redirect, 'error')
})

test('loopback fixture endpoints are allowed only when development builds opt in', () => {
  for (const base of ['http://127.0.0.1:5175/v1beta', 'http://localhost:5175/v1beta', 'http://[::1]:5175/v1beta']) {
    assert.deepEqual(checkGeminiEndpoint(base, true), { ok: true, base })
    assert.equal(checkGeminiEndpoint(base, false).ok, false)
  }
  for (const base of ['http://127.0.0.2/v1beta', 'ftp://127.0.0.1/v1beta', 'http://a:b@127.0.0.1/v1beta', 'http://localhost.evil.test/v1beta']) {
    assert.equal(checkGeminiEndpoint(base, true).ok, false, base)
  }
})

test('story details list the saved choices and request, and leave out what was not saved', async (t) => {
  const requests = mockGemini(t)
  const submitted = { ...choices, textType: 'fable', tone: 'cozy', readingMinutes: 10 }
  const story = createGeneratedStory(await generateStory({ ...submitted, settings }), submitted)
  const details = storyDetails(story)
  assert.deepEqual(details.rows, [
    { label: 'Level', value: 'B1' },
    { label: 'Text type', value: 'Fable' },
    { label: 'Topic', value: 'A weekend in Tokyo' },
    { label: 'Tone', value: 'Cozy' },
    { label: 'Reading time', value: 'About 10 minutes' },
    { label: 'Model', value: 'Gemini 3.1 Flash Lite' },
    { label: 'Temperature', value: '0.7' },
    { label: 'Word target', value: '800–1,200 words' },
  ])
  const sent = requests.at(-1).json
  assert.deepEqual(details.prompts, { system: sent.systemInstruction.parts[0].text, user: sent.contents[0].parts[0].text })
  assert.ok(!JSON.stringify(details).includes(apiKey))

  const { generation: _, ...older } = story
  assert.deepEqual(storyDetails(older).rows.map((row) => row.label), ['Level', 'Text type', 'Topic', 'Tone', 'Reading time'])
  assert.equal(storyDetails(older).prompts, undefined)
  assert.equal(storyDetails({ ...story, generation: { ...story.generation, model: 'retired-model' } }).rows[5].value, 'retired-model')

  const legacy = JSON.parse(readFileSync(new URL('./fixtures/cefr-stories.json', import.meta.url), 'utf8')).stories[0]
  assert.equal(storyDetails({ ...legacy, topic: undefined, textType: undefined, readingMinutes: undefined }), null)
})

test('story details list the sentence length choice after the point of view when it was saved', () => {
  const story = createGeneratedStory({ title: 'T', body: 'B' }, { ...choices, pointOfView: 'first', variedSentences: true })
  assert.deepEqual(storyDetails(story).rows.slice(0, 5), [
    { label: 'Level', value: 'B1' },
    { label: 'Topic', value: 'A weekend in Tokyo' },
    { label: 'Point of view', value: 'First person' },
    { label: 'Sentence length', value: 'Varied' },
    { label: 'Reading time', value: 'About 5 minutes' },
  ])
  const plain = createGeneratedStory({ title: 'T', body: 'B' }, { ...choices, variedSentences: false })
  assert.deepEqual(storyDetails(plain).rows.find((row) => row.label === 'Sentence length'), { label: 'Sentence length', value: 'Not requested' })
  const older = createGeneratedStory({ title: 'T', body: 'B' }, choices)
  assert.ok(!storyDetails(older).rows.some((row) => row.label === 'Sentence length'))
})

test('varied sentence length adds its prompt line only when chosen', async (t) => {
  const requests = mockGemini(t)
  const line = 'Vary sentence and paragraph length: mix short, punchy sentences with longer, flowing ones, and short paragraphs with longer ones, so the text has rhythm.'
  for (const variedSentences of [true, false]) {
    const result = await generateStory({ ...choices, variedSentences, settings })
    const prompt = requests.at(-1).json.contents[0].parts[0].text
    assert.equal(prompt.includes(`\n${line}\n`), variedSentences)
    assert.equal(result.generation.userPrompt, prompt)
  }
})
