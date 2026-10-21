import { Flex, Switch, Text, TextField } from '@radix-ui/themes'
import type { Ref } from 'react'

/** Where the key goes, shared by Settings and the New Story key dialog so both say the same thing. */
export const GEMINI_KEY_DESTINATION =
  'Your key stays in your browser and is sent only to Google, when you create a story.'

export const GEMINI_KEY_STUDIO_URL = 'https://aistudio.google.com/apikey'

type GeminiKeyFieldProps = {
  id: string
  label?: string
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
  label = 'Gemini API key',
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
        {label}
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
          ? 'You won’t need to paste it again on this device. Turn this off on a shared computer.'
          : 'Used for this visit only. You’ll paste it again after closing or reloading the page.'}
      </Text>
    </>
  )
}
