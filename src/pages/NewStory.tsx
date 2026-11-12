import { ArrowRightIcon, ChevronDownIcon, Cross2Icon, InfoCircledIcon, QuestionMarkCircledIcon, ShuffleIcon } from '@radix-ui/react-icons'
import {
  Button,
  Callout,
  Card,
  Checkbox,
  DropdownMenu,
  Flex,
  Heading,
  Popover,
  SegmentedControl,
  Select,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { GeminiKeyDialog } from '../components/GeminiKeyDialog'
import { useTypingPlaceholder } from '../components/useTypingPlaceholder'
import { VocabularyLevelInfo } from '../components/VocabularyLevelInfo'
import { createGeneratedStory, generateStory } from '../lib/generate'
import { setOnboardingOpen } from '../lib/onboarding'
import {
  allowsPointOfView,
  generationNotes,
  initialGenerationChoices,
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
  topicIdeasForLevel,
  type GenerationChoices,
  type GenerationModel,
  type TopicIdea,
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
  type TextType,
} from '../types'

// The text type and point-of-view controls need a string value for "leave it to the model".
const ANY = 'any'

// One row of ideas at a time; the shuffle button shows the next row.
const IDEAS_PER_ROW = 3

const PLACEHOLDER_FALLBACK = 'Type a topic, or leave it empty'
const PLACEHOLDER_TOPICS = [
  'A weekend in Tokyo',
  'A robot learns to cook',
  'A ghost in the school library',
  'Anything you like, or leave it empty',
]

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
  const [ideaRow, setIdeaRow] = useState(0)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [levelInfoOpen, setLevelInfoOpen] = useState(false)
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
  const placeholder = useTypingPlaceholder(PLACEHOLDER_TOPICS, PLACEHOLDER_FALLBACK, !choices.topic && !generating)
  const hasKey = Boolean(settings.apiKey.trim())
  const length = READING_LENGTHS[choices.readingMinutes]
  const notes = generationNotes(choices)
  const pointOfViewApplies = allowsPointOfView(choices.textType)
  // Each option changed from its default gets a chip under the bar; its × puts the default back.
  const defaults = initialGenerationChoices(settings)
  const changedOptions: { key: string; label: string; name: string; reset: Partial<GenerationChoices> }[] = [
    ...(choices.tone ? [{ key: 'tone', label: TONE_LABELS[choices.tone], name: 'Tone', reset: { tone: null } }] : []),
    ...(pointOfViewApplies && choices.pointOfView
      ? [{ key: 'pov', label: POINT_OF_VIEW_LABELS[choices.pointOfView], name: 'Point of view', reset: { pointOfView: null } }]
      : []),
    ...(choices.variedSentences !== defaults.variedSentences
      ? [{
          key: 'varied',
          label: choices.variedSentences ? 'Sentence variety on' : 'Sentence variety off',
          name: 'Sentence length',
          reset: { variedSentences: defaults.variedSentences },
        }]
      : []),
    ...(choices.model !== defaults.model
      ? [{
          key: 'model',
          label: SUPPORTED_MODELS.find((model) => model.id === choices.model)?.label ?? choices.model,
          name: 'Model',
          reset: { model: defaults.model },
        }]
      : []),
  ]
  const textTypeInfo = choices.textType ? TEXT_TYPE_INFO[choices.textType] : null
  const ideas = topicIdeasForLevel(choices.level)
  const ideaRows = Math.max(1, Math.ceil(ideas.length / IDEAS_PER_ROW))
  const shownIdeas = ideas.slice((ideaRow % ideaRows) * IDEAS_PER_ROW, (ideaRow % ideaRows + 1) * IDEAS_PER_ROW)
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

  function pickIdea(idea: TopicIdea) {
    setClearedTextType(null)
    updateChoices({ topic: idea.topic, textType: idea.textType })
  }

  function changeLevel(level: CefrLevel) {
    const { textType } = choices
    if (textType && !textTypeFitsLevel(textType, level)) {
      setClearedTextType(textType)
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
      <form onSubmit={onSubmit} className="new-story-home" aria-label="Story generation">
        <Heading as="h1" size={{ initial: '7', sm: '8' }} className="new-story-heading home-rise">
          What would you like to read?
        </Heading>

        {/* Live regions stay mounted so screen readers announce content added to them. */}
        <div role="status" className="new-story-notices">
          {!isOnline && (
            <Callout.Root color="amber" id="new-story-offline">
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
          <div ref={errorMessage} tabIndex={-1} className="new-story-message new-story-notices">
            <Callout.Root color="red">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>{error} Your choices are kept, so you can try again.</Callout.Text>
            </Callout.Root>
          </div>
        )}

        {unsavedStory && (
          <div className="new-story-unsaved new-story-notices">
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

        <TextField.Root
          size="3"
          radius="full"
          className="new-story-topic home-rise"
          aria-label="Topic (optional)"
          placeholder={placeholder}
          value={choices.topic}
          onChange={(event) => updateChoices({ topic: event.target.value })}
          maxLength={MAX_TOPIC_LENGTH}
          disabled={generating}
        >
          <TextField.Slot>
            <svg
              className="new-story-spark"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
              <path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z" />
            </svg>
          </TextField.Slot>
          <TextField.Slot side="right" className="new-story-generate-slot">
            {/* aria-disabled keeps the button focusable so keyboard and screen-reader users reach the
                reason it is unavailable; onSubmit ignores it. disabled={false} stops loading from
                disabling it, which would drop focus during generation. */}
            <Button
              ref={generateButton}
              type="submit"
              size="3"
              radius="full"
              className="new-story-generate"
              disabled={false}
              aria-disabled={blocked || undefined}
              data-disabled={blocked || undefined}
              aria-describedby={isOnline ? undefined : 'new-story-offline'}
              loading={generating}
            >
              <span className="new-story-generate-label">Generate Story</span> <ArrowRightIcon aria-hidden="true" />
            </Button>
          </TextField.Slot>
        </TextField.Root>

        {/* One line under the bar holds every choice. The chips scroll sideways when they do not fit, so
            Options always stays at the right end, on the same line. */}
        <div className="new-story-chips home-rise">
          <div className="new-story-chip-list" role="group" aria-label="Story choices">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger disabled={generating}>
                <Button type="button" variant="soft" color="gray" radius="full" size="1"
                  aria-label={`Vocabulary level: ${choices.level}`}>
                  {choices.level} <ChevronDownIcon aria-hidden="true" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content size="1">
                <DropdownMenu.Label>Vocabulary level</DropdownMenu.Label>
                <DropdownMenu.RadioGroup value={choices.level} onValueChange={(value) => changeLevel(value as CefrLevel)}>
                  {CEFR_LEVELS.map((level) => (
                    <DropdownMenu.RadioItem key={level} value={level}>{level}</DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onSelect={() => setLevelInfoOpen(true)}>Which level should I choose?</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger disabled={generating}>
                <Button type="button" variant="soft" color="gray" radius="full" size="1"
                  aria-label={`Reading length: ${choices.readingMinutes} minutes, about ${length.minWords.toLocaleString('en-US')}–${length.maxWords.toLocaleString('en-US')} words`}>
                  {choices.readingMinutes} min <ChevronDownIcon aria-hidden="true" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content size="1">
                <DropdownMenu.Label>Reading length</DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  value={String(choices.readingMinutes)}
                  onValueChange={(value) => updateChoices({ readingMinutes: Number(value) as ReadingMinutes })}
                >
                  {READING_MINUTE_OPTIONS.map((minutes) => {
                    const words = READING_LENGTHS[minutes]
                    return (
                      <DropdownMenu.RadioItem key={minutes} value={String(minutes)}>
                        {minutes} min
                        <Text color="gray" ml="2">
                          about {words.minWords.toLocaleString('en-US')}–{words.maxWords.toLocaleString('en-US')} words
                        </Text>
                      </DropdownMenu.RadioItem>
                    )
                  })}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger disabled={generating}>
                <Button type="button" variant="soft" color="gray" radius="full" size="1"
                  aria-label={`Text type: ${textTypeInfo ? textTypeInfo.label : 'any'}`}>
                  {textTypeInfo ? textTypeInfo.label : 'Any type'} <ChevronDownIcon aria-hidden="true" />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content size="1">
                <DropdownMenu.RadioGroup
                  value={choices.textType ?? ANY}
                  onValueChange={(value) => {
                    setClearedTextType(null)
                    updateChoices({ textType: value === ANY ? null : (value as TextType) })
                  }}
                >
                  <DropdownMenu.Label>Text type</DropdownMenu.Label>
                  <DropdownMenu.RadioItem value={ANY}>Any (usually a story)</DropdownMenu.RadioItem>
                  {TEXT_MODES.map((mode) => (
                    <DropdownMenu.Group key={mode}>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Label>{TEXT_MODE_LABELS[mode]}</DropdownMenu.Label>
                      {textTypesForLevel(mode, choices.level).map((textType) => (
                        <DropdownMenu.RadioItem key={textType} value={textType}>
                          {TEXT_TYPE_INFO[textType].label}
                        </DropdownMenu.RadioItem>
                      ))}
                    </DropdownMenu.Group>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            {changedOptions.map((option) => (
              <Button
                key={option.key}
                type="button"
                variant="soft"
                radius="full"
                size="1"
                disabled={generating}
                aria-label={`${option.name}: ${option.label}. Remove`}
                onClick={() => updateChoices(option.reset)}
              >
                {option.label} <Cross2Icon aria-hidden="true" />
              </Button>
            ))}
          </div>

          <Flex align="center" gap="2" className="new-story-more">
            {/* Generating closes the panel and locks its controls: the story already being written
                would not use changes made now. */}
            <Popover.Root open={optionsOpen && !generating} onOpenChange={setOptionsOpen}>
              <Popover.Trigger>
                <Button type="button" variant="ghost" size="1" disabled={generating}>
                  Options
                </Button>
              </Popover.Trigger>
              <Popover.Content className="new-story-options-panel" aria-label="Story options">
                <Flex direction="column" gap="4">
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
                          size="1"
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
                      size="1"
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
                  <div>
                    <Text as="label" size="2">
                      <Flex gap="2" align="center">
                        <Checkbox
                          checked={choices.variedSentences}
                          onCheckedChange={(checked) => updateChoices({ variedSentences: checked === true })}
                          disabled={generating}
                          aria-describedby="new-story-varied-help"
                        />
                        <Text weight="medium">Varied sentence length</Text>
                      </Flex>
                    </Text>
                    <Text as="p" id="new-story-varied-help" size="1" color="gray" mt="1">
                      Mixes short and long sentences and paragraphs, so the text has more rhythm.
                    </Text>
                  </div>
                  <div>
                    <Text as="label" htmlFor="new-story-model" size="2" weight="medium">
                      Model
                    </Text>
                    <Select.Root
                      value={choices.model}
                      onValueChange={(value) => updateChoices({ model: value as GenerationModel })}
                      disabled={generating}
                    >
                      <Select.Trigger id="new-story-model" className="new-story-model" />
                      <Select.Content>
                        {SUPPORTED_MODELS.map((model) => (
                          <Select.Item key={model.id} value={model.id}>{model.label}</Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </div>

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
                </Flex>
              </Popover.Content>
            </Popover.Root>
          </Flex>
        </div>

        <div role="status" className="new-story-chip-notice">
          {clearedTextType && (
            <Text as="p" size="1" color="amber">
              {TEXT_TYPE_INFO[clearedTextType].label} ({textTypeLevelRange(clearedTextType)}) is not offered at{' '}
              {choices.level}, so it was cleared.
            </Text>
          )}
        </div>

        <section className="new-story-ideas home-rise" aria-labelledby="new-story-ideas-title">
          <Flex align="center" justify="between" className="new-story-ideas-head">
            <Text as="div" id="new-story-ideas-title" size="2" weight="medium" color="gray">
              Topic ideas
            </Text>
            {ideaRows > 1 && (
              <Button
                type="button"
                variant="ghost"
                color="gray"
                size="1"
                disabled={generating}
                onClick={() => setIdeaRow((row) => row + 1)}
              >
                <ShuffleIcon aria-hidden="true" /> More ideas
              </Button>
            )}
          </Flex>
          <div className="new-story-idea-cards">
            {shownIdeas.map((idea) => {
              const picked = choices.topic === idea.topic && choices.textType === idea.textType
              const info = TEXT_TYPE_INFO[idea.textType]
              return (
                <Card key={idea.topic} asChild size="2" className="new-story-idea">
                  <button
                    type="button"
                    aria-pressed={picked}
                    disabled={generating}
                    onClick={() => pickIdea(idea)}
                  >
                    <Text as="div" size="1" className="new-story-idea-type">{info.label}</Text>
                    <Text as="div" size="3" weight="medium" className="new-story-idea-topic">{idea.topic}</Text>
                    <Text as="div" size="1" color="gray" className="new-story-idea-description">{info.description}</Text>
                  </button>
                </Card>
              )
            })}
          </div>
        </section>


        {/* The guide never opens by itself, so this is how a new reader finds it. */}
        <Button
          type="button"
          variant="ghost"
          color="gray"
          size="2"
          className="new-story-guide home-rise"
          onClick={() => setOnboardingOpen(true)}
        >
          <QuestionMarkCircledIcon aria-hidden="true" /> How it works
        </Button>

        <div role="status">
          {generating && (
            <Text as="p" size="2" color="gray" align="center">
              Writing your story… This can take up to a minute.
            </Text>
          )}
        </div>
      </form>

      {/* Outside the form: the dialog's own form would otherwise submit this one through the React tree. */}
      <VocabularyLevelInfo open={levelInfoOpen} onOpenChange={setLevelInfoOpen} />

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
