import { Card, DataList, Flex, Heading, Text } from '@radix-ui/themes'
import { storyDetails } from '../lib/story-details'
import type { Story } from '../types'

export function StoryGenerationDetails({ story }: { story: Story }) {
  const details = storyDetails(story)
  if (!details) return null
  return (
    <Card>
      <Flex direction="column" gap="3">
        <Heading as="h2" size="4">How this story was made</Heading>
        <DataList.Root size="2">
          {details.rows.map((row) => (
            <DataList.Item key={row.label}>
              <DataList.Label minWidth="8rem">{row.label}</DataList.Label>
              <DataList.Value>{row.value}</DataList.Value>
            </DataList.Item>
          ))}
        </DataList.Root>
        {details.prompts ? (
          <details className="story-details-prompts">
            <summary>Prompts sent to the model</summary>
            <Text as="p" size="2" weight="medium" mt="2">System prompt</Text>
            <pre>{details.prompts.system}</pre>
            <Text as="p" size="2" weight="medium" mt="2">User prompt</Text>
            <pre>{details.prompts.user}</pre>
          </details>
        ) : (
          <Text as="p" size="2" color="gray">
            The model and prompt were not recorded for this story.
          </Text>
        )}
      </Flex>
    </Card>
  )
}
