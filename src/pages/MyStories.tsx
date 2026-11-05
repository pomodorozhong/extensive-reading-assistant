import { Badge, Button, Container } from '@radix-ui/themes'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isDebugFixture } from '../lib/debug-fixtures'
import { TEXT_TYPE_INFO } from '../lib/generation-options'
import { loadProgress } from '../lib/progress'
import { loadVisibleStories, loadVocabulary } from '../lib/storage'
import { CEFR_LEVELS, type Story } from '../types'

function preview(story: Story): string {
  const text = story.body.replace(/\s+/g, ' ').trim()
  return text.length > 150 ? `${text.slice(0, 150).replace(/\s+\S*$/, '')}…` : text
}

type Grouping = 'none' | 'level' | 'status' | 'type'
type Sorting = 'newest' | 'oldest' | 'title' | 'level'

const GROUPINGS: Array<[Grouping, string]> = [
  ['none', 'None'],
  ['level', 'Level'],
  ['status', 'Status'],
  ['type', 'Text type'],
]
const SORTINGS: Array<[Sorting, string]> = [
  ['newest', 'Newest'],
  ['oldest', 'Oldest'],
  ['title', 'Title A–Z'],
  ['level', 'Level'],
]

function sortStories(stories: Story[], sorting: Sorting): Story[] {
  const byDate = (a: Story, b: Story) => b.createdAt.localeCompare(a.createdAt)
  const compare: Record<Sorting, (a: Story, b: Story) => number> = {
    newest: byDate,
    oldest: (a, b) => -byDate(a, b),
    title: (a, b) => a.title.localeCompare(b.title),
    level: (a, b) => CEFR_LEVELS.indexOf(a.level) - CEFR_LEVELS.indexOf(b.level) || byDate(a, b),
  }
  return [...stories].sort(compare[sorting])
}

function groupStories(
  stories: Story[],
  grouping: Grouping,
  read: Set<string>,
): Array<{ label: string; stories: Story[] }> {
  if (grouping === 'none') return [{ label: '', stories }]
  const labelOf = (story: Story) =>
    grouping === 'level'
      ? story.level
      : grouping === 'status'
        ? read.has(story.id) ? 'Read' : 'Not finished'
        : story.textType ? TEXT_TYPE_INFO[story.textType].label : 'No text type'
  const groups = new Map<string, Story[]>()
  for (const story of stories) {
    const label = labelOf(story)
    groups.set(label, [...(groups.get(label) ?? []), story])
  }
  const order = (label: string) =>
    grouping === 'level'
      ? CEFR_LEVELS.indexOf(label as (typeof CEFR_LEVELS)[number])
      : grouping === 'status' && label === 'Read'
        ? 1
        : 0
  return [...groups]
    .sort(([a], [b]) => order(a) - order(b) || a.localeCompare(b))
    .map(([label, items]) => ({ label, stories: items }))
}

export function MyStories() {
  const [grouping, setGrouping] = useState<Grouping>('none')
  const [sorting, setSorting] = useState<Sorting>('newest')
  const stories = loadVisibleStories()
  const progress = loadProgress()
  const ids = new Set(stories.map((story) => story.id))
  const completed = progress.read.filter((id) => ids.has(id)).length
  const savedWords = loadVocabulary().length

  return (
    <Container size="4" px="4">
      <div className="page-heading">
        <div className="eyebrow">YOUR READING LIBRARY</div>
        <h1>My Stories</h1>
        <p>
          Open a story, save words to your Dictionary, and finish reading to see the optional
          comprehension check. Saved stories stay on this device.
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="empty">
          <p>No stories yet.</p>
          <Button asChild>
            <Link to="/new">Generate a story</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="metrics">
            <div className="metric">
              <strong>{stories.length}</strong>
              <span>Stories in library</span>
            </div>
            <div className="metric">
              <strong>{completed}</strong>
              <span>Completed stories</span>
            </div>
            <div className="metric">
              <strong>{savedWords}</strong>
              <span>Saved dictionary words</span>
            </div>
          </div>

          <div className="section-head">
            <h2>All stories</h2>
            <Link to="/exam" className="text-button">
              Go to vocabulary Exam <ArrowRightIcon aria-hidden="true" />
            </Link>
          </div>

          <div className="filter-row">
            <label className="chip-select">
              <span>Group</span>
              <select value={grouping} onChange={(event) => setGrouping(event.target.value as Grouping)}>
                {GROUPINGS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="chip-select">
              <span>Sort</span>
              <select value={sorting} onChange={(event) => setSorting(event.target.value as Sorting)}>
                {SORTINGS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {groupStories(sortStories(stories, sorting), grouping, new Set(progress.read)).map((group) => (
          <section key={group.label} aria-label={group.label || undefined} className="story-group">
            {group.label && (
              <h3 className="group-heading">
                {group.label} <span>{group.stories.length}</span>
              </h3>
            )}
          <div className="story-grid">
            {group.stories.map((story) => {
              const done = progress.read.includes(story.id)
              const result = progress.readingResults[story.id]
              return (
                <section key={story.id} className="card story-tile">
                  <div className="tile-meta">
                    <span className="pill">{story.level}</span>
                    {story.textType && <span className="pill">{TEXT_TYPE_INFO[story.textType].label}</span>}
                    {story.readingMinutes && <span className="pill">{story.readingMinutes} min</span>}
                    <span className={done ? 'pill green' : 'pill'}>{done ? '✓ Read' : 'Not finished'}</span>
                    {isDebugFixture(story.id) && <Badge color="amber">Debug fixture</Badge>}
                  </div>
                  <h3>{story.title}</h3>
                  <p>{preview(story)}</p>
                  <div className="tile-actions">
                    <Button asChild size="3">
                      <Link to={`/stories/${story.id}`}>
                        {done ? 'Read again' : 'Read story'} <ArrowRightIcon aria-hidden="true" />
                      </Link>
                    </Button>
                    {result && (
                      <Link to={`/stories/${story.id}/exam?result=1`} className="text-button">
                        Last comprehension score: {result.score}/{result.total}
                      </Link>
                    )}
                  </div>
                </section>
              )
            })}
          </div>
          </section>
          ))}
        </>
      )}
    </Container>
  )
}
