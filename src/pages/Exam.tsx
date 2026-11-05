import { ArrowRightIcon } from '@radix-ui/react-icons'
import { Button, SegmentedControl, Spinner } from '@radix-ui/themes'
import { useState } from 'react'
import { ExamQuiz } from '../components/ExamQuiz'
import { ExamResults, ResultActionButton } from '../components/ExamResults'
import { buildVocabularyExam, practiceMissedQuestions, storyCandidates } from '../lib/exam'
import { loadProgress, saveVocabularyResult, scoreAnswers, type ExamQuestion, type ExamResult } from '../lib/progress'
import { loadVisibleStories, loadVocabulary } from '../lib/storage'

type Source = 'stories' | 'dictionary'

const SOURCE_LABEL: Record<Source, string> = { stories: 'past stories', dictionary: 'saved words' }

type Phase =
  | { name: 'setup' }
  | { name: 'building' }
  | { name: 'quiz'; source: Source; questions: ExamQuestion[]; practice: boolean }
  | { name: 'result'; result: ExamResult }

export function Exam() {
  const stories = loadVisibleStories()
  const saved = loadVocabulary()
  const storyWordCount = storyCandidates(stories).length
  const latest = loadProgress().vocabularyResults.at(-1)
  const [source, setSource] = useState<Source>('stories')
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState<Phase>({ name: 'setup' })
  const [error, setError] = useState<string | null>(null)
  const dictionaryReady = saved.length >= 2
  const activeSource: Source = source === 'dictionary' && !dictionaryReady ? 'stories' : source

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
    const { questions } = phase
    return (
      <ExamQuiz
        eyebrow="VOCABULARY EXAM"
        title={phase.practice ? 'Practice missed words' : 'Vocabulary practice'}
        subtitle={`Questions from your ${SOURCE_LABEL[phase.source]}. Select one answer per question.`}
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
          saveVocabularyResult(result)
          setPhase({ name: 'result', result })
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  if (phase.name === 'result') {
    const { result } = phase
    const missed = practiceMissedQuestions(result.questions, result.answers)
    const from = result.source ?? 'stories'
    return (
      <ExamResults
        result={result}
        label={`Vocabulary · ${SOURCE_LABEL[from]}`}
        backLabel="Back to Exam"
        onBack={() => setPhase({ name: 'setup' })}
        actions={
          <>
            <ResultActionButton primary onClick={() => void start(from, result.total)}>
              Retake exam
            </ResultActionButton>
            {missed.length > 0 && (
              <ResultActionButton
                onClick={() => {
                  setPhase({ name: 'quiz', source: from, questions: missed, practice: true })
                  window.scrollTo(0, 0)
                }}
              >
                Practice {missed.length} missed {missed.length === 1 ? 'word' : 'words'}
              </ResultActionButton>
            )}
          </>
        }
      />
    )
  }

  return (
    <div className="container exam-page">
      <div className="page-heading">
        <div className="eyebrow">VOCABULARY PRACTICE</div>
        <h1>Test your vocabulary</h1>
        <p>Select where your words come from. Both options test vocabulary, not reading comprehension.</p>
      </div>
      <div className="content-narrow">
        <div className="section-caption">1 · Choose your question source</div>
        <div className="source-grid" role="radiogroup" aria-label="Question source">
          <SourceCard
            active={activeSource === 'stories'}
            onSelect={() => setSource('stories')}
            title="From past stories"
            text="Randomly quiz me on vocabulary appearing across all the stories in My Stories."
            meta={`${storyWordCount} ${storyWordCount === 1 ? 'word' : 'words'} available`}
          />
          <SourceCard
            active={activeSource === 'dictionary'}
            disabled={!dictionaryReady}
            onSelect={() => setSource('dictionary')}
            title="From my Dictionary"
            text="Only quiz me on words I explicitly saved while reading."
            meta={
              dictionaryReady
                ? `${saved.length} saved words`
                : 'Save at least 2 words while reading to use this source'
            }
          />
        </div>

        <div className="section-caption">2 · Choose the number of questions</div>
        <div className="card exam-actions-card">
          <div className="controls">
            <SegmentedControl.Root
              value={String(count)}
              onValueChange={(value) => setCount(Number(value))}
              aria-label="Number of questions"
            >
              <SegmentedControl.Item value="5">5 questions</SegmentedControl.Item>
              <SegmentedControl.Item value="10">10 questions</SegmentedControl.Item>
            </SegmentedControl.Root>
            <Button
              type="button"
              size="3"
              disabled={phase.name === 'building'}
              onClick={() => void start(activeSource, count)}
            >
              {phase.name === 'building' ? <Spinner size="2" /> : null}
              Start vocabulary exam <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
          {error && (
            <p className="exam-error" role="alert">
              {error}
            </p>
          )}
          {latest && (
            <p className="exam-latest">
              Last exam: {latest.score}/{latest.total} · {new Date(latest.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceCard({
  active,
  disabled,
  onSelect,
  title,
  text,
  meta,
}: {
  active: boolean
  disabled?: boolean
  onSelect: () => void
  title: string
  text: string
  meta: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      className={active ? 'source-card active' : 'source-card'}
      onClick={onSelect}
    >
      <span className="source-head">
        <span className="source-radio" aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="source-meta">{meta}</span>
    </button>
  )
}
