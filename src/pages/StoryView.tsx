import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Badge, Button, Card, Container, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { VocabularyReport } from '../components/VocabularyReport'
import { isDebugFixture } from '../lib/debug-fixtures'
import { lookupDefinition } from '../lib/dictionary'
import { getStory, loadSettings, updateWordExplanation, updateWordMark } from '../lib/storage'
import { tokenize } from '../lib/tokenize'
import type { Story } from '../types'

export function StoryView() {
  const { id } = useParams()
  const [story, setStory] = useState<Story | undefined>(() => (id ? getStory(id) : undefined))
  const [showVocabularyReport] = useState(() => loadSettings().showVocabularyReport)
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({})
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const pendingLookups = useRef(new Set<string>())
  const storyRef = useRef(story)
  const tokens = useMemo(() => tokenize(story?.body ?? ''), [story?.body])

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
    if (currentStory.explanations[key] || pendingLookups.current.has(key)) {
      return
    }

    pendingLookups.current.add(key)
    setLoadingKeys((keys) => ({ ...keys, [key]: true }))
    setLookupErrors((errors) => {
      const next = { ...errors }
      delete next[key]
      return next
    })

    const result = await lookupDefinition(key)

    pendingLookups.current.delete(key)
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
      storyRef.current = saved
      setStory(saved)
    }
  }

  function openWord(key: string, index: number) {
    const latest = storyRef.current
    if (!latest) {
      return
    }

    const next =
      latest.wordMarks[key] === 'unknown'
        ? latest
        : updateWordMark(latest.id, key, 'unknown')
    if (!next) {
      return
    }
    storyRef.current = next
    setStory(next)
    setActiveIndex(index)
    void lookupWord(key, next)
  }

  function closeNote() {
    if (activeIndex !== null) {
      document.getElementById(`word-${activeIndex}`)?.focus({ preventScroll: true })
    }
    setActiveIndex(null)
  }

  function markKnown(key: string) {
    const latest = storyRef.current
    if (!latest || latest.wordMarks[key] !== 'unknown') return
    const next = updateWordMark(latest.id, key, 'known')
    if (!next) return
    const activeToken = activeIndex === null ? undefined : tokens[activeIndex]
    if (activeToken?.type === 'word' && activeToken.key === key) closeNote()
    storyRef.current = next
    setStory(next)
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
            {isDebugFixture(story.id) && <Badge color="amber">Debug fixture</Badge>}
          </Flex>
          <Text as="p" size="2" color="gray">
            Tap a word when you need a definition. Looked-up words are highlighted until you
            mark them as known.
          </Text>
        </div>

        <div className="story-body">
          {tokens.map((token, index) => {
            if (token.type !== 'word') {
              return <span key={`other-${index}`}>{token.value}</span>
            }

            const mark = story.wordMarks[token.key]
            const className = mark === 'unknown' ? 'story-word unknown' : 'story-word'
            const showGloss = activeIndex === index
            const explanation = story.explanations[token.key]
            const error = lookupErrors[token.key]
            const loading = Boolean(loadingKeys[token.key])

            return (
              <span key={`word-${index}`}>
                <button
                  type="button"
                  id={`word-${index}`}
                  className={className}
                  onClick={() => {
                    if (showGloss) {
                      closeNote()
                    } else {
                      openWord(token.key, index)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && showGloss) {
                      event.preventDefault()
                      closeNote()
                    }
                  }}
                  aria-label={`Look up ${token.value}`}
                  aria-expanded={showGloss}
                  aria-controls={showGloss ? `gloss-${index}` : undefined}
                >
                  {token.value}
                </button>
                {showGloss && (
                  <span
                    className="inline-gloss"
                    id={`gloss-${index}`}
                    role="note"
                    aria-label={`Definition of ${token.value}`}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        closeNote()
                      }
                    }}
                  >
                    <span className="inline-gloss-word">{token.value}: </span>
                    <span className="inline-gloss-body" aria-live="polite">
                      {loading ? (
                        <><Spinner size="1" /> Looking up…</>
                      ) : (
                        error ?? explanation ?? 'No definition saved.'
                      )}
                    </span>
                    <span className="inline-gloss-actions">
                      {!loading && error && (
                        <button
                          type="button"
                          className="gloss-action"
                          onClick={() => {
                            const latest = storyRef.current
                            if (latest) {
                              void lookupWord(token.key, latest)
                            }
                          }}
                        >
                          Retry
                        </button>
                      )}
                      <button
                        type="button"
                        className="gloss-action"
                        onClick={() => markKnown(token.key)}
                      >
                        Mark as known
                      </button>
                      <button type="button" className="gloss-action" onClick={closeNote}>
                        Close
                      </button>
                    </span>
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
                <Flex key={entry.key} gap="3" align="start" justify="between">
                  <button
                    type="button"
                    className="glossary-item"
                    aria-label={`Go to ${entry.sample} in the story`}
                    onClick={() => {
                      openWord(entry.key, entry.index)
                      requestAnimationFrame(() => {
                        const word = document.getElementById(`word-${entry.index}`)
                        word?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        word?.focus({ preventScroll: true })
                      })
                    }}
                  >
                    <Text weight="medium" size="2">
                      {entry.sample}
                    </Text>
                    <span className="glossary-definition">
                      {loadingKeys[entry.key] ? (
                        <><Spinner size="1" /> Looking up…</>
                      ) : (
                        lookupErrors[entry.key] ?? story.explanations[entry.key] ??
                        'Tap to look up a definition.'
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="gloss-action glossary-known"
                    aria-label={`Mark ${entry.sample} as known`}
                    onClick={() => markKnown(entry.key)}
                  >
                    Mark as known
                  </button>
                </Flex>
              ))}
            </Flex>
          </Card>
        )}
        {showVocabularyReport && <VocabularyReport body={story.body} level={story.level} />}
      </Flex>
    </Container>
  )
}
