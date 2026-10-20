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
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createGeneratedStory, generateStory } from '../lib/generate'
import {
  initialGenerationChoices,
  READING_LENGTHS,
  READING_MINUTE_OPTIONS,
  SUPPORTED_MODELS,
  THEME_EXAMPLES,
  type GenerationChoices,
  type GenerationModel,
} from '../lib/generation-options'
import { clearNewStoryDraft, loadNewStoryDraft, saveNewStoryDraft } from '../lib/new-story-draft'
import { loadSettings, upsertStory } from '../lib/storage'
import { CEFR_LEVELS, type CefrLevel, type ReadingMinutes } from '../types'

export function NewStory() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const [choices, setChoices] = useState(() => loadNewStoryDraft(initialGenerationChoices(settings)))
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )
  const hasKey = Boolean(settings.apiKey.trim())
  const length = READING_LENGTHS[choices.readingMinutes]

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  // Save only learner edits, so an untouched form keeps following Settings defaults.
  function updateChoices(update: Partial<GenerationChoices>) {
    setChoices((current) => {
      const next = { ...current, ...update }
      saveNewStoryDraft(next)
      return next
    })
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasKey || !isOnline || generating) {
      return
    }

    setError(null)
    setGenerating(true)
    const submitted = { ...choices }
    const result = await generateStory({
      ...submitted,
      settings,
    })
    setGenerating(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const story = createGeneratedStory(result, submitted)
    upsertStory(story)
    clearNewStoryDraft()
    navigate(`/stories/${story.id}`)
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
        {!hasKey && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Add an API key in <Link to="/settings?from=new-story">Settings</Link> before generating
              a story. Your choices here are kept.
            </Callout.Text>
          </Callout.Root>
        )}

        {!isOnline && (
          <Callout.Root color="amber" mb="4" role="status">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              You’re offline. Saved stories remain available, but Gemini story generation requires an
              internet connection.
            </Callout.Text>
          </Callout.Root>
        )}

        {error && (
          <Callout.Root color="red" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex direction="column" gap="5">
          <Flex direction="column" gap="3">
            <label>
              <Text as="div" size="2" weight="medium" mb="1">
                Theme <Text color="gray">(optional)</Text>
              </Text>
              <TextField.Root
                size="3"
                placeholder="A rainy afternoon at a bookshop"
                value={choices.theme}
                onChange={(event) => updateChoices({ theme: event.target.value })}
                maxLength={120}
                disabled={generating}
              />
            </label>

            <div>
              <Text as="p" color="gray" size="2" mb="2">Try an example</Text>
              <Flex wrap="wrap" gap="2">
                {THEME_EXAMPLES.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="soft"
                    color={choices.theme === example ? 'blue' : 'gray'}
                    size="1"
                    className="new-story-example"
                    aria-pressed={choices.theme === example}
                    disabled={generating}
                    onClick={() => updateChoices({ theme: example })}
                  >
                    {example}
                  </Button>
                ))}
              </Flex>
            </div>
          </Flex>

          <div className="new-story-options">
            <div className="new-story-option new-story-level-option">
              <Text as="div" id="new-story-level-label" size="2" weight="medium" mb="2">
                Vocabulary level
              </Text>
              <SegmentedControl.Root
                aria-labelledby="new-story-level-label"
                value={choices.level}
                onValueChange={(value) => updateChoices({ level: value as CefrLevel })}
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

          <Button type="submit" size="3" disabled={!hasKey || !isOnline} loading={generating}>
            Generate Story <ArrowRightIcon aria-hidden="true" />
          </Button>
        </Flex>
      </form>
    </div>
  )
}
