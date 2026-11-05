import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { Button } from '@radix-ui/themes'
import { useState } from 'react'
import type { ExamQuestion } from '../lib/progress'

const LETTERS = ['A', 'B', 'C', 'D']

export function ExamQuiz({
  eyebrow,
  title,
  subtitle,
  questions,
  exitLabel,
  onExit,
  onFinish,
}: {
  eyebrow: string
  title: string
  subtitle: string
  questions: ExamQuestion[]
  exitLabel: string
  onExit: () => void
  onFinish: (answers: number[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const question = questions[index]
  const last = index === questions.length - 1
  const answered = answers[index] !== undefined

  return (
    <div className="quiz-wrap">
      <button type="button" className="back-link" onClick={onExit}>
        <ArrowLeftIcon aria-hidden="true" /> {exitLabel}
      </button>
      <div className="quiz-head">
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="progress-row">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{Object.keys(answers).length} answered</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={index + 1}
      >
        <div className="progress-fill" style={{ width: `${(100 * (index + 1)) / questions.length}%` }} />
      </div>
      <section className="card quiz-card" aria-live="polite">
        <h2 className="quiz-question">{question.question}</h2>
        <div className="answer-list" role="radiogroup" aria-label="Answers">
          {question.options.map((option, optionIndex) => (
            <button
              key={optionIndex}
              type="button"
              role="radio"
              aria-checked={answers[index] === optionIndex}
              className={answers[index] === optionIndex ? 'answer selected' : 'answer'}
              onClick={() => setAnswers((current) => Object.assign([...current], { [index]: optionIndex }))}
            >
              <span className="letter">{LETTERS[optionIndex]}</span>
              <span>{option}</span>
            </button>
          ))}
        </div>
      </section>
      <div className="quiz-footer">
        <Button
          type="button"
          variant="outline"
          color="gray"
          size="3"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="3"
          disabled={!answered}
          onClick={() => (last ? onFinish(questions.map((_, i) => answers[i] ?? -1)) : setIndex(index + 1))}
        >
          {last ? 'See results' : 'Next'} <ArrowRightIcon aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}
