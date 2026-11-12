import { ArrowLeftIcon, Cross2Icon } from '@radix-ui/react-icons'
import { Badge, Button, Card, Container, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { StoryFinish } from '../components/StoryFinish'
import { StoryGenerationDetails } from '../components/StoryGenerationDetails'
import { VocabularyReport } from '../components/VocabularyReport'
import { isDebugFixture } from '../lib/debug-fixtures'
import { lookupDefinition, preloadShards } from '../lib/dictionary'
import { TEXT_TYPE_INFO } from '../lib/generation-options'
import { loadProgress } from '../lib/progress'
import { getStory, loadSettings, updateWordExplanation, updateWordMark } from '../lib/storage'
import { tokenize } from '../lib/tokenize'
import type { Story } from '../types'

// Wide enough for the story and the side panel; the panel moves below the story otherwise.
const SIDE_PANEL_QUERY = '(min-width: 941px)'

function subscribeToSidePanelQuery(onChange: () => void) {
  const query = window.matchMedia(SIDE_PANEL_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

function useSidePanel() {
  return useSyncExternalStore(subscribeToSidePanelQuery, () => window.matchMedia(SIDE_PANEL_QUERY).matches)
}

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
  // On wide screens the clicked word's meaning shows in the side Dictionary card
  // instead of a note under the word.
  const sidePanel = useSidePanel()
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
  const inlineNoteOpen = noteOpen && !sidePanel
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
    if (activeIndex === null || !inlineNoteOpen) return
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
  }, [activeIndex, inlineNoteOpen])

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
    if (!latest || latest.id !== currentStory.id) {
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
    // Looking a word up only shows its meaning; the reader decides whether to track it.
    const latest = storyRef.current
    if (!latest) {
      return
    }
    setActiveIndex(index)
    void lookupWord(key, latest)
  }

  function closeNote() {
    if (activeIndex !== null) {
      document.getElementById(`word-${activeIndex}`)?.focus({ preventScroll: true })
    }
    setActiveIndex(null)
  }

  // The meaning stays open after either mark, so the reader sees the change and can undo it.
  function markWord(key: string, mark: 'known' | 'unknown') {
    const latest = storyRef.current
    if (!latest || latest.wordMarks[key] === mark) return
    if (mark === 'known' && latest.wordMarks[key] !== 'unknown') return
    const next = updateWordMark(latest.id, key, mark)
    if (!next) return
    storyRef.current = next
    setStory(next)
  }

  function glossBody(): ReactNode {
    if (loading === 'slow') return <><Spinner size="1" /> Looking up…</>
    // A side card keeps its place, with no text, while a fast lookup finishes.
    if (loading === 'pending') return '\u00a0'
    return error ?? explanation ?? 'No definition saved.'
  }

  function glossActions(key: string): ReactNode {
    return (
      <>
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
                void lookupWord(key, latest, true)
              }
            }}
          >
            Retry
          </button>
        )}
        {story?.wordMarks[key] === 'unknown' ? (
          <button type="button" className="gloss-action" onClick={() => markWord(key, 'known')}>
            Mark as known
          </button>
        ) : (
          <button type="button" className="gloss-action" onClick={() => markWord(key, 'unknown')}>
            Mark as unknown
          </button>
        )}
      </>
    )
  }

  const unknownWordList = (
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
            onClick={() => markWord(entry.key, 'known')}
          >
            Mark as known
          </button>
        </Flex>
      ))}
    </Flex>
  )

  return (
    <Container size="4" maxWidth="1024px" px="4">
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
            {loadProgress().read.includes(story.id) && <Badge color="green">Read</Badge>}
          </Flex>
          <Text as="p" size="2" color="gray">
            Tap a word to see its meaning. Choose Mark as unknown to highlight it and keep it
            in Vocabulary until you mark it as known.
          </Text>
        </div>

        <div className="story-layout">
          <div className="story-main">
            <div className="story-body" ref={bodyRef}>
              {tokens.map((token, index) => {
                if (token.type !== 'word') {
                  return <span key={`other-${index}`}>{token.value}</span>
                }

                const mark = story.wordMarks[token.key]
                const isActive = activeIndex === index
                const className = [
                  'story-word',
                  mark === 'unknown' ? 'unknown' : '',
                  isActive ? 'active' : '',
                ].filter(Boolean).join(' ')
                const showGloss = isActive && inlineNoteOpen
                const showSideCard = isActive && sidePanel

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
                      aria-expanded={showGloss || showSideCard}
                      aria-controls={
                        showGloss ? `gloss-${index}` : showSideCard ? 'side-dictionary' : undefined
                      }
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
                          {glossBody()}
                        </span>
                        <span className="inline-gloss-actions">
                          {glossActions(token.key)}
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
            <div className="story-after">
              <StoryFinish storyId={story.id} />
              {/* A fixture's topic only labels it as debug content; it was not generated. */}
              {!isDebugFixture(story.id) && <StoryGenerationDetails story={story} />}
              {showVocabularyReport && <VocabularyReport body={story.body} level={story.level} />}
            </div>
          </div>

          {(sidePanel || unknownEntries.length > 0) && (
            <aside className="story-side" aria-label="Dictionary and words in this story">
              {sidePanel && (
                <Card
                  id="side-dictionary"
                  className="side-dictionary"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && activeToken) {
                      event.preventDefault()
                      closeNote()
                    }
                  }}
                >
                  <Text as="p" size="1" weight="bold" className="side-eyebrow">
                    Dictionary
                  </Text>
                  {/* Always mounted, so screen readers announce each new word and its meaning. */}
                  <div aria-live="polite">
                    {activeToken?.type === 'word' ? (
                      <>
                        <button
                          type="button"
                          className="side-dictionary-close"
                          aria-label="Close definition"
                          onClick={closeNote}
                        >
                          <Cross2Icon />
                        </button>
                        <Heading as="h2" size="4" mt="1" className="side-dictionary-word">
                          {activeToken.value}
                        </Heading>
                        <Text as="p" size="2" mt="1" className="side-dictionary-body">
                          {glossBody()}
                        </Text>
                        <Flex gap="3" wrap="wrap" mt="2">
                          {glossActions(activeToken.key)}
                        </Flex>
                      </>
                    ) : (
                      <Text as="p" size="2" color="gray" mt="1">
                        Tap a word in the story to see its meaning here.
                      </Text>
                    )}
                  </div>
                </Card>
              )}
              <Card className="glossary">
                <Heading as="h2" size="4" mb="1">
                  Words in this story
                </Heading>
                <Text as="p" size="2" color="gray" mb={unknownEntries.length > 0 ? '3' : undefined}>
                  {unknownEntries.length > 0
                    ? 'Words you mark as unknown stay here until you mark them as known.'
                    : 'No words marked as unknown yet. Words you mark as unknown stay here until you mark them as known.'}
                </Text>
                {unknownEntries.length > 0 && unknownWordList}
              </Card>
            </aside>
          )}
        </div>
      </Flex>
    </Container>
  )
}
