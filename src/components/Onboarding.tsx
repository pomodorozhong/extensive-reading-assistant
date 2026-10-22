import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, Text, VisuallyHidden } from '@radix-ui/themes'
import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isOnboardingOpen,
  saveOnboardingOutcome,
  setOnboardingOpen,
  subscribeOnboarding,
  type OnboardingOutcome,
} from '../lib/onboarding'

const STORY_WORDS = ['The', 'fox', 'found', 'a', 'little', 'boat', 'near', 'the', 'river', 'and', 'drifted', 'toward', 'the', 'glimmering', 'lights.']
const LOOKED_UP = 13

/** Delays one item of a staggered animation; read by the `.ob-*` keyframes in index.css. */
function delay(seconds: number): CSSProperties {
  return { '--ob-delay': `${seconds}s` } as CSSProperties
}

function StoryLine({ highlight }: { highlight: 'read' | 'lookup' }) {
  return (
    <p className="ob-story-text">
      {STORY_WORDS.map((word, index) => (
        <span
          key={index}
          className={
            highlight === 'read'
              ? 'ob-read-word'
              : index === LOOKED_UP
                ? 'ob-lookup-word'
                : undefined
          }
          style={highlight === 'read' ? delay(0.4 + index * 0.22) : undefined}
        >
          {word}
          {highlight === 'lookup' && index === LOOKED_UP && <span className="ob-tap" />}{' '}
        </span>
      ))}
    </p>
  )
}

function WelcomeScene() {
  return (
    <div className="ob-scene ob-books">
      {[0, 1, 2].map((index) => (
        <div key={index} className={`ob-book ob-book-${index}`} style={delay(index * 0.15)}>
          <span className="ob-book-line" />
          <span className="ob-book-line" />
          <span className="ob-book-line ob-book-line-short" />
        </div>
      ))}
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className={`ob-spark ob-spark-${index}`} style={delay(0.8 + index * 0.3)} />
      ))}
    </div>
  )
}

function LevelScene() {
  return (
    <div className="ob-scene ob-level">
      <div className="ob-levels">
        <span className="ob-level-thumb" />
        {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
          <span key={level} className="ob-level-item">
            {level}
          </span>
        ))}
      </div>
      <span className="ob-generate">Generate story</span>
      <div className="ob-new-story">
        <span className="ob-type-line" style={delay(2.3)} />
        <span className="ob-type-line" style={delay(2.6)} />
        <span className="ob-type-line ob-type-line-short" style={delay(2.9)} />
      </div>
    </div>
  )
}

function ReadScene() {
  return (
    <div className="ob-scene ob-page">
      <StoryLine highlight="read" />
      <span className="ob-caption" style={delay(3.8)}>
        Got the idea? Keep going.
      </span>
    </div>
  )
}

function LookupScene() {
  return (
    <div className="ob-scene ob-page">
      <span className="ob-bookmark">You are here</span>
      <StoryLine highlight="lookup" />
      <div className="ob-gloss">
        <strong>glimmering</strong> shining with a soft, unsteady light
      </div>
    </div>
  )
}

function VocabularyScene() {
  return (
    <div className="ob-scene ob-vocab">
      <span className="ob-fly-word">glimmering</span>
      <div className="ob-vocab-list">
        <span className="ob-vocab-title">Vocabulary</span>
        <span className="ob-vocab-row">drifted</span>
        <span className="ob-vocab-row">lantern</span>
        <span className="ob-vocab-row ob-vocab-new">
          glimmering <span className="ob-known">✓ Known</span>
        </span>
      </div>
    </div>
  )
}

function SetupScene() {
  return (
    <div className="ob-scene ob-setup">
      <div className="ob-setup-card" style={delay(0)}>
        <span className="ob-key" />
        <span className="ob-setup-label">Settings</span>
      </div>
      <div className="ob-setup-card" style={delay(0.25)}>
        <span className="ob-wifi">
          <span />
          <span />
          <span />
        </span>
        <span className="ob-setup-label">Online</span>
      </div>
      <div className="ob-setup-card" style={delay(0.5)}>
        <span className="ob-browser">
          <span className="ob-lock" />
        </span>
        <span className="ob-setup-label">This browser</span>
      </div>
    </div>
  )
}

type Step = { title: string; body: ReactNode; scene: () => ReactNode }

