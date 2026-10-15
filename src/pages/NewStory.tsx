import { ArrowRightIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import {
  Badge,
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateStory } from '../lib/generate'
import { loadSettings, upsertStory } from '../lib/storage'
import type { Story } from '../types'

export function NewStory() {
  const navigate = useNavigate()
  const settings = loadSettings()
  const [theme, setTheme] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === 'undefined' || navigator.onLine,
  )
  const hasKey = Boolean(settings.apiKey.trim())

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', updateConnection)
    window.addEventListener('offline', updateConnection)
    return () => {
      window.removeEventListener('online', updateConnection)
      window.removeEventListener('offline', updateConnection)
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasKey || !isOnline || generating) {
      return
    }

    setError(null)
    setGenerating(true)
    const result = await generateStory({
      level: settings.cefrLevel,
      theme: theme.trim() || undefined,
      settings,
    })
    setGenerating(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    const story: Story = {
      id: crypto.randomUUID(),
      title: result.title,
      body: result.body,
      level: settings.cefrLevel,
      createdAt: new Date().toISOString(),
      wordMarks: {},
      explanations: {},
    }
    if (theme.trim()) {
      story.theme = theme.trim()
    }
    upsertStory(story)
    navigate(`/stories/${story.id}`)
  }

  return (
    <Container size="2" px="4" className="new-story-page">
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
        <Text as="p" color="gray" size="2" mb="5">
          Current vocabulary level: <Badge color="blue">{settings.cefrLevel}</Badge>
        </Text>

        {!hasKey && (
          <Callout.Root color="amber" mb="4">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Add an API key in <Link to="/settings">Settings</Link> before generating a story.
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

        <Flex direction="column" gap="4">
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Theme <Text color="gray">(optional)</Text>
            </Text>
            <TextField.Root
              size="3"
              placeholder="A rainy afternoon at a bookshop"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              maxLength={120}
            />
          </label>

          <Button type="submit" size="3" disabled={!hasKey || !isOnline} loading={generating}>
            Generate Story <ArrowRightIcon aria-hidden="true" />
          </Button>
        </Flex>
      </form>
    </Container>
  )
}
