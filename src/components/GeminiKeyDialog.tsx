import { ExternalLinkIcon, LockClosedIcon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, Link, Text } from '@radix-ui/themes'
import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { loadSettings, saveSettings } from '../lib/storage'
import { GEMINI_KEY_DESTINATION, GEMINI_KEY_STUDIO_URL, GeminiKeyField } from './GeminiKeyField'

type GeminiKeyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after the key is saved, with the dialog already closing. */
  onSaved: () => void
  isOnline: boolean
  /** Where focus returns when the dialog closes. */
  returnFocusTo: RefObject<HTMLElement | null>
}

/** Asks for a Gemini key on New Story, saving it exactly as Settings does. */
export function GeminiKeyDialog({ open, onOpenChange, onSaved, isOnline, returnFocusTo }: GeminiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('')
  const [remember, setRemember] = useState(() => loadSettings().rememberApiKey)
  const [missing, setMissing] = useState(false)
  const keyInput = useRef<HTMLInputElement>(null)

  // Each opening starts with no leftover key and Settings' current storage choice.
  function close() {
    setApiKey('')
    setRemember(loadSettings().rememberApiKey)
    setMissing(false)
    onOpenChange(false)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    // Stop the submit from reaching the New Story form through the React tree.
    event.stopPropagation()
    const key = apiKey.trim()
    if (!key) {
      setMissing(true)
      keyInput.current?.focus()
      return
    }
    saveSettings({ ...loadSettings(), apiKey: key, rememberApiKey: remember })
    close()
    onSaved()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <Dialog.Content
        maxWidth="32rem"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          keyInput.current?.focus()
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
      >
        <Dialog.Title>Add your Gemini key</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          Stories are written by Google’s Gemini AI, using a key from your Google account. It takes
          about a minute to set up.
        </Dialog.Description>

        <form onSubmit={onSubmit} noValidate>
          <ol className="gemini-key-steps">
            <li className="gemini-key-step">
              <span className="gemini-key-step-number" aria-hidden="true">1</span>
              <div className="gemini-key-step-body">
                <Text as="p" size="2" weight="medium">
                  Get a key from Google
                </Text>
                <Text as="p" size="2" color="gray" mt="1" mb="2">
                  Sign in to Google AI Studio and choose <Text weight="medium">Create API key</Text>.
                  A key just for this app works best.
                </Text>
                <Button asChild variant="soft" size="2">
                  <a
                    href={GEMINI_KEY_STUDIO_URL}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Google AI Studio (opens in a new tab)"
                  >
                    Open Google AI Studio <ExternalLinkIcon aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </li>
            <li className="gemini-key-step">
              <span className="gemini-key-step-number" aria-hidden="true">2</span>
              <div className="gemini-key-step-body">
                <GeminiKeyField
                  id="gemini-key-dialog-key"
                  label="Paste your key here"
                  value={apiKey}
                  onChange={(value) => {
                    setMissing(false)
                    setApiKey(value)
                  }}
                  remember={remember}
                  onRememberChange={setRemember}
                  inputRef={keyInput}
                  describedBy={missing ? 'gemini-key-dialog-missing' : undefined}
                  invalid={missing}
                />
                {missing && (
                  <Text as="p" id="gemini-key-dialog-missing" size="2" color="red" mt="2" role="alert">
                    Paste your key first, then try again.
                  </Text>
                )}
              </div>
            </li>
          </ol>

          <Flex gap="2" align="start" className="gemini-key-privacy">
            <LockClosedIcon aria-hidden="true" className="gemini-key-privacy-icon" />
            <Text as="p" size="2" color="gray">
              {GEMINI_KEY_DESTINATION}
            </Text>
          </Flex>

          {!isOnline && (
            <Text as="p" size="2" color="amber" mt="3">
              You’re offline right now. You can save your key and create a story once you’re back
              online.
            </Text>
          )}

          <Flex gap="3" mt="5" align="center" justify="between" wrap="wrap">
            <Text size="2">
              <Link asChild color="gray">
                <RouterLink to="/settings?from=new-story">More key options in Settings</RouterLink>
              </Link>
            </Text>
            <Flex gap="3" wrap="wrap">
              <Dialog.Close>
                <Button type="button" variant="soft" color="gray">
                  Not now
                </Button>
              </Dialog.Close>
              <Button type="submit">{isOnline ? 'Save and create story' : 'Save key'}</Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  )
}
