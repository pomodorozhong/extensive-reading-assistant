import { Badge, VisuallyHidden } from '@radix-ui/themes'
import type { ReactNode } from 'react'
import { isDebugFixture } from '../lib/debug-fixtures'
import { isStarterStory } from '../lib/starter-stories'
import { TEXT_TYPE_INFO, TONE_LABELS } from '../lib/generation-options'
import type { Story } from '../types'

function Chip({ name, accent, children }: { name: string; accent?: boolean; children: ReactNode }) {
  return (
    <Badge size="2" variant="soft" color={accent ? undefined : 'gray'} radius="full">
      <VisuallyHidden>{name}: </VisuallyHidden>
      {children}
    </Badge>
  )
}

/**
 * The choices a story was made with, as chips in the New Story page's order and style: the topic (the
 * home page's bar), then level, length, and text type in gray, then tone in the accent color, as home
 * shows an option changed from its default. Each chip shows only its value; screen readers also hear
 * its name. A fixture's topic only labels it as debug content; it was not generated. Starter stories
 * lead with a violet Example chip, so they read as bundled examples in My Stories and Story View.
 */
export function StoryChips({ story }: { story: Story }) {
  return (
    <>
      {isStarterStory(story.id) && (
        <Badge size="2" variant="surface" color="violet" radius="full">
          Example
        </Badge>
      )}
      {story.topic && !isDebugFixture(story.id) && <Chip name="Topic">{story.topic}</Chip>}
      <Chip name="Vocabulary level">{story.level}</Chip>
      {story.readingMinutes && <Chip name="Reading length">{story.readingMinutes} min</Chip>}
      {story.textType && <Chip name="Text type">{TEXT_TYPE_INFO[story.textType].label}</Chip>}
      {story.tone && <Chip name="Tone" accent>{TONE_LABELS[story.tone]}</Chip>}
    </>
  )
}
