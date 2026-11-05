import { storyDetails } from '../lib/story-details'
import type { Story } from '../types'

const SHOWN = new Set(['Topic', 'Tone'])

/** The story's topic and tone, as chips for the story header's chip row. */
export function StoryGenerationDetails({ story }: { story: Story }) {
  const rows = storyDetails(story)?.rows.filter((row) => SHOWN.has(row.label)) ?? []
  return (
    <>
      {rows.map((row) => (
        <span key={row.label} className="pill">
          {row.label}: {row.value}
        </span>
      ))}
    </>
  )
}
