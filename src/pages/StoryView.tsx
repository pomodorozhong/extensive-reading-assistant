import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Badge, Button, Card, Container, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { StoryGenerationDetails } from '../components/StoryGenerationDetails'
import { VocabularyReport } from '../components/VocabularyReport'
import { isDebugFixture } from '../lib/debug-fixtures'
import { lookupDefinition, preloadShards } from '../lib/dictionary'
import { TEXT_TYPE_INFO } from '../lib/generation-options'
import { getStory, loadSettings, updateWordExplanation, updateWordMark } from '../lib/storage'
import { tokenize } from '../lib/tokenize'
import type { Story } from '../types'

export function StoryView() {
  const { id } = useParams()
  // A new key starts the page fresh, so lookups and the open note never carry over between stories.
  return <StoryReader key={id} id={id} />
}

function StoryReader({ id }: { id: string | undefined }) {
  const [searchParams] = useSearchParams()
  const [story, setStory] = useState<Story | undefined>(() => (id ? getStory(id) : undefined))
  const [showVocabularyReport] = useState(() => loadSettings().showVocabularyReport)
  // A lookup is 'pending' for its first moments and 'slow' once it is worth a spinner.
  const [loadingKeys, setLoadingKeys] = useState<Record<string, 'pending' | 'slow'>>({})
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({})
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [tallNoteIndex, setTallNoteIndex] = useState<number | null>(null)
  const pendingLookups = useRef(new Set<string>())
  const storyRef = useRef(story)
  const bodyRef = useRef<HTMLDivElement>(null)
  const noteRef = useRef<HTMLSpanElement>(null)
  const noteSpaceRef = useRef<HTMLSpanElement>(null)
  const tokens = useMemo(() => tokenize(story?.body ?? ''), [story?.body])
  const activeToken = activeIndex === null ? undefined : tokens[activeIndex]
  const activeKey = activeToken?.type === 'word' ? activeToken.key : undefined
  const explanation = activeKey ? story?.explanations[activeKey] : undefined
  const error = activeKey ? lookupErrors[activeKey] : undefined
  const loading = activeKey ? loadingKeys[activeKey] : undefined
  // The note stays closed while a lookup is pending, so a fast lookup opens it once,
  // with the definition already in place.
  const noteOpen = loading !== 'pending'
  // Once a note has shown the spinner, it keeps a two-line minimum so a short
  // definition replacing the spinner does not move the text again.
  if (loading === 'slow' && tallNoteIndex !== activeIndex) {
    setTallNoteIndex(activeIndex)
  }

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

  useLayoutEffect(() => {
    const target = searchParams.get('word')
    if (target === null || !/^\d+$/.test(target)) return
    const index = Number(target)
    if (tokens[index]?.type !== 'word') return
    const word = document.getElementById(`word-${index}`)
    word?.scrollIntoView({ block: 'center' })
    word?.focus({ preventScroll: true })
  }, [searchParams, tokens])

  // Explanations are kept per word, so a word the story ever writes in lowercase is
  // looked up as an ordinary word everywhere, and one it only capitalizes may be a name.
  const lowercaseKeys = useMemo(() => {
    const keys = new Set<string>()
    tokens.forEach((token) => {
      if (token.type === 'word' && token.value === token.value.toLowerCase()) keys.add(token.key)
    })
    return keys
  }, [tokens])

  useEffect(() => {
    const keys = new Set<string>()
    tokens.forEach((token) => {
      if (token.type === 'word') keys.add(token.key)
    })
    return preloadShards(keys)
  }, [tokens])

  useLayoutEffect(() => {
    if (activeIndex === null || !noteOpen) return
    const body = bodyRef.current
    const note = noteRef.current
    const space = noteSpaceRef.current
    const word = document.getElementById(`word-${activeIndex}`)
    if (!body || !note || !space || !word) return

    function positionNote() {
      if (!body || !note || !space || !word) return
      const wordRect = word.getBoundingClientRect()
      const bodyRect = body.getBoundingClientRect()
      // A zero-width spacer extends the line below its baseline. The note is
      // positioned separately so it cannot change which words fit on that line.
      space.style.height = `${wordRect.height + note.getBoundingClientRect().height + 4}px`
      note.style.top = `${wordRect.bottom - bodyRect.top + 2}px`
      note.style.visibility = 'visible'
    }

    positionNote()
    let frame = 0
    const observer = new ResizeObserver(() => {
      // Updating the spacer also resizes the body. Defer those writes to avoid
      // changing an observed element during the observer's delivery cycle.
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(positionNote)
    })
    observer.observe(body)
    observer.observe(note)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [activeIndex, noteOpen])

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

  async function lookupWord(key: string, currentStory: Story, showSpinnerNow = false) {
    if (currentStory.explanations[key] || pendingLookups.current.has(key)) {
      return
    }

    pendingLookups.current.add(key)
    setLoadingKeys((keys) => ({ ...keys, [key]: showSpinnerNow ? 'slow' : 'pending' }))
    const spinnerTimer = window.setTimeout(() => {
      setLoadingKeys((keys) => (keys[key] === 'pending' ? { ...keys, [key]: 'slow' } : keys))
    }, 150)
    setLookupErrors((errors) => {
      const next = { ...errors }
      delete next[key]
      return next
    })

    const result = await lookupDefinition(key, undefined, { mayBeName: !lowercaseKeys.has(key) })

    window.clearTimeout(spinnerTimer)
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
            {story.textType && <Badge color="gray">{TEXT_TYPE_INFO[story.textType].label}</Badge>}
            {isDebugFixture(story.id) && <Badge color="amber">Debug fixture</Badge>}
          </Flex>
          <Text as="p" size="2" color="gray">
            Tap a word when you need a definition. Looked-up words are highlighted until you
            mark them as known.
          </Text>
        </div>

        <div className="story-body" ref={bodyRef}>
          {tokens.map((token, index) => {
            if (token.type !== 'word') {
              return <span key={`other-${index}`}>{token.value}</span>
            }

            const mark = story.wordMarks[token.key]
            const className = mark === 'unknown' ? 'story-word unknown' : 'story-word'
            const isActive = activeIndex === index
            const showGloss = isActive && noteOpen

            return (
              <span key={`word-${index}`}>
                <button
                  type="button"
                  id={`word-${index}`}
                  className={className}
                  onClick={() => {
                    if (isActive) {
                      closeNote()
                    } else {
                      openWord(token.key, index)
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && isActive) {
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
                  <span className="story-note-space" ref={noteSpaceRef} aria-hidden="true" />
                )}
                {showGloss && (
                  <span
                    className={tallNoteIndex === index ? 'inline-gloss inline-gloss-tall' : 'inline-gloss'}
                    ref={noteRef}
                    id={`gloss-${activeIndex}`}
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
                      {loading ? (
                        // Holds Retry's place so the row wraps the same way if the lookup fails.
                        <span className="gloss-action gloss-action-placeholder" aria-hidden="true">
                          Retry
                        </span>
                      ) : error && (
                        <button
                          type="button"
                          className="gloss-action"
                          onClick={() => {
                            const latest = storyRef.current
                            if (latest) {
                              void lookupWord(token.key, latest, true)
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
                      {loadingKeys[entry.key] === 'pending' ? (
                        '\u00a0'
                      ) : loadingKeys[entry.key] === 'slow' ? (
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
        {/* A fixture's topic only labels it as debug content; it was not generated. */}
        {!isDebugFixture(story.id) && <StoryGenerationDetails story={story} />}
        {showVocabularyReport && <VocabularyReport body={story.body} level={story.level} />}
      </Flex>
    </Container>
  )
}
