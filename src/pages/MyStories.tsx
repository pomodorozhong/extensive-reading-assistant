import { Badge, Button, Container } from '@radix-ui/themes'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Link } from 'react-router-dom'
import { isDebugFixture } from '../lib/debug-fixtures'
import { TEXT_TYPE_INFO } from '../lib/generation-options'
import { loadProgress } from '../lib/progress'
import { loadVisibleStories, loadVocabulary } from '../lib/storage'
import type { Story } from '../types'

function preview(story: Story): string {
  const text = story.body.replace(/\s+/g, ' ').trim()
  return text.length > 150 ? `${text.slice(0, 150).replace(/\s+\S*$/, '')}…` : text
}

export function MyStories() {
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

          <div className="story-grid">
            {stories.map((story) => {
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
        </>
      )}
    </Container>
  )
}
