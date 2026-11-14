import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import { Link } from 'react-router-dom'
import { StoryChips } from '../components/StoryChips'
import { isDebugFixture } from '../lib/debug-fixtures'
import { loadProgress } from '../lib/progress'
import { loadVisibleStories } from '../lib/storage'

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function MyStories() {
  const stories = loadVisibleStories()
  const progress = loadProgress()

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
          <Text>No stories yet.</Text>
          <Button asChild>
            <Link to="/new">Generate a story</Link>
          </Button>
        </Flex>
      ) : (
        <Flex direction="column" gap="3">
          {stories.map((story) => (
            <Card asChild key={story.id}>
              <Link to={`/stories/${story.id}`} className="card-link">
                <Flex justify="between" align="start" gap="3">
                  <div>
                    {isDebugFixture(story.id) && <Badge size="2" color="amber" radius="full" mb="1">Debug fixture</Badge>}
                    <Heading size="4" mb="1">
                      {story.title}
                    </Heading>
                    <Text as="p" size="2" color="gray" mb="2">
                      {formatDate(story.createdAt)}
                    </Text>
                    <Flex gap="2" wrap="wrap">
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
          ))}
        </Flex>
      )}
    </Container>
  )
}