const STEPS: Step[] = [
  {
    title: 'Read a lot, and enjoy it',
    body: 'Extensive reading means reading many easy, enjoyable stories. You learn by understanding, not by studying every word.',
    scene: WelcomeScene,
  },
  {
    title: 'Pick your level, get a story',
    body: 'Choose a CEFR level (A1 is easiest, C2 hardest) and a theme. The app writes a story at that level.',
    scene: LevelScene,
  },
  {
    title: 'Read for the story',
    body: 'Keep reading when you meet a new word. If you can follow the story, you don’t need to look it up.',
    scene: ReadScene,
  },
  {
    title: 'Tap a word you don’t know',
    body: 'Tap any word to see its meaning. The story stays right where you were reading.',
    scene: LookupScene,
  },
  {
    title: 'Review words in Vocabulary',
    body: 'Words you looked up wait in Vocabulary. Mark them as known once you’ve learned them.',
    scene: VocabularyScene,
  },
  {
    title: 'A few things to know',
    body: (
      <ul className="ob-facts">
        <li>Add your Gemini API key in Settings to create stories. This introduction needs no key.</li>
        <li>Creating a story needs an internet connection.</li>
        <li>Stories and words are saved in this browser only. They don’t sync to other devices.</li>
      </ul>
    ),
    scene: SetupScene,
  },
]

/** The first-use introduction. Opened on first use by Layout and again from Settings. */
export function Onboarding() {
  const open = useSyncExternalStore(subscribeOnboarding, isOnboardingOpen, isOnboardingOpen)
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const navigate = useNavigate()
  const primary = useRef<HTMLButtonElement>(null)
  const returnTo = useRef<Element | null>(null)
  const last = step === STEPS.length - 1
  const { title, body, scene: Scene } = STEPS[step]

  function close(outcome: OnboardingOutcome, to?: string) {
    saveOnboardingOutcome(outcome)
    setOnboardingOpen(false)
    setStep(0)
    if (to) navigate(to)
  }

  function go(next: number) {
    if (next < 0 || next >= STEPS.length) return
    setDirection(next > step ? 'forward' : 'back')
    setStep(next)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') go(step + 1)
    if (event.key === 'ArrowLeft') go(step - 1)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && close('skipped')}>
      <Dialog.Content
        maxWidth="34rem"
        className="onboarding"
        aria-describedby="onboarding-body"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          // Opened from outside a Dialog.Trigger, so remember where focus should go back to.
          returnTo.current = document.activeElement
          primary.current?.focus()
        }}
        onCloseAutoFocus={(event) => {
          // Skip when a final action navigated away and the element is gone.
          if (returnTo.current instanceof HTMLElement && returnTo.current.isConnected) {
            event.preventDefault()
            returnTo.current.focus()
          }
        }}
        onKeyDown={onKeyDown}
      >
        <Flex justify="between" align="center" mb="3">
          <Text size="1" color="gray" weight="medium">
            Step {step + 1} of {STEPS.length}
          </Text>
          <Button variant="ghost" color="gray" size="1" onClick={() => close('skipped')}>
            Skip
          </Button>
        </Flex>

        <div key={step} className={`ob-stage ob-stage-${direction}`}>
          <div aria-hidden="true">
            <Scene />
          </div>
          <Dialog.Title mt="4" mb="2">
            {title}
          </Dialog.Title>
          {/* A plain element, since the last step's list cannot sit in Dialog.Description's <p>. */}
          <Text as="div" id="onboarding-body" size="2" color="gray">
            {body}
          </Text>
        </div>
        <VisuallyHidden aria-live="polite">
          Step {step + 1} of {STEPS.length}: {title}
        </VisuallyHidden>

        <div className="ob-dots" aria-hidden="true">
          {STEPS.map((_, index) => (
            <span key={index} className={index === step ? 'ob-dot ob-dot-current' : index < step ? 'ob-dot ob-dot-done' : 'ob-dot'} />
          ))}
        </div>

        <Flex gap="3" mt="4" justify="between" align="center" className="ob-footer">
          {/* aria-disabled rather than disabled, so focus is not dropped on returning to the first step. */}
          <Button variant="soft" color="gray" onClick={() => go(step - 1)} aria-disabled={step === 0} className="ob-back">
            <ArrowLeftIcon aria-hidden="true" /> Back
          </Button>
          <Flex gap="3" justify="end" className="ob-actions">
            {last && (
              <Button variant="soft" onClick={() => close('completed', '/level-check')}>
                Check my level
              </Button>
            )}
            {/* One button for Next and the final action, so focus stays put on the last step. */}
            <Button ref={primary} onClick={() => (last ? close('completed', '/new') : go(step + 1))}>
              {last ? (
                'Choose a level and start'
              ) : (
                <>
                  Next <ArrowRightIcon aria-hidden="true" />
                </>
              )}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
