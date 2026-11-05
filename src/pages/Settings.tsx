import { ArrowLeftIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import {
  Button,
  Callout,
  Container,
  Flex,
  Link,
  SegmentedControl,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes'
import { GEMINI_KEY_DESTINATION, GEMINI_KEY_STUDIO_URL, GeminiKeyField } from '../components/GeminiKeyField'
import { VocabularyLevelInfo } from '../components/VocabularyLevelInfo'
import { useRef, useState, useSyncExternalStore } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import {
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
} from '../lib/pwa-install'
import { allowsLoopbackEndpoint, checkGeminiEndpoint, GEMINI_API_BASE_URL } from '../lib/gemini-endpoint'
import { setOnboardingOpen } from '../lib/onboarding'
import { loadSettings, saveSettings } from '../lib/storage'
import { CEFR_LEVELS, type CefrLevel, type Settings } from '../types'

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [searchParams] = useSearchParams()
  const fromNewStory = searchParams.get('from') === 'new-story'
  const installState = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  )
  const endpoint = checkGeminiEndpoint(settings.apiBaseUrl, allowsLoopbackEndpoint())
  const [showInstallInstructions, setShowInstallInstructions] = useState(false)
  const [installFeedback, setInstallFeedback] = useState<string | null>(null)
  const [keyFeedback, setKeyFeedback] = useState<string | null>(null)
  const keyInput = useRef<HTMLInputElement>(null)

  function patch(update: Partial<Settings>) {
    setSettings((current) => {
      const next = { ...current, ...update }
      saveSettings(next)
      return next
    })
  }

  async function handleInstallClick() {
    setInstallFeedback(null)

    if (!installState.canPrompt) {
      setShowInstallInstructions(true)
      return
    }

    try {
      const outcome = await promptPwaInstall()
      if (outcome === 'accepted') {
        setInstallFeedback(
          'The install prompt was accepted. Follow your browser’s instructions to finish.',
        )
        setShowInstallInstructions(false)
      } else if (outcome === 'dismissed') {
        setInstallFeedback(
          'The install prompt was dismissed. You can install the app later from your browser menu.',
        )
        setShowInstallInstructions(true)
      } else {
        setShowInstallInstructions(true)
      }
    } catch {
      setInstallFeedback(
        'The browser could not open its install prompt. Use the steps below instead.',
      )
      setShowInstallInstructions(true)
    }
  }

  return (
    <Container size="3" px="4">
      {fromNewStory && (
        <Button asChild variant="soft" mb="4">
          <RouterLink to="/new">
            <ArrowLeftIcon aria-hidden="true" /> Back to New Story
          </RouterLink>
        </Button>
      )}
      <div className="page-heading">
        <div className="eyebrow">PREFERENCES</div>
        <h1>Settings</h1>
        <p>Customize how reading and exams fit into your routine.</p>
      </div>

      <div className="settings-form card settings-panel">
        <section className="settings-section" aria-labelledby="settings-exams">
          <h2 id="settings-exams" className="settings-section-title">Exams</h2>
          <p className="settings-section-desc">Choose whether a short comprehension check follows each story.</p>
          <div className="settings-items">
          <Text as="label" size="2">
            <Flex align="center" justify="between" gap="4">
              <span>
                <Text as="div" size="3" weight="bold">Offer an exam after each story</Text>
                <Text as="div" color="gray" mt="1">
                  When on, finishing a story takes you to a short reading comprehension exam, which
                  you can skip. When off, finishing a story simply marks it as read.
                </Text>
              </span>
              <Switch
                checked={settings.offerExamAfterStory}
                onCheckedChange={(checked) => patch({ offerExamAfterStory: checked })}
              />
            </Flex>
          </Text>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-reading">
          <h2 id="settings-reading" className="settings-section-title">Reading</h2>
          <p className="settings-section-desc">Defaults for the stories you generate.</p>
          <div className="settings-items">
        <div>
          <Flex align="center" gap="2" mb="2">
            <Text as="div" id="settings-level-label" size="2" weight="medium">
              Vocabulary level
            </Text>
            <VocabularyLevelInfo />
          </Flex>
          <div className="cefr-scroll">
            <SegmentedControl.Root
              aria-labelledby="settings-level-label"
              value={settings.cefrLevel}
              onValueChange={(value) => patch({ cefrLevel: value as CefrLevel })}
            >
              {CEFR_LEVELS.map((level) => (
                <SegmentedControl.Item key={level} value={level}>
                  {level}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </div>
        </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-gemini">
          <h2 id="settings-gemini" className="settings-section-title">Gemini</h2>
          <p className="settings-section-desc">Story and exam questions are written by Google’s Gemini with your own key.</p>
          <div className="settings-items">
        <div>
          <GeminiKeyField
            id="gemini-api-key"
            value={settings.apiKey}
            onChange={(apiKey) => {
              setKeyFeedback(null)
              patch({ apiKey })
            }}
            remember={settings.rememberApiKey}
            onRememberChange={(rememberApiKey) => patch({ rememberApiKey })}
            inputRef={keyInput}
            describedBy="gemini-api-key-guidance"
          />
          {settings.apiKey && (
            <Button
              type="button"
              variant="soft"
              color="red"
              size="1"
              mt="2"
              onClick={() => {
                patch({ apiKey: '' })
                setKeyFeedback('Key forgotten on this device.')
                // The button disappears with the key; keep focus where a new key goes.
                keyInput.current?.focus()
              }}
            >
              Forget key
            </Button>
          )}
          <div role="status">
            {keyFeedback && (
              <Text as="p" size="2" color="gray" mt="2">
                {keyFeedback}
              </Text>
            )}
          </div>
          <Callout.Root color="gray" mt="3" id="gemini-api-key-guidance">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Create a key just for this app in{' '}
              <Link href={GEMINI_KEY_STUDIO_URL} target="_blank" rel="noreferrer">
                Google AI Studio
              </Link>
              , ideally in its own Google Cloud project. {GEMINI_KEY_DESTINATION} A remembered key can be read by anyone
              using this browser profile and by any code running on this site. In Google Cloud, restrict the key to
              the Gemini API and to this site’s address, and set a billing alert or spending limit;
              these reduce misuse but are not guarantees. If you think the key was exposed, delete it
              in Google AI Studio and create a new one.
            </Callout.Text>
          </Callout.Root>
        </div>
        <label>
          <Text as="div" size="2" weight="medium" mb="1">
            Model
          </Text>
          <TextField.Root
            value={settings.model}
            onChange={(event) => patch({ model: event.target.value })}
          />
        </label>
        <div>
          <label>
            <Text as="div" size="2" weight="medium" mb="1">
              API base URL
            </Text>
            <TextField.Root
              type="url"
              value={settings.apiBaseUrl}
              aria-invalid={!endpoint.ok}
              aria-describedby="api-base-url-help"
              onChange={(event) => patch({ apiBaseUrl: event.target.value })}
            />
          </label>
          <Text
            as="p"
            id="api-base-url-help"
            size="2"
            color={endpoint.ok ? 'gray' : 'red'}
            mt="2"
            role={endpoint.ok ? undefined : 'alert'}
          >
            {!endpoint.ok
              ? endpoint.message
              : endpoint.base === GEMINI_API_BASE_URL
                ? 'Your key is sent only to Google’s Gemini API.'
                : 'Development build: requests go to this local test server.'}
          </Text>
          {!endpoint.ok && (
            <Button
              type="button"
              variant="soft"
              size="1"
              mt="2"
              onClick={() => patch({ apiBaseUrl: GEMINI_API_BASE_URL })}
            >
              Use Google’s endpoint
            </Button>
          )}
        </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-app">
          <h2 id="settings-app" className="settings-section-title">This app</h2>
          <p className="settings-section-desc">Install it and revisit the tour.</p>
          <div className="settings-items">
        <div>
          <Text as="div" size="2" weight="medium" mb="1">
            Install app
          </Text>
          <Text as="p" size="2" color="gray" mb="3">
            Add the reading assistant to your device for quick access.{' '}
            <Link
              href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app"
              target="_blank"
              rel="noreferrer"
            >
              (What is PWA?)
            </Link>
          </Text>
          <Button onClick={handleInstallClick} disabled={installState.isInstalled}>
            {installState.isInstalled ? 'Installed' : 'Install app'}
          </Button>
          {installState.isInstalled && (
            <Text as="p" size="2" color="gray" mt="2" role="status">
              This app is installed on this device.
            </Text>
          )}
          {installFeedback && (
            <Text as="p" size="2" color="gray" mt="2" role="status">
              {installFeedback}
            </Text>
          )}
          {showInstallInstructions && !installState.isInstalled && (
            <Callout.Root color="gray" mt="3">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                In Chrome or Edge, open the browser menu and choose “Install app” or “Add to Home
                screen.” On iPhone or iPad, open this page in Safari, tap Share, then choose “Add to
                Home Screen.”
              </Callout.Text>
            </Callout.Root>
          )}
        </div>
        <div>
          <Text as="div" size="2" weight="medium" mb="1">
            Introduction
          </Text>
          <Text as="p" size="2" color="gray" mb="3">
            A short tour of how extensive reading works in this app.
          </Text>
          <Button type="button" variant="soft" onClick={() => setOnboardingOpen(true)}>
            Show the introduction again
          </Button>
        </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-debug">
          <h2 id="settings-debug" className="settings-section-title">Debugging</h2>
          <p className="settings-section-desc">For checking the app; off by default.</p>
          <div className="settings-items">
        <div>
          <Text as="label" size="2">
            <Flex align="center" gap="2">
              <Switch
                checked={settings.showDebugFixtures}
                onCheckedChange={(checked) => patch({ showDebugFixtures: checked })}
              />
              Show CEFR fixture articles in My Stories
            </Flex>
          </Text>
          <Text as="p" size="2" color="gray" mt="2">
            Off by default. Adds six illustrative A1–C2 articles, not certified CEFR texts.
            Hiding them keeps your saved stories.
          </Text>
          <Text as="label" size="2" mt="4">
            <Flex align="center" gap="2">
              <Switch
                checked={settings.showVocabularyReport}
                onCheckedChange={(checked) => patch({ showVocabularyReport: checked })}
              />
              Show approximate vocabulary difficulty
            </Flex>
          </Text>
          <Text as="p" size="2" color="gray" mt="2">
            Off by default. Shows an approximate vocabulary report below saved stories and fixture
            articles in Story View.
          </Text>
        </div>
          </div>
        </section>
      </div>
    </Container>
  )
}
