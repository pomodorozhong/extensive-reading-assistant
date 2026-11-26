import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { StoryChips } from '../components/StoryChips'
import { isDebugFixture } from '../lib/debug-fixtures'
import { loadProgress, type Progress } from '../lib/progress'
import { STARTER_STORIES, isStarterStory } from '../lib/starter-stories'
import { loadVisibleStories } from '../lib/storage'
import type { Story } from '../types'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function StoryCard({ story, progress }: { story: Story; progress: Progress }) {
  const starter = isStarterStory(story.id)
  return (
    <Card asChild>
      <Link to={`/stories/${story.id}`} className="card-link">
        <Flex justify="between" align="start" gap="3">
          <div>
            {isDebugFixture(story.id) && <Badge size="2" color="amber" radius="full" mb="1">Debug fixture</Badge>}
            <Heading size="4" mb="1">
              {story.title}
            </Heading>
            {!starter && (
              <Text as="p" size="2" color="gray" mb="2">
                {formatDate(story.createdAt)}
              </Text>
            )}
            <Flex gap="2" wrap="wrap" mt={starter ? '2' : undefined}>
              <StoryChips story={story} />
            </Flex>
          </div>
          <Flex gap="2" wrap="wrap" justify="end" className="story-card-badges">
            {progress.read.includes(story.id) && <Badge size="2" color="green" radius="full">Read</Badge>}
            {progress.readingResults[story.id] && (
              <Badge size="2" color="gray" radius="full">
                Exam {progress.readingResults[story.id].score}/{progress.readingResults[story.id].total}
              </Badge>
            )}
          </Flex>
        </Flex>
      </Link>
    </Card>
  )
}

export function MyStories() {
  const visible = loadVisibleStories()
  const stories = visible.filter((story) => !isStarterStory(story.id))
  // A starter the reader has changed is saved, but it keeps its place in this section, A1 to B2.
  const starters = STARTER_STORIES.map((starter) => visible.find((story) => story.id === starter.id) ?? starter)
  const progress = loadProgress()
  const { hash } = useLocation()

  // The key dialog links to #starter-stories; the router does not scroll to a hash itself.
  useEffect(() => {
    if (hash === '#starter-stories') document.getElementById('starter-stories')?.scrollIntoView()
  }, [hash])

  return (
    <Container size="2" px="4">
      <Heading size="7" mb="2">
        My Stories
      </Heading>
      <Text as="p" color="gray" mb="5">
        Saved stories stay on this device.
      </Text>

      {stories.length === 0 ? (
        <Flex direction="column" gap="3" align="start">
          <Text>No stories of your own yet.</Text>
          <Button asChild>
            <Link to="/new">Generate a story</Link>
          </Button>
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} progress={progress} />
          ))}
        </Flex>
      )}

      <section id="starter-stories" aria-labelledby="starter-stories-heading" className="starter-stories">
        <Heading as="h2" size="5" mb="1" id="starter-stories-heading">
          Starter stories
        </Heading>
        <Text as="p" color="gray" mb="4">
          Four short stories, one for each level from A1 to B2, ready to read. No Gemini key needed.
        </Text>
        <Flex direction="column" gap="3">
          {starters.map((story) => (
            <StoryCard key={story.id} story={story} progress={progress} />
          ))}
        </Flex>
      </section>
    </Container>
  )
}
