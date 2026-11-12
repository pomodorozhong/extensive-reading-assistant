import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Button, Card, Flex, Heading, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loadProgress, markStoryRead } from '../lib/progress'
import { loadSettings } from '../lib/storage'

/** The end of a story: finishing marks it as read and, when Settings allows, opens the reading exam. */
export function StoryFinish({ storyId }: { storyId: string }) {
  const navigate = useNavigate()
  const [offerExam] = useState(() => loadSettings().offerExamAfterStory)
  const [progress] = useState(() => loadProgress())
  const read = progress.read.includes(storyId)
  const previous = progress.readingResults[storyId]

  function finish() {
    markStoryRead(storyId)
    navigate(offerExam ? `/stories/${storyId}/exam` : '/stories')
  }

  return (
    <Card>
      <Heading as="h2" size="4" mb="1">
        {read ? 'You finished this story' : 'Finished reading?'}
      </Heading>
      <Text as="p" size="2" color="gray" mb="3">
        {offerExam
          ? 'Finishing opens a short reading comprehension exam. You can skip it.'
          : 'Finishing marks this story as read. The exam after each story is off in Settings.'}
      </Text>
      <Flex gap="3" wrap="wrap" align="center">
        <Button type="button" onClick={finish}>
          Finish reading
          <ArrowRightIcon />
        </Button>
        {previous && (
          <>
            <Button asChild variant="soft">
              <Link to={`/stories/${storyId}/exam?result=1`}>
                See last result ({previous.score} of {previous.total})
              </Link>
            </Button>
            <Button asChild variant="soft" color="gray">
              <Link to={`/stories/${storyId}/exam`}>Retake exam</Link>
            </Button>
          </>
        )}
      </Flex>
    </Card>
  )
}
