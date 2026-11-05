import { useState } from 'react'
import { storyDetails } from '../lib/story-details'
import type { Story } from '../types'

// The header already shows these as its own chips.
const SHOWN_IN_HEADER = new Set(['Level', 'Text type', 'Reading time'])

/** How a story was made, as chips for the story header's chip row. */
export function StoryGenerationDetails({ story }: { story: Story }) {
  const [showPrompts, setShowPrompts] = useState(false)
  const details = storyDetails(story)
  if (!details) return null
  const rows = details.rows.filter((row) => !SHOWN_IN_HEADER.has(row.label))

  return (
    <>
      {rows.map((row) => (
        <span key={row.label} className="pill detail">
          {row.label}: {row.value}
        </span>
      ))}
      {details.prompts ? (
        <button
          type="button"
          className="pill detail pill-button"
          aria-expanded={showPrompts}
          onClick={() => setShowPrompts(!showPrompts)}
        >
          Prompts {showPrompts ? '▴' : '▾'}
        </button>
      ) : (
        <span className="pill detail">Prompt not recorded</span>
      )}
      {details.prompts && showPrompts && (
        <div className="story-details-prompts">
          <p>System prompt</p>
          <pre>{details.prompts.system}</pre>
          <p>User prompt</p>
          <pre>{details.prompts.user}</pre>
        </div>
      )}
    </>
  )
}
