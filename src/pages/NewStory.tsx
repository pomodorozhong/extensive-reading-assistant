import { ArrowRightIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import {
  Button,
  Callout,
  Flex,
  Heading,
  SegmentedControl,
  Select,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeminiKeyDialog } from '../components/GeminiKeyDialog'
import { VocabularyLevelInfo } from '../components/VocabularyLevelInfo'
import { createGeneratedStory, generateStory } from '../lib/generate'
import {
  allowsPointOfView,
  generationNotes,
  initialGenerationChoices,
  lockedTextTypes,
  MAX_TOPIC_LENGTH,
  POINT_OF_VIEW_LABELS,
  READING_LENGTHS,
  READING_MINUTE_OPTIONS,
  SUPPORTED_MODELS,
  TEXT_MODE_LABELS,
  TEXT_TYPE_INFO,
  textTypeFitsLevel,
  textTypeLevelRange,
  textTypesForLevel,
  TONE_LABELS,
  topicExamples,
  type GenerationChoices,
  type GenerationModel,
} from '../lib/generation-options'
import { clearNewStoryDraft, loadNewStoryDraft, saveNewStoryDraft } from '../lib/new-story-draft'
import { loadSettings, trySaveNewStory } from '../lib/storage'
import {
  CEFR_LEVELS,
  POINTS_OF_VIEW,
  TEXT_MODES,
  TONES,
  type CefrLevel,
  type PointOfView,
  type ReadingMinutes,
  type Story,
  type TextMode,
  type TextType,
} from '../types'

// The mode and point-of-view controls need a string value for "leave it to the model".
const ANY = 'any'

const SAVE_FAILED_MESSAGE =
  'Your story was generated, but this browser could not save it. Free up browser storage, then try saving again, or copy the text so it is not lost.'

export function NewStory() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const [choices, setChoices] = useState(() => loadNewStoryDraft(initialGenerationChoices(settings)))
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [unsavedStory, setUnsavedStory] = useState<Story | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [mode, setMode] = useState<TextMode | null>(() =>
    choices.textType ? TEXT_TYPE_INFO[choices.textType].mode : null,
  )
  // A text type cleared because it is not offered at a newly chosen level.
  const [clearedTextType, setClearedTextType] = useState<TextType | null>(null)
  const generateButton = useRef<HTMLButtonElement>(null)
  const request = useRef<AbortController | null>(null)
  // Failure messages sit above the form, off screen on phones; focusing them shows and announces them.
  const errorMessage = useRef<HTMLDivElement>(null)
  const saveFailedMessage = useRef<HTMLDivElement>(null)
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )
  const hasKey = Boolean(settings.apiKey.trim())
  const length = READING_LENGTHS[choices.readingMinutes]
  const notes = generationNotes(choices)
  const pointOfViewApplies = allowsPointOfView(choices.textType)
  const styleSummary = [
    choices.tone && TONE_LABELS[choices.tone],
    pointOfViewApplies && choices.pointOfView && POINT_OF_VIEW_LABELS[choices.pointOfView],
  ].filter(Boolean).join(', ')
  const textTypeInfo = choices.textType ? TEXT_TYPE_INFO[choices.textType] : null
  const locked = mode ? lockedTextTypes(mode, choices.level) : []
  // Without a key, Generate Story opens the key dialog, so only being offline blocks it.
  const blocked = hasKey && !isOnline

  useEffect(() => {
    if (error) errorMessage.current?.focus()
  }, [error])

  useEffect(() => {
    if (unsavedStory) saveFailedMessage.current?.focus()
  }, [unsavedStory])

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  // Leaving the page cancels an in-flight request so it cannot save or navigate later.
  useEffect(() => () => request.current?.abort(), [])

  // Save only learner edits, so an untouched form keeps following Settings defaults.
  function updateChoices(update: Partial<GenerationChoices>) {
    setChoices((current) => {
      const next = { ...current, ...update }
      saveNewStoryDraft(next)
      return next
    })
  }

  // Picking a mode selects its first form, so a mode never stands without a form.
  function changeMode(next: TextMode | null) {
    setMode(next)
    setClearedTextType(null)
    updateChoices({ textType: next ? textTypesForLevel(next, choices.level)[0] : null })
  }

  function changeLevel(level: CefrLevel) {
    const { textType } = choices
    if (textType && !textTypeFitsLevel(textType, level)) {
      setClearedTextType(textType)
      setMode(null)
      updateChoices({ level, textType: null })
    } else {
      setClearedTextType(null)
      updateChoices({ level })
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasKey) {
      setKeyDialogOpen(true)
      return
    }
    void startGeneration()
  }

  async function startGeneration() {
    // The ref blocks a second submit before the generating state re-renders.
    if (!navigator.onLine || request.current) {
      return
    }

    const controller = new AbortController()
    request.current = controller
    setError(null)
    setUnsavedStory(null)
    setCopyFeedback(null)
    setGenerating(true)
    const submitted = { ...choices }
    const result = await generateStory({
      ...submitted,
      // Read settings now: a key saved in the dialog is not in this render's copy.
      settings: loadSettings(),
      signal: controller.signal,
    })
    if (controller.signal.aborted) {
      return
    }
    request.current = null
    setGenerating(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    saveAndOpen(createGeneratedStory(result, submitted))
  }

  function saveAndOpen(story: Story) {
    if (!trySaveNewStory(story)) {
      setUnsavedStory(story)
      setError(null)
      return
    }
    clearNewStoryDraft()
    navigate(`/stories/${story.id}`)
  }

  async function copyUnsavedStory(story: Story) {
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${story.body}`)
      setCopyFeedback('Story text copied.')
    } catch {
      setCopyFeedback('Copying is blocked in this browser. Select the text below and copy it instead.')
    }
  }

  return (
    <div className="new-story-page">
      <Flex direction="column" align="center" gap="4" className="new-story-hero">
        <div className="new-story-icon" aria-hidden="true">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 6C9 4 5 4 2 5v14c3-1 7-1 10 1 3-2 7-2 10-1V5c-3-1-7-1-10 1Z" />
            <path d="M12 6v14" />
          </svg>
        </div>
        <Heading as="h1" size={{ initial: '7', sm: '8' }} className="new-story-heading">
          Generate a Reading Story
        </Heading>
        <Text as="p" color="gray" size={{ initial: '3', sm: '4' }} className="new-story-description">
          Create short, engaging stories at your level to build reading habit and grow your vocabulary.
        </Text>
      </Flex>

      <form onSubmit={onSubmit} className="new-story-panel" aria-label="Story generation">
        {/* Live regions stay mounted so screen readers announce content added to them. */}
        <div role="status">
          {!isOnline && (
            <Callout.Root color="amber" mb="4" id="new-story-offline">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                You’re offline. Saved stories remain available, but Gemini story generation requires
                an internet connection.
              </Callout.Text>
            </Callout.Root>
          )}
        </div>

        {error && (
          <div ref={errorMessage} tabIndex={-1} className="new-story-message">
            <Callout.Root color="red" mb="4">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{error} Your choices are kept, so you can try again.</Callout.Text>
            </Callout.Root>
          </div>
        )}

        {unsavedStory && (
          <div className="new-story-unsaved">
            <div ref={saveFailedMessage} tabIndex={-1} className="new-story-message">
              <Callout.Root color="red" mb="3">
                <Callout.Icon>
                  <InfoCircledIcon />
                </Callout.Icon>
                <Callout.Text>{SAVE_FAILED_MESSAGE}</Callout.Text>
              </Callout.Root>
            </div>
            <Flex wrap="wrap" gap="2" mb="3">
              <Button type="button" onClick={() => saveAndOpen(unsavedStory)}>
                Try saving again
              </Button>
              <Button type="button" variant="soft" onClick={() => copyUnsavedStory(unsavedStory)}>
                Copy story text
              </Button>
            </Flex>
            <div role="status">
              {copyFeedback && (
                <Text as="p" size="2" color="gray" mb="3">
                  {copyFeedback}
                </Text>
              )}
            </div>
            <div className="new-story-unsaved-text" tabIndex={0} aria-label="Unsaved story text">
              <Text as="p" weight="bold" mb="2">{unsavedStory.title}</Text>
              <Text as="p" size="2" className="new-story-unsaved-body">{unsavedStory.body}</Text>
            </div>
          </div>
        )}

        <Flex direction="column" gap="5">
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Topic <Text color="gray">(optional)</Text>
              </Text>
              <TextField.Root
                size="3"
                placeholder="What should the story be about?"
                value={choices.topic}
                onChange={(event) => updateChoices({ topic: event.target.value })}
                maxLength={MAX_TOPIC_LENGTH}
                disabled={generating}
              />
            </label>

            <div>
              <Text as="p" color="gray" size="2" mb="2">Try an example</Text>
              <Flex wrap="wrap" gap="2">
                {topicExamples(choices.textType).map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="soft"
                    color={choices.topic === example ? 'blue' : 'gray'}
                    size="1"
                    className="new-story-example"
                    aria-pressed={choices.topic === example}
                    disabled={generating}
                    onClick={() => updateChoices({ topic: example })}
                  >
                    {example}
                  </Button>
                ))}
              </Flex>
            </div>
          </Flex>

          <div role="group" aria-labelledby="new-story-type-label" aria-describedby="new-story-type-help">
            <Text as="div" id="new-story-type-label" size="2" weight="medium" mb="2">
              Text type <Text color="gray" weight="regular">· for {choices.level}</Text>
            </Text>
            <SegmentedControl.Root
              aria-labelledby="new-story-type-label"
              value={mode ?? ANY}
              onValueChange={(value) => changeMode(value === ANY ? null : (value as TextMode))}
              disabled={generating}
              // The smaller size keeps all five segments readable at phone width.
              size={{ initial: '1', sm: '2' }}
              className="new-story-style-control"
            >
              <SegmentedControl.Item value={ANY}>Any</SegmentedControl.Item>
              {TEXT_MODES.map((item) => (
                <SegmentedControl.Item key={item} value={item}>{TEXT_MODE_LABELS[item]}</SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
            {mode && (
              <Flex wrap="wrap" gap="2" mt="3" role="group" aria-label={`${TEXT_MODE_LABELS[mode]} forms`}>
                {textTypesForLevel(mode, choices.level).map((textType) => (
                  <Button
                    key={textType}
                    type="button"
                    variant="soft"
                    color={choices.textType === textType ? 'blue' : 'gray'}
                    size="2"
                    aria-pressed={choices.textType === textType}
                    disabled={generating}
                    onClick={() => {
                      setClearedTextType(null)
                      updateChoices({ textType })
                    }}
                  >
                    {TEXT_TYPE_INFO[textType].label}
                  </Button>
                ))}
              </Flex>
            )}
            <Text as="p" id="new-story-type-help" size="1" color="gray" mt="2">
              {textTypeInfo
                ? `${textTypeInfo.label}: ${textTypeInfo.description}.`
                : 'Any text type; the model usually writes a story.'}
              {locked.length > 0 &&
                ` ${locked
                  .map((textType) => `${TEXT_TYPE_INFO[textType].label} unlocks at ${TEXT_TYPE_INFO[textType].levels[0]}`)
                  .join('; ')}.`}
            </Text>
            <div role="status">
              {clearedTextType && (
                <Text as="p" size="1" color="amber" mt="1">
                  {TEXT_TYPE_INFO[clearedTextType].label} ({textTypeLevelRange(clearedTextType)}) is not offered at{' '}
                  {choices.level}, so it was cleared.
                </Text>
              )}
            </div>
          </div>

          <div className="new-story-options">
            <div className="new-story-option new-story-level-option">
              <Flex align="center" gap="2" mb="2">
                <Text as="div" id="new-story-level-label" size="2" weight="medium">
                  Vocabulary level
                </Text>
                <VocabularyLevelInfo />
              </Flex>
              <SegmentedControl.Root
                aria-labelledby="new-story-level-label"
                value={choices.level}
                onValueChange={(value) => changeLevel(value as CefrLevel)}
                disabled={generating}
                size="3"
                className="new-story-levels"
              >
                {CEFR_LEVELS.map((level) => (
                  <SegmentedControl.Item key={level} value={level}>{level}</SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
            </div>
            <div className="new-story-option">
              <Text as="div" id="new-story-length-label" size="2" weight="medium" mb="2">
                Reading length
              </Text>
              <SegmentedControl.Root
                aria-labelledby="new-story-length-label"
                aria-describedby="new-story-length-help"
                value={String(choices.readingMinutes)}
                onValueChange={(value) => updateChoices({ readingMinutes: Number(value) as ReadingMinutes })}
                disabled={generating}
                size="3"
                className="new-story-lengths"
              >
                {READING_MINUTE_OPTIONS.map((minutes) => (
                  <SegmentedControl.Item key={minutes} value={String(minutes)}>{minutes} min</SegmentedControl.Item>
                ))}
              </SegmentedControl.Root>
              <Text as="p" id="new-story-length-help" size="1" color="gray" mt="2">
                About {length.minWords.toLocaleString('en-US')}–{length.maxWords.toLocaleString('en-US')} words. Reading time varies.
              </Text>
            </div>
            <div className="new-story-option">
              <Text as="label" htmlFor="new-story-model" size="2" weight="medium" mb="2">
                Model
              </Text>
              <Select.Root
                value={choices.model}
                onValueChange={(value) => updateChoices({ model: value as GenerationModel })}
                disabled={generating}
                size="3"
              >
                <Select.Trigger id="new-story-model" className="new-story-model" />
                <Select.Content>
                  {SUPPORTED_MODELS.map((model) => (
                    <Select.Item key={model.id} value={model.id}>{model.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </div>
          </div>

          <details className="new-story-style">
            <summary>
              <Text size="2" weight="medium">Style options</Text>
              <Text size="2" color="gray"> · {styleSummary || 'defaults'}</Text>
            </summary>
            <Flex direction="column" gap="4" mt="3">
              {/* Chips wrap on phones, where five segments would not fit. */}
              <div role="group" aria-labelledby="new-story-tone-label">
                <Text as="div" id="new-story-tone-label" size="2" weight="medium" mb="2">
                  Tone
                </Text>
                <Flex wrap="wrap" gap="2">
                  {[null, ...TONES].map((tone) => (
                    <Button
                      key={tone ?? ANY}
                      type="button"
                      variant="soft"
                      color={choices.tone === tone ? 'blue' : 'gray'}
                      size="2"
                      aria-pressed={choices.tone === tone}
                      disabled={generating}
                      onClick={() => updateChoices({ tone })}
                    >
                      {tone ? TONE_LABELS[tone] : 'Any'}
                    </Button>
                  ))}
                </Flex>
              </div>
              <div>
                <Text as="div" id="new-story-pov-label" size="2" weight="medium" mb="2">
                  Point of view
                </Text>
                <SegmentedControl.Root
                  aria-labelledby="new-story-pov-label"
                  value={choices.pointOfView ?? ANY}
                  onValueChange={(value) =>
                    updateChoices({ pointOfView: value === ANY ? null : (value as PointOfView) })
                  }
                  aria-describedby={pointOfViewApplies ? undefined : 'new-story-pov-help'}
                  disabled={generating || !pointOfViewApplies}
                  className="new-story-style-control"
                >
                  <SegmentedControl.Item value={ANY}>Any</SegmentedControl.Item>
                  {POINTS_OF_VIEW.map((pointOfView) => (
                    <SegmentedControl.Item key={pointOfView} value={pointOfView}>
                      {POINT_OF_VIEW_LABELS[pointOfView]}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl.Root>
                {textTypeInfo?.fixedPointOfView && (
                  <Text as="p" id="new-story-pov-help" size="1" color="gray" mt="2">
                    {textTypeInfo.fixedPointOfView === 'none'
                      ? `${textTypeInfo.label} has no narrator, so this does not apply.`
                      : `${textTypeInfo.label} is always in the ${POINT_OF_VIEW_LABELS[textTypeInfo.fixedPointOfView].toLowerCase()}.`}
                  </Text>
                )}
              </div>
            </Flex>
          </details>

          {notes.length > 0 && (
            <Flex direction="column" gap="2">
              {notes.map((note) => (
                <Callout.Root key={note} size="1" color="blue">
                  <Callout.Icon>
                    <InfoCircledIcon />
                  </Callout.Icon>
                  <Callout.Text>{note}</Callout.Text>
                </Callout.Root>
              ))}
            </Flex>
          )}

          {/* aria-disabled keeps the button focusable so keyboard and screen-reader users reach the
              reason it is unavailable; onSubmit ignores it. disabled={false} stops loading from
              disabling it, which would drop focus during generation. */}
          <Button
            ref={generateButton}
            type="submit"
            size="3"
            disabled={false}
            aria-disabled={blocked || undefined}
            data-disabled={blocked || undefined}
            aria-describedby={isOnline ? undefined : 'new-story-offline'}
            loading={generating}
          >
            Generate Story <ArrowRightIcon aria-hidden="true" />
          </Button>
        </Flex>
        <div role="status">
          {generating && (
            <Text as="p" size="2" color="gray" align="center" mt="2">
              Writing your story… This can take up to a minute.
            </Text>
          )}
        </div>
      </form>

      {/* Outside the form: the dialog's own form would otherwise submit this one through the React tree. */}
      <GeminiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        onSaved={() => void startGeneration()}
        isOnline={isOnline}
        returnFocusTo={generateButton}
      />
    </div>
  )
}
