import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { loadStories, loadVocabulary, markVocabularyKnown } from '../lib/storage'
import { vocabularySourcePath } from '../lib/vocabulary'

export function Vocabulary() {
  const [words, setWords] = useState(loadVocabulary)
  const storyIds = new Set(loadStories().map((story) => story.id))

  return (
    <Container size="2" px="4">
      <Heading size="7" mb="2">Vocabulary</Heading>
      <Text as="p" color="gray" mb="5">
        Words you are learning stay here even if their stories are removed. Mark a word as known
        to clear it here and in all saved stories.
      </Text>
      {words.length === 0 ? (
        <Flex direction="column" gap="3" align="start">
          <Text>No unknown words yet. Look up a word while reading a saved story to add it here.</Text>
          <Button asChild><Link to="/stories">Open My Stories</Link></Button>
        </Flex>
      ) : (
        <Flex direction="column" gap="4">
          {words.map((entry) => (
            <Card key={entry.key}>
              <Flex justify="between" align="start" gap="3" wrap="wrap" mb="3">
                <Heading as="h2" size="5">{entry.word}</Heading>
                <Button
                  variant="soft"
                  size="2"
                  aria-label={`Mark ${entry.word} as known`}
                  onClick={() => {
                    markVocabularyKnown(entry.key)
                    setWords(loadVocabulary())
                  }}
                >
                  Mark as known
                </Button>
              </Flex>
              <Flex direction="column" gap="4">
                {entry.sources.map((source) => (
                  <Flex key={source.storyId} direction="column" gap="2" style={{ overflowWrap: 'anywhere' }}>
                    <Text as="p" size="2" color={source.definition ? undefined : 'gray'}>
                      {source.definition ?? 'No definition saved.'}
                    </Text>
                    <Text as="p" size="2" color="gray">
                      {source.sentence || 'Source sentence unavailable.'}
                    </Text>
                    {storyIds.has(source.storyId) ? (
                      <Text asChild size="2">
                        <Link to={vocabularySourcePath(source)} aria-label={`Find ${entry.word} in ${source.title}`}>
                          {source.title}
                        </Link>
                      </Text>
                    ) : (
                      <Flex align="center" gap="2" wrap="wrap">
                        <Text size="2" color="gray">{source.title}</Text>
                        <Badge color="gray">Story removed</Badge>
                      </Flex>
                    )}
                  </Flex>
                ))}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Container>
  )
}
