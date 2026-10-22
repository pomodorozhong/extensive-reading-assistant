import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Button, Dialog, Flex, IconButton, Link, Text } from '@radix-ui/themes'
import { Link as RouterLink } from 'react-router-dom'
import { CEFR_LEVELS, type CefrLevel } from '../types'

const LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: 'Very short, simple sentences about familiar things like family, food, and home.',
  A2: 'Everyday phrases and simple stories about daily life.',
  B1: 'Clear stories on familiar topics, with most everyday words.',
  B2: 'Longer stories with some abstract ideas and less common words.',
  C1: 'Detailed, complex writing with idioms and a wide vocabulary.',
  C2: 'Almost anything, including subtle and literary language.',
}

/** An "i" button that explains the CEFR levels; it sits after a Vocabulary level label. */
export function VocabularyLevelInfo() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>
        <IconButton
          type="button"
          variant="ghost"
          color="gray"
          size="1"
          aria-label="What do the vocabulary levels mean?"
        >
          <InfoCircledIcon aria-hidden="true" />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Content maxWidth="32rem">
        <Dialog.Title>Which level should I choose?</Dialog.Title>
        <Dialog.Description size="2" color="gray" mb="4">
          The levels go from A1 for beginners to C2 for near-native readers. Each one sets the
          words and sentences used in your stories.
        </Dialog.Description>

        <dl className="level-guide">
          {CEFR_LEVELS.map((level) => (
            <div key={level} className="level-guide-row">
              <dt className="level-guide-level">{level}</dt>
              <dd className="level-guide-description">{LEVEL_DESCRIPTIONS[level]}</dd>
            </div>
          ))}
        </dl>

        <Text as="p" size="2" mt="4">
          Pick the level where reading feels easy and you know almost every word. Extensive reading
          works best with stories you can enjoy without stopping. If you keep stopping to look up
          words, try a lower level.
        </Text>
        <Text as="p" size="2" mt="3">
          You can change the level for each story. New Story starts with the level set in Settings.
        </Text>
        <Text as="p" size="2" mt="3">
          Not sure where to start?{' '}
          <Link asChild>
            <RouterLink to="/level-check">Take the one-minute reading level check</RouterLink>
          </Link>
          . It suggests a level from the words you know; the easiest-feeling level is still the best guide.
        </Text>

        <Flex justify="end" mt="5">
          <Dialog.Close>
            <Button type="button" variant="soft" color="gray">
              Close
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  )
}
