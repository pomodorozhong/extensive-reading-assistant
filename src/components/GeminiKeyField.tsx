import { Flex, Switch, Text, TextField } from '@radix-ui/themes'
import type { Ref } from 'react'

/** Where the key goes, shared by Settings and the New Story key dialog so both say the same thing. */
export const GEMINI_KEY_DESTINATION =
  'It is never sent to a server of ours, only to Google’s Gemini API when you generate a story.'

export const GEMINI_KEY_STUDIO_URL = 'https://aistudio.google.com/apikey'

type GeminiKeyFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  remember: boolean
  onRememberChange: (remember: boolean) => void
  inputRef?: Ref<HTMLInputElement>
  /** Extra ids describing the key, such as guidance or an error. */
  describedBy?: string
  invalid?: boolean
}

/** The key field with its storage choice beside it, so readers decide both together. */
export function GeminiKeyField({
  id,
  value,
  onChange,
  remember,
  onRememberChange,
  inputRef,
  describedBy,
  invalid,
}: GeminiKeyFieldProps) {
  const storageId = `${id}-storage`

  return (
    <>
      <Text as="label" htmlFor={id} size="2" weight="medium" mb="1" className="settings-field-label">
        Gemini API key
      </Text>
      {/* The switch wraps below the field on phones. */}
      <Flex align="center" gap="3" wrap="wrap">
        <TextField.Root
          id={id}
          type="password"
          autoComplete="off"
          placeholder="AIza…"
          aria-describedby={[storageId, describedBy].filter(Boolean).join(' ')}
          aria-invalid={invalid || undefined}
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="settings-key-input"
        />
        <Text as="label" size="2">
          <Flex align="center" gap="2">
            <Switch
              checked={remember}
              aria-describedby={storageId}
              onCheckedChange={onRememberChange}
            />
            Remember key on this device
          </Flex>
        </Text>
      </Flex>
      <Text as="p" id={storageId} size="2" color="gray" mt="2">
        {remember
          ? 'Saved in this browser’s storage until you forget it. Anyone using this browser profile, and any code running on this site, can read it.'
          : 'Kept only in memory. Reloading, updating the app, or closing this tab forgets it, and you paste it again next time.'}
      </Text>
    </>
  )
}
