import { Button, Callout, Container, Flex, Heading, RadioCards, SegmentedControl, Spinner, Text } from '@radix-ui/themes'
import { useState } from 'react'
import { ExamQuiz } from '../components/ExamQuiz'
import { ExamResults } from '../components/ExamResults'
import { buildVocabularyExam, practiceMissedQuestions, storyCandidates } from '../lib/exam'
import { loadProgress, saveVocabularyResult, scoreAnswers, type ExamQuestion, type ExamResult } from '../lib/progress'
import { loadVisibleStories, loadVocabulary } from '../lib/storage'

type Source = 'stories' | 'vocabulary'

const SOURCE_LABEL: Record<Source, string> = {
  stories: 'words from past stories',
  vocabulary: 'words in Vocabulary',
}

type Phase =
  | { name: 'setup' }
  | { name: 'building' }
  | { name: 'quiz'; source: Source; questions: ExamQuestion[]; practice: boolean }
  | { name: 'result'; result: ExamResult; practice: boolean }

export function Exam() {
  const [stories] = useState(() => loadVisibleStories())
  const [saved] = useState(() => loadVocabulary())
  const [storyWordCount] = useState(() => storyCandidates(stories).length)
  const [source, setSource] = useState<Source>('stories')
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState<Phase>({ name: 'setup' })
  const [error, setError] = useState<string | null>(null)
  const latest = loadProgress().vocabularyResults.at(-1)

  async function start(from: Source, size: number) {
    setError(null)
    setPhase({ name: 'building' })
    const outcome = await buildVocabularyExam(from, size, stories, saved)
    if (!outcome.ok) {
      setError(outcome.message)
      setPhase({ name: 'setup' })
      return
    }
    setPhase({ name: 'quiz', source: from, questions: outcome.questions, practice: false })
    window.scrollTo(0, 0)
  }

  if (phase.name === 'quiz') {
    const { questions, practice } = phase
    return (
      <ExamQuiz
        title={practice ? 'Practice missed words' : 'Vocabulary exam'}
        subtitle={`Questions from ${SOURCE_LABEL[phase.source]}. Choose one answer for each question.`}
        questions={questions}
        exitLabel="Exit exam"
        onExit={() => setPhase({ name: 'setup' })}
        onFinish={(answers) => {
          const result: ExamResult = {
            type: 'vocabulary',
            source: phase.source,
            storyId: null,
            score: scoreAnswers(questions, answers),
            total: questions.length,
            questions,
            answers,
            createdAt: new Date().toISOString(),
          }
          // Practice rounds repeat missed words, so only full exams count as the last score.
          if (!practice) saveVocabularyResult(result)
          setPhase({ name: 'result', result, practice })
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  if (phase.name === 'result') {
    const { result } = phase
    const missed = practiceMissedQuestions(result.questions, result.answers)
    const from: Source = result.source === 'vocabulary' ? 'vocabulary' : 'stories'
    return (
      <ExamResults
        result={result}
        label={`${phase.practice ? 'Practice' : 'Vocabulary exam'} · ${SOURCE_LABEL[from]}`}
        backLabel="Back to Exam"
        onBack={() => setPhase({ name: 'setup' })}
        actions={
          <>
            <Button type="button" onClick={() => void start(from, count)}>
              Retake exam
            </Button>
            {missed.length > 0 && (
              <Button
                type="button"
                variant="soft"
                onClick={() => {
                  setPhase({ name: 'quiz', source: from, questions: missed, practice: true })
                  window.scrollTo(0, 0)
                }}
              >
                Practice {missed.length} missed {missed.length === 1 ? 'word' : 'words'}
              </Button>
            )}
          </>
        }
      />
    )
  }

  const building = phase.name === 'building'

  return (
    <Container size="2" px="4">
      <Heading size="7" mb="2">
        Exam
      </Heading>
      <Text as="p" color="gray" mb="5">
        Check the meanings of words you met while reading. Questions come from the built-in
        dictionary, so no Gemini key is needed.
      </Text>

      <Flex direction="column" gap="5">
        <div>
          <Text as="div" size="2" weight="medium" mb="2" id="exam-source-label">
            Questions from
          </Text>
          <RadioCards.Root
            columns={{ initial: '1', sm: '2' }}
            value={source}
            onValueChange={(value) => setSource(value as Source)}
            aria-labelledby="exam-source-label"
          >
            <RadioCards.Item value="stories">
              <Flex direction="column" width="100%">
                <Text weight="bold">Past stories</Text>
                <Text size="2" color="gray">
                  Harder words across My Stories that you have not marked as known.
                </Text>
                <Text size="1" color="gray" mt="1">
                  {storyWordCount} {storyWordCount === 1 ? 'word' : 'words'}
                </Text>
              </Flex>
            </RadioCards.Item>
            <RadioCards.Item value="vocabulary">
              <Flex direction="column" width="100%">
                <Text weight="bold">Vocabulary</Text>
                <Text size="2" color="gray">
                  Only the words you looked up while reading and still track.
                </Text>
                <Text size="1" color="gray" mt="1">
                  {saved.length} {saved.length === 1 ? 'word' : 'words'}
                </Text>
              </Flex>
            </RadioCards.Item>
          </RadioCards.Root>
        </div>

        <div>
          <Text as="div" size="2" weight="medium" mb="2" id="exam-count-label">
            Number of questions
          </Text>
          <SegmentedControl.Root
            value={String(count)}
            onValueChange={(value) => setCount(Number(value))}
            aria-labelledby="exam-count-label"
          >
            <SegmentedControl.Item value="5">5</SegmentedControl.Item>
            <SegmentedControl.Item value="10">10</SegmentedControl.Item>
          </SegmentedControl.Root>
        </div>

        <Flex direction="column" gap="3" align="start">
          <Button type="button" size="3" disabled={building} onClick={() => void start(source, count)}>
            {building && <Spinner />}
            Start exam
          </Button>
          {error && (
            <Callout.Root color="amber" role="alert">
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          {latest && (
            <Text size="2" color="gray">
              Last exam: {latest.score} of {latest.total} ·{' '}
              {new Date(latest.createdAt).toLocaleDateString()}
            </Text>
          )}
        </Flex>
      </Flex>
    </Container>
  )
}
