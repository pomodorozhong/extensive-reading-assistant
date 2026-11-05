import { Button, Spinner } from '@radix-ui/themes'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ExamQuiz } from '../components/ExamQuiz'
import { ExamResults, ResultActionButton } from '../components/ExamResults'
import { generateReadingQuestions } from '../lib/exam'
import { loadProgress, saveReadingResult, scoreAnswers, type ExamQuestion, type ExamResult } from '../lib/progress'
import { getStory, loadSettings } from '../lib/storage'

export function StoryExam() {
  const { id = '' } = useParams()
  return <StoryExamPage key={id} id={id} />
}

function StoryExamPage({ id }: { id: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const story = getStory(id)
  const previous = loadProgress().readingResults[id]
  const showSaved = searchParams.get('result') === '1' && previous
  const [result, setResult] = useState<ExamResult | undefined>(showSaved ? previous : undefined)
  const [questions, setQuestions] = useState<ExamQuestion[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const needsQuestions = Boolean(story) && !showSaved

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
      <div className="quiz-wrap">
        <h1>Story not found</h1>
        <Button asChild>
          <Link to="/stories">Back to My Stories</Link>
        </Button>
      </div>
    )
  }

  const backToStory = () => navigate(`/stories/${id}`)

  if (result) {
    return (
      <ExamResults
        result={result}
        label="Reading comprehension"
        backLabel="Back to story"
        onBack={backToStory}
        actions={<ResultActionButton primary onClick={() => navigate('/stories')}>Back to My Stories</ResultActionButton>}
      />
    )
  }

  if (questions) {
    return (
      <ExamQuiz
        eyebrow="READING COMPREHENSION"
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
    <div className="quiz-wrap">
      <button type="button" className="back-link" onClick={backToStory}>
        ← Skip exam
      </button>
      <div className="quiz-head">
        <div className="eyebrow">READING COMPREHENSION</div>
        <h1>Check your understanding</h1>
        <p>{story.title}</p>
      </div>
      {error ? (
        <div className="card quiz-card" role="alert">
          <p>{error}</p>
          <div className="end-actions">
            <Button type="button" onClick={() => {
                setError(null)
                setAttempt(attempt + 1)
              }}>Try again</Button>
            <Button asChild variant="outline" color="gray">
              <Link to="/settings">Open Settings</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="card quiz-card" role="status">
          <Spinner size="2" /> Writing questions about this story…
        </div>
      )}
    </div>
  )
}
