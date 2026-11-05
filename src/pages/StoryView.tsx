import { ArrowLeftIcon, ArrowRightIcon, Cross2Icon } from '@radix-ui/react-icons'
import { Button, Container, Heading, Spinner, Text } from '@radix-ui/themes'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { StoryGenerationDetails } from '../components/StoryGenerationDetails'
import { VocabularyReport } from '../components/VocabularyReport'
import { isDebugFixture } from '../lib/debug-fixtures'
import { lookupDefinition, preloadShards } from '../lib/dictionary'
import { TEXT_TYPE_INFO } from '../lib/generation-options'
import { loadProgress, markStoryRead } from '../lib/progress'
import { getStory, loadSettings, updateWordExplanation, updateWordMark } from '../lib/storage'
import { tokenize } from '../lib/tokenize'
import type { Story } from '../types'

export function StoryView() {
  const { id } = useParams()
  // A new key starts the page fresh, so lookups and the selected word never carry over between stories.
  return <StoryReader key={id} id={id} />
}

function StoryReader({ id }: { id: string | undefined }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | undefined>(() => (id ? getStory(id) : undefined))
  const [settings] = useState(() => loadSettings())
  const [progress, setProgress] = useState(() => loadProgress())
  // A lookup is 'pending' for its first moments and 'slow' once it is worth a spinner.
  const [loadingKeys, setLoadingKeys] = useState<Record<string, 'pending' | 'slow'>>({})
  const [lookupErrors, setLookupErrors] = useState<Record<string, string>>({})
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const pendingLookups = useRef(new Set<string>())
  const storyRef = useRef(story)
  const tokens = useMemo(() => tokenize(story?.body ?? ''), [story?.body])
  const activeToken = activeIndex === null ? undefined : tokens[activeIndex]
  const activeKey = activeToken?.type === 'word' ? activeToken.key : undefined

  const savedEntries = useMemo(() => {
    if (!story) return []
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

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveIndex(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
    if (currentStory.explanations[key] || pendingLookups.current.has(key)) return

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
    if (!latest || latest.id !== currentStory.id) return

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

  function selectWord(key: string, index: number) {
    const latest = storyRef.current
    if (!latest) return
    setActiveIndex(index)
    void lookupWord(key, latest)
  }

  function setSaved(key: string, saved: boolean) {
    const next = updateWordMark(story!.id, key, saved ? 'unknown' : undefined)
    if (!next) return
    storyRef.current = next
    setStory(next)
  }

  function finishReading() {
    markStoryRead(story!.id)
    setProgress(loadProgress())
    if (settings.offerExamAfterStory) navigate(`/stories/${story!.id}/exam`)
    else navigate('/stories')
  }

  const done = progress.read.includes(story.id)
  const previousResult = progress.readingResults[story.id]
  const selectedDefinition = activeKey ? story.explanations[activeKey] : undefined
  const selectedError = activeKey ? lookupErrors[activeKey] : undefined
  const selectedLoading = activeKey ? loadingKeys[activeKey] : undefined
  const selectedSaved = activeKey ? story.wordMarks[activeKey] === 'unknown' : false

  return (
    <div className="container">
      <div className="reader-top">
        <Link to="/stories" className="back-link">
          <ArrowLeftIcon aria-hidden="true" /> My Stories
        </Link>
        <h1>{story.title}</h1>
        <div className="meta">
          <span className="pill">{story.level}</span>
          {story.textType && <span className="pill">{TEXT_TYPE_INFO[story.textType].label}</span>}
          {story.readingMinutes && <span className="pill">{story.readingMinutes} min</span>}
          <span className={done ? 'pill green' : 'pill'}>{done ? '✓ Read' : 'Not finished'}</span>
          {isDebugFixture(story.id) && <span className="pill blue">Example</span>}
          {/* A fixture's topic only labels it as debug content; it was not generated. */}
          {!isDebugFixture(story.id) && <StoryGenerationDetails story={story} />}
        </div>
      </div>

      <div className="reading-layout">
        <div>
          <article className="card article-body">
            <div className="story-body">
              {tokens.map((token, index) => {
                if (token.type !== 'word') return <span key={`other-${index}`}>{token.value}</span>
                const classes = ['story-word']
                if (story.wordMarks[token.key] === 'unknown') classes.push('unknown')
                if (activeIndex === index) classes.push('active')
                return (
                  <button
                    key={`word-${index}`}
                    type="button"
                    id={`word-${index}`}
                    className={classes.join(' ')}
                    aria-label={`Look up ${token.value}`}
                    aria-pressed={activeIndex === index}
                    onClick={() => (activeIndex === index ? setActiveIndex(null) : selectWord(token.key, index))}
                  >
                    {token.value}
                  </button>
                )
              })}
            </div>
          </article>

          <section className="end-card">
            <div className="eyebrow">YOU’VE REACHED THE END</div>
            <h2>Finished reading?</h2>
            <p>
              {settings.offerExamAfterStory
                ? 'Finishing this story will open a short reading comprehension exam. You can skip the exam at any time.'
                : 'Finish this story and return to your library. The automatic reading exam prompt is turned off in Settings.'}
            </p>
            <div className="end-actions">
              <Button type="button" size="3" onClick={finishReading}>
                Finish reading <ArrowRightIcon aria-hidden="true" />
              </Button>
              {previousResult && (
                <Button asChild size="3" variant="outline" color="gray">
                  <Link to={`/stories/${story.id}/exam?result=1`}>
                    View previous result ({previousResult.score}/{previousResult.total})
                  </Link>
                </Button>
              )}
              <span className="end-note">
                Reading exam after each story: {settings.offerExamAfterStory ? 'On' : 'Off'} ·{' '}
                <Link to="/settings">Change in Settings</Link>
              </span>
            </div>
          </section>

          {settings.showVocabularyReport && <VocabularyReport body={story.body} level={story.level} />}
        </div>

        <aside className="reader-side" aria-label="Words in this story">
          {activeKey && activeToken?.type === 'word' && (
            <section className="card side-panel word-lookup" role="status" aria-live="polite">
              <button type="button" className="word-close" aria-label="Close definition" onClick={() => setActiveIndex(null)}>
                <Cross2Icon aria-hidden="true" />
              </button>
              <h3>{activeToken.value}</h3>
              <p className="word-definition">
                {selectedLoading === 'slow' ? (
                  <>
                    <Spinner size="1" /> Looking up…
                  </>
                ) : selectedLoading === 'pending' ? (
                  ' '
                ) : (
                  (selectedError ?? selectedDefinition ?? 'No definition saved.')
                )}
              </p>
              <div className="word-actions">
                <Button
                  type="button"
                  size="2"
                  variant={selectedSaved ? 'soft' : 'solid'}
                  onClick={() => setSaved(activeKey, !selectedSaved)}
                >
                  {selectedSaved ? '✓ Saved' : '＋ Save word'}
                </Button>
                {selectedError && (
                  <Button
                    type="button"
                    size="2"
                    variant="outline"
                    color="gray"
                    onClick={() => void lookupWord(activeKey, story, true)}
                  >
                    Retry
                  </Button>
                )}
              </div>
              <p className="side-note">
                {selectedSaved ? 'Saved to Dictionary.' : 'Save this word to study it in Exam.'}
              </p>
            </section>
          )}

          <section className="card side-panel">
            <h3>Words in this story</h3>
            {savedEntries.length === 0 ? (
              <p>Click a word in the article for its meaning. Save only the words you want to study later.</p>
            ) : (
              savedEntries.map((entry) => (
                <div key={entry.key} className="vocab-mini">
                  <button
                    type="button"
                    className="vocab-mini-word"
                    aria-label={`Go to ${entry.sample} in the story`}
                    onClick={() => {
                      selectWord(entry.key, entry.index)
                      requestAnimationFrame(() => {
                        const word = document.getElementById(`word-${entry.index}`)
                        word?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      })
                    }}
                  >
                    {entry.sample}
                  </button>
                  <span>{story.explanations[entry.key] ?? 'Click the word to look up a definition.'}</span>
                  <button
                    type="button"
                    className="gloss-action"
                    aria-label={`Remove ${entry.sample} from saved words`}
                    onClick={() => setSaved(entry.key, false)}
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <p className="side-note">Saved words appear in Dictionary and can be used in Exam.</p>
          </section>
        </aside>
      </div>
    </div>
  )
}
