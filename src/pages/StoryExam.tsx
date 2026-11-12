import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Button, Callout, Container, Flex, Heading, Spinner, Text } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ExamQuiz } from '../components/ExamQuiz'
import { ExamResults } from '../components/ExamResults'
import { generateReadingQuestions } from '../lib/exam'
import { loadProgress, saveReadingResult, scoreAnswers, type ExamQuestion, type ExamResult } from '../lib/progress'
import { getStory, loadSettings } from '../lib/storage'

export function StoryExam() {
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const showSaved = searchParams.get('result') === '1'
  // A new key starts the page fresh when the story or the saved-result view changes.
  return <StoryExamPage key={`${id}:${showSaved}`} id={id} showSaved={showSaved} />
}

function StoryExamPage({ id, showSaved }: { id: string; showSaved: boolean }) {
  const navigate = useNavigate()
  const [story] = useState(() => getStory(id))
  const [result, setResult] = useState<ExamResult | undefined>(() =>
    showSaved ? loadProgress().readingResults[id] : undefined,
  )
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const needsQuestions = Boolean(story) && !result

  useEffect(() => {
    if (!story || !needsQuestions) return
    const controller = new AbortController()
    void generateReadingQuestions(story, loadSettings(), controller.signal).then((outcome) => {
      if (controller.signal.aborted) return
      if (outcome.ok) setQuestions(outcome.questions)
      else setError(outcome.message)
    })
    return () => controller.abort()
    // The story is fixed for this page; only a retry should ask again.
  }, [attempt]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!story) {
    return (
      <Container size="2" px="4">
        <Heading size="7" mb="3">
          Story not found
        </Heading>
        <Button asChild>
          <Link to="/stories">Back to My Stories</Link>
        </Button>
      </Container>
    )
  }

  const backToStory = () => navigate(`/stories/${id}`)

  if (result) {
    return (
      <ExamResults
        result={result}
        label={`Reading comprehension · ${story.title}`}
        backLabel="Back to story"
        onBack={backToStory}
        actions={
          <>
            <Button
              type="button"
              onClick={() => {
                setResult(undefined)
                setQuestions(null)
                setError(null)
                setAttempt(attempt + 1)
                window.scrollTo(0, 0)
              }}
            >
              Retake exam
            </Button>
            <Button asChild variant="soft" color="gray">
              <Link to="/stories">My Stories</Link>
            </Button>
          </>
        }
      />
    )
  }

  if (questions) {
    return (
      <ExamQuiz
        title="Check your understanding"
        subtitle={story.title}
        questions={questions}
        exitLabel="Skip exam"
        onExit={backToStory}
        onFinish={(answers) => {
          const finished: ExamResult = {
            type: 'reading',
            source: null,
            storyId: id,
            score: scoreAnswers(questions, answers),
            total: questions.length,
            questions,
            answers,
            createdAt: new Date().toISOString(),
          }
          saveReadingResult(finished)
          setResult(finished)
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  return (
    <Container size="2" px="4">
      <Button type="button" variant="ghost" size="2" mb="3" onClick={backToStory}>
        <ArrowLeftIcon />
        Skip exam
      </Button>
      <Heading size="7" mb="1">
        Check your understanding
      </Heading>
      <Text as="p" color="gray" mb="5">
        {story.title}
      </Text>
      {error ? (
        <Flex direction="column" gap="3" align="start">
          <Callout.Root color="amber" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
          <Flex gap="3" wrap="wrap">
            <Button
              type="button"
              onClick={() => {
                setError(null)
                setAttempt(attempt + 1)
              }}
            >
              Try again
            </Button>
            <Button asChild variant="soft" color="gray">
              <Link to="/settings">Open Settings</Link>
            </Button>
          </Flex>
        </Flex>
      ) : (
        <Flex align="center" gap="2" role="status">
          <Spinner />
          <Text color="gray">Writing questions about this story…</Text>
        </Flex>
      )}
    </Container>
  )
}
