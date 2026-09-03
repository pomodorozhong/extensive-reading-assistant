import { InfoCircledIcon } from '@radix-ui/react-icons'
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
import { useState, type FormEvent } from 'react'
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
  const hasKey = Boolean(settings.apiKey.trim())

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasKey || generating) {
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
    <Container size="2" px="4">
      <Heading size="7" mb="2">
        New Story
      </Heading>
      <Text as="p" color="gray" mb="5">
        Generate a story at your current level: <Badge color="blue">{settings.cefrLevel}</Badge>
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

      {error && (
        <Callout.Root color="red" mb="4">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      <form onSubmit={onSubmit}>
        <Flex direction="column" gap="4">
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              Theme <Text color="gray">(optional)</Text>
            </Text>
            <TextField.Root
              placeholder="A rainy afternoon at a bookshop"
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              maxLength={120}
            />
          </label>

          <Button type="submit" size="3" disabled={!hasKey} loading={generating}>
            Generate
          </Button>
        </Flex>
      </form>
    </Container>
  )
}
