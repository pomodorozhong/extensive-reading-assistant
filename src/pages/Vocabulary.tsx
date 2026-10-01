import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isDebugFixture } from '../lib/debug-fixtures'
import { loadStories, loadVisibleStories, loadVocabulary, markVocabularyKnown } from '../lib/storage'
import { groupVocabularyByLevel, groupVocabularyDefinitions, vocabularySourcePath } from '../lib/vocabulary'

export function Vocabulary() {
  const [words, setWords] = useState(loadVocabulary)
  const storyIds = new Set(loadVisibleStories().map((story) => story.id))
  const savedIds = new Set(loadStories().map((story) => story.id))
  const sections = groupVocabularyByLevel(words)

  return (
    <Container size="2" px="4">
      <Heading size="7" mb="2">Vocabulary</Heading>
      <Text as="p" color="gray" mb="5">
        Words you are learning stay here even if their stories are removed. Mark a word as known
        to clear it here and in all visible stories. Debug fixture words appear while fixture
        articles are enabled in Settings. CEFR groups are approximate and use the bundled offline
        vocabulary data, independently of each story's level and your Settings level.
      </Text>
      {words.length === 0 ? (
        <Flex direction="column" gap="3" align="start">
          <Text>No unknown words yet. Look up a word while reading to add it here.</Text>
          <Button asChild><Link to="/stories">Open My Stories</Link></Button>
        </Flex>
      ) : (
        <Flex direction="column" gap="4">
          {sections.map((section) => (
            <section key={section.level} aria-labelledby={`vocabulary-section-${section.level.toLowerCase()}`}>
              <Flex align="center" gap="2" mb="3">
                <Heading as="h2" size="5" id={`vocabulary-section-${section.level.toLowerCase()}`}>
                  {section.level}
                </Heading>
                <Badge color="gray">
                  {section.words.length} {section.words.length === 1 ? 'word' : 'words'}
                </Badge>
              </Flex>
              <Flex direction="column" gap="4">
                {section.words.map((entry) => (
                  <Card key={entry.key}>
                    <Flex justify="between" align="start" gap="3" wrap="wrap" mb="3">
                      <Heading as="h3" size="5">{entry.word}</Heading>
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
                      {groupVocabularyDefinitions(entry.sources).map((group) => (
                        <Flex key={group.definition ?? ''} direction="column" gap="3" style={{ overflowWrap: 'anywhere' }}>
                          <Text as="p" size="2" color={group.definition ? undefined : 'gray'}>
                            {group.definition ?? 'No definition saved.'}
                          </Text>
                          <Flex direction="column" gap="3" pl="3" style={{ borderLeft: '2px solid var(--gray-a5)' }}>
                            {group.sources.map((source) => (
                              <Flex key={source.storyId} direction="column" gap="2">
                                <Text as="p" size="2" color="gray">
                                  {source.sentence || 'Source sentence unavailable.'}
                                </Text>
                                {storyIds.has(source.storyId) ? (
                                  <Flex align="center" gap="2" wrap="wrap">
                                    <Text asChild size="2">
                                      <Link to={vocabularySourcePath(source)} aria-label={`Find ${entry.word} in ${source.title}`}>
                                        {source.title}
                                      </Link>
                                    </Text>
                                    {isDebugFixture(source.storyId) && !savedIds.has(source.storyId) && (
                                      <Badge color="amber">Debug fixture</Badge>
                                    )}
                                  </Flex>
                                ) : (
                                  <Flex align="center" gap="2" wrap="wrap">
                                    <Text size="2" color="gray">{source.title}</Text>
                                    <Badge color="gray">Story removed</Badge>
                                  </Flex>
                                )}
                              </Flex>
                            ))}
                          </Flex>
                        </Flex>
                      ))}
                    </Flex>
                  </Card>
                ))}
              </Flex>
            </section>
          ))}
        </Flex>
      )}
    </Container>
  )
}
