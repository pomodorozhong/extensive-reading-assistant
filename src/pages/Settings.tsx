import { ArrowLeftIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import {
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  Link,
  SegmentedControl,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useRef, useState, useSyncExternalStore } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import {
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
} from '../lib/pwa-install'
import { allowsLoopbackEndpoint, checkGeminiEndpoint, GEMINI_API_BASE_URL } from '../lib/gemini-endpoint'
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
    <Container size="2" px="4">
      {fromNewStory && (
        <Button asChild variant="soft" mb="4">
          <RouterLink to="/new">
            <ArrowLeftIcon aria-hidden="true" /> Back to New Story
          </RouterLink>
        </Button>
      )}
      <Heading size="7" mb="2">
        Settings
      </Heading>
      <Text as="p" color="gray" mb="5">
        Your CEFR level defaults to A2 for New Story.
      </Text>

      <Flex direction="column" gap="5" className="settings-form">
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
          <Text as="div" size="2" weight="medium" mb="2">
            Vocabulary level
          </Text>
          <div className="cefr-scroll">
            <SegmentedControl.Root
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

        <div>
          <Text as="label" htmlFor="gemini-api-key" size="2" weight="medium" mb="1" className="settings-field-label">
            Gemini API key
          </Text>
          {/* The storage choice sits beside the key so readers decide both together; it wraps on phones. */}
          <Flex align="center" gap="3" wrap="wrap">
            <TextField.Root
              id="gemini-api-key"
              type="password"
              autoComplete="off"
              placeholder="AIza…"
              aria-describedby="gemini-api-key-storage gemini-api-key-guidance"
              ref={keyInput}
              value={settings.apiKey}
              onChange={(event) => {
                setKeyFeedback(null)
                patch({ apiKey: event.target.value })
              }}
              className="settings-key-input"
            />
            <Text as="label" size="2">
              <Flex align="center" gap="2">
                <Switch
                  checked={settings.rememberApiKey}
                  aria-describedby="gemini-api-key-storage"
                  onCheckedChange={(checked) => patch({ rememberApiKey: checked })}
                />
                Remember key on this device
              </Flex>
            </Text>
          </Flex>
          <Text as="p" id="gemini-api-key-storage" size="2" color="gray" mt="2">
            {settings.rememberApiKey
              ? 'Saved in this browser’s storage until you forget it. Anyone using this browser profile, and any code running on this site, can read it.'
              : 'Kept only in memory. Reloading, updating the app, or closing this tab forgets it, and you paste it again next time.'}
          </Text>
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
              <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </Link>
              , ideally in its own Google Cloud project. It is never sent to a server of ours, only
              to Google’s Gemini API when you generate a story. In Google Cloud, restrict the key to
              the Gemini API and to this site’s address, and set a billing alert or spending limit;
              these reduce misuse but are not guarantees. If you think the key was exposed, delete it
              in Google AI Studio and create a new one.
            </Callout.Text>
          </Callout.Root>
        </div>

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
          <Text as="div" size="2" weight="medium" mb="2">Debugging</Text>
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
      </Flex>
    </Container>
  )
}
