import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Badge, Button, Card, Container, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { lookupDefinition } from '../lib/dictionary'
import { getStory, updateWordExplanation, updateWordMark } from '../lib/storage'
import { nextMark, tokenize } from '../lib/tokenize'
import type { Story, WordMark } from '../types'

function markLabel(mark: WordMark | undefined): string {
  if (mark === 'unknown') {
    return 'unknown'
  }
  if (mark === 'known') {
    return 'known'
  }
  return 'unmarked'
}

export function StoryView() {
  const { id } = useParams()
  const [story, setStory] = useState<Story | undefined>(() => (id ? getStory(id) : undefined))
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({})
  const storyRef = useRef(story)
  storyRef.current = story
  const tokens = useMemo(() => (story ? tokenize(story.body) : []), [story])

  const unknownEntries = useMemo(() => {
    if (!story) {
      return []
    }
    const seen = new Set<string>()
    const entries: Array<{ key: string; sample: string; index: number }> = []
    tokens.forEach((token, index) => {
      if (token.type === 'word' && story.wordMarks[token.key] === 'unknown' && !seen.has(token.key)) {
        seen.add(token.key)
        entries.push({ key: token.key, sample: token.value, index })
      }
    })
    return entries
  }, [story, tokens])

  const firstUnknownIndex = useMemo(() => {
    const indexes = new Map<string, number>()
    for (const entry of unknownEntries) {
      indexes.set(entry.key, entry.index)
    }
    return indexes
  }, [unknownEntries])

  if (!story) {
    return (
      <Container size="2" px="4">
        <Heading size="7" mb="3">
          Story not found
        </Heading>
        <Text as="p" mb="4" color="gray">
          This story is not saved on this device.
        </Text>
        <Button asChild>
          <Link to="/stories">Back to My Stories</Link>
        </Button>
      </Container>
    )
  }

  async function lookupWord(key: string, currentStory: Story) {
    if (currentStory.explanations[key]) {
      return
    }

    setLoadingKeys((keys) => ({ ...keys, [key]: true }))
    setLookupErrors((errors) => {
      const next = { ...errors }
      delete next[key]
      return next
    })

    const result = await lookupDefinition(key)

    setLoadingKeys((keys) => {
      const next = { ...keys }
      delete next[key]
      return next
    })

    const latest = storyRef.current
    if (!latest || latest.id !== currentStory.id || latest.wordMarks[key] !== 'unknown') {
      return
    }

    if (!result.ok) {
      setLookupErrors((errors) => ({ ...errors, [key]: result.message }))
      return
    }

    const saved = updateWordExplanation(latest.id, key, result.text)
    if (saved) {
      setStory(saved)
    }
  }

  function cycleWord(key: string) {
    const latest = storyRef.current
    if (!latest) {
      return
    }

    const mark = nextMark(latest.wordMarks[key])
    const next = updateWordMark(latest.id, key, mark)
    if (!next) {
      return
    }
    setStory(next)

    if (mark === 'unknown') {
      void lookupWord(key, next)
    }
  }

  return (
    <Container size="3" px="4">
      <Flex direction="column" gap="4">
        <div>
          <Button asChild variant="ghost" size="2" mb="3">
            <Link to="/stories">
              <ArrowLeftIcon />
              My Stories
            </Link>
          </Button>
          <Flex align="center" gap="2" wrap="wrap" mb="2">
            <Heading size="7">{story.title}</Heading>
            <Badge color="blue">{story.level}</Badge>
          </Flex>
          <Text as="p" size="2" color="gray">
            Tap a word to mark it: unmarked → unknown → known. Unknown words show a definition
            under the line.
          </Text>
        </div>

        <Flex gap="3" wrap="wrap">
          <Text size="2">
            <span className="mark-swatch unknown">word</span> unknown
          </Text>
          <Text size="2">
            <span className="mark-swatch known">word</span> known
          </Text>
        </Flex>

        <div className="story-body">
          {tokens.map((token, index) => {
            if (token.type !== 'word') {
              return <span key={`other-${index}`}>{token.value}</span>
            }

            const mark = story.wordMarks[token.key]
            const className = mark ? `story-word ${mark}` : 'story-word'
            const showGloss = firstUnknownIndex.get(token.key) === index
            const explanation = story.explanations[token.key]
            const error = lookupErrors[token.key]
            const loading = Boolean(loadingKeys[token.key])

            return (
              <span key={`word-${index}`}>
                <span
                  id={showGloss ? `word-${token.key}` : undefined}
                  className={className}
                  role="button"
                  tabIndex={0}
                  onClick={() => cycleWord(token.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      cycleWord(token.key)
                    }
                  }}
                  aria-label={`${token.value}, ${markLabel(mark)}. Activate to change mark.`}
                >
                  {token.value}
                </span>
                {showGloss && (
                  <span className="inline-gloss" role="note">
                    <span className="inline-gloss-word">{token.value}</span>
                    {loading && (
                      <span className="inline-gloss-body">
                        <Spinner size="1" /> Looking up…
                      </span>
                    )}
                    {!loading && error && (
                      <span className="inline-gloss-body">
                        {error}{' '}
                        <Button
                          size="1"
                          variant="soft"
                          onClick={() => {
                            const latest = storyRef.current
                            if (latest) {
                              void lookupWord(token.key, latest)
                            }
                          }}
                        >
                          Retry
                        </Button>
                      </span>
                    )}
                    {!loading && !error && explanation && (
                      <span className="inline-gloss-body">{explanation}</span>
                    )}
                  </span>
                )}
              </span>
            )
          })}
        </div>

        {unknownEntries.length > 0 && (
          <Card className="glossary">
            <Heading size="4" mb="3">
              Unknown words
            </Heading>
            <Flex direction="column" gap="3">
              {unknownEntries.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  className="glossary-item"
                  onClick={() => {
                    document.getElementById(`word-${entry.key}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                    })
                    const latest = storyRef.current
                    if (latest && !latest.explanations[entry.key]) {
                      void lookupWord(entry.key, latest)
                    }
                  }}
                >
                  <Text weight="medium" size="2">
                    {entry.sample}
                  </Text>
                  {loadingKeys[entry.key] ? (
                    <Flex align="center" gap="2" mt="1">
                      <Spinner size="1" />
                      <Text size="2" color="gray">
                        Looking up…
                      </Text>
                    </Flex>
                  ) : lookupErrors[entry.key] ? (
                    <Text size="2" color="red" as="p">
                      {lookupErrors[entry.key]}
                    </Text>
                  ) : (
                    <Text size="2" color="gray" as="p">
                      {story.explanations[entry.key] ?? 'Looking up…'}
                    </Text>
                  )}
                </button>
              ))}
            </Flex>
          </Card>
        )}
      </Flex>
    </Container>
  )
}
