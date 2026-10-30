import type { Story } from '../types.ts'
import { POINT_OF_VIEW_LABELS, SUPPORTED_MODELS, TEXT_TYPE_INFO, TONE_LABELS } from './generation-options.ts'

export type StoryDetails = {
  rows: Array<{ label: string; value: string }>
  /** The prompts sent to the model; absent on stories saved before they were recorded. */
  prompts?: { system: string; user: string }
}

/** How a story was made, as far as it was saved; null when nothing beyond its level was. */
export function storyDetails(story: Story): StoryDetails | null {
  const rows: StoryDetails['rows'] = []
  const generation = story.generation
  if (story.textType) rows.push({ label: 'Text type', value: TEXT_TYPE_INFO[story.textType].label })
  if (story.topic) rows.push({ label: 'Topic', value: story.topic })
  if (story.tone) rows.push({ label: 'Tone', value: TONE_LABELS[story.tone] })
  if (story.pointOfView) rows.push({ label: 'Point of view', value: POINT_OF_VIEW_LABELS[story.pointOfView] })
  if (story.readingMinutes) rows.push({ label: 'Reading time', value: `About ${story.readingMinutes} minutes` })
  if (generation) {
    const model = SUPPORTED_MODELS.find((option) => option.id === generation.model)
    rows.push(
      { label: 'Model', value: model?.label ?? generation.model },
      { label: 'Temperature', value: String(generation.temperature) },
      {
        label: 'Word target',
        value: `${generation.minWords.toLocaleString('en')}–${generation.maxWords.toLocaleString('en')} words`,
      },
    )
  }
  if (rows.length === 0) return null
  // The level always shows in the header, so it only joins rows that have something else to say.
  rows.unshift({ label: 'Level', value: story.level })
  return generation
    ? { rows, prompts: { system: generation.systemPrompt, user: generation.userPrompt } }
    : { rows }
}
