import { InfoCircledIcon } from '@radix-ui/react-icons'
import {
  Button,
  Callout,
  Container,
  Flex,
  Heading,
  Link,
  SegmentedControl,
  Text,
  TextField,
} from '@radix-ui/themes'
import { useState, useSyncExternalStore } from 'react'
import {
  getPwaInstallSnapshot,
  promptPwaInstall,
  subscribePwaInstall,
} from '../lib/pwa-install'
import { loadSettings, saveSettings } from '../lib/storage'
import { CEFR_LEVELS, type CefrLevel, type Settings } from '../types'

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const installState = useSyncExternalStore(
    subscribePwaInstall,
    getPwaInstallSnapshot,
    getPwaInstallSnapshot,
  )
  const [showInstallInstructions, setShowInstallInstructions] = useState(false)
  const [installFeedback, setInstallFeedback] = useState<string | null>(null)

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
      <Heading size="7" mb="2">
        Settings
      </Heading>
      <Text as="p" color="gray" mb="5">
        Your CEFR level is used whenever you generate a story. The API key stays in this browser
        only.
      </Text>

      <Flex direction="column" gap="5" className="settings-form">
        <div>
          <Text as="div" size="2" weight="medium" mb="1">
            Install app
          </Text>
          <Text as="p" size="2" color="gray" mb="3">
            Add the reading assistant to your device for quick access.
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

        <label>
          <Text as="div" size="2" weight="medium" mb="1">
            Gemini API key
          </Text>
          <TextField.Root
            type="password"
            autoComplete="off"
            placeholder="AIza…"
            value={settings.apiKey}
            onChange={(event) => patch({ apiKey: event.target.value })}
          />
        </label>

        <label>
          <Text as="div" size="2" weight="medium" mb="1">
            API base URL
          </Text>
          <TextField.Root
            type="url"
            value={settings.apiBaseUrl}
            onChange={(event) => patch({ apiBaseUrl: event.target.value })}
          />
        </label>

        <label>
          <Text as="div" size="2" weight="medium" mb="1">
            Model
          </Text>
          <TextField.Root
            value={settings.model}
            onChange={(event) => patch({ model: event.target.value })}
          />
        </label>

        <Callout.Root color="gray">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Create a Gemini API key in{' '}
            <Link href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              Google AI Studio
            </Link>
            . Restrict the key by HTTP referrer if you host this app on the public web.
          </Callout.Text>
        </Callout.Root>
      </Flex>
    </Container>
  )
}
