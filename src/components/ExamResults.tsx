import { ArrowLeftIcon } from '@radix-ui/react-icons'
import { Button } from '@radix-ui/themes'
import type { ReactNode } from 'react'
import type { ExamResult } from '../lib/progress'

export function ExamResults({
  result,
  label,
  backLabel,
  onBack,
  actions,
}: {
  result: ExamResult
  label: string
  backLabel: string
  onBack: () => void
  actions?: ReactNode
}) {
  const percent = Math.round((result.score / result.total) * 100)
  const heading =
    percent === 100 ? 'Excellent work!' : percent >= 70 ? 'Nice work — keep going!' : 'Keep practicing — you’re learning.'

  return (
    <div className="results-wrap">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeftIcon aria-hidden="true" /> {backLabel}
      </button>
      <div className="result-hero">
        <div className="score-circle">{percent}%</div>
        <div className="eyebrow">EXAM COMPLETE</div>
        <h1>{heading}</h1>
        <p>
          You answered {result.score} of {result.total} questions correctly. Review the answers below.
        </p>
        <span className="pill blue">{label}</span>
      </div>
      {actions && <div className="result-actions">{actions}</div>}
      <div className="review-list">
        {result.questions.map((question, index) => {
          const correct = question.correct === result.answers[index]
          const chosen = result.answers[index]
          return (
            <section key={index} className="card review-item">
              <div className="review-top">
                <h3>
                  {index + 1}. {question.question}
                </h3>
                <span className={correct ? 'status-icon correct' : 'status-icon wrong'}>
                  {correct ? '✓ Correct' : '✕ Incorrect'}
                </span>
              </div>
              <p className="review-answer">
                <strong>Your answer:</strong> {question.options[chosen] ?? 'No answer'}
              </p>
              {!correct && (
                <p className="review-answer">
                  <strong>Correct answer:</strong> {question.options[question.correct]}
                </p>
              )}
              {question.explanation && <p>{question.explanation}</p>}
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function ResultActionButton({ children, onClick, primary }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <Button type="button" size="3" variant={primary ? 'solid' : 'outline'} color={primary ? undefined : 'gray'} onClick={onClick}>
      {children}
    </Button>
  )
}
