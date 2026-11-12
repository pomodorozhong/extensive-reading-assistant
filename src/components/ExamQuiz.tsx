import { ArrowLeftIcon, ArrowRightIcon } from '@radix-ui/react-icons'
import { Button, Card, Container, Flex, Heading, Progress, RadioCards, Text } from '@radix-ui/themes'
import { useRef, useState } from 'react'
import type { ExamQuestion } from '../lib/progress'

/** Steps through the questions one at a time and reports the chosen option for each (-1 when unanswered). */
export function ExamQuiz({
  title,
  subtitle,
  questions,
  exitLabel,
  onExit,
  onFinish,
}: {
  title: string
  subtitle: string
  questions: ExamQuestion[]
  exitLabel: string
  onExit: () => void
  onFinish: (answers: number[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | undefined)[]>([])
  const question = questions[index]
  const last = index === questions.length - 1
  const chosen = answers[index]
  const headingId = `exam-question-${index}`
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Moving to another question puts focus on it, so keyboard and screen reader users start there.
  function goTo(next: number) {
    setIndex(next)
    requestAnimationFrame(() => headingRef.current?.focus())
  }

  return (
    <Container size="2" px="4">
      <Button type="button" variant="ghost" size="2" mb="3" onClick={onExit}>
        <ArrowLeftIcon />
        {exitLabel}
      </Button>
      <Heading size="7" mb="1">
        {title}
      </Heading>
      <Text as="p" color="gray" mb="5">
        {subtitle}
      </Text>

      <Flex justify="between" mb="2">
        <Text size="2" color="gray">
          Question {index + 1} of {questions.length}
        </Text>
        <Text size="2" color="gray">
          {answers.filter((answer) => answer !== undefined).length} answered
        </Text>
      </Flex>
      <Progress value={(100 * (index + 1)) / questions.length} mb="4" aria-hidden="true" />

      <Card size="3">
        <Heading as="h2" size="4" mb="4" id={headingId} ref={headingRef} tabIndex={-1} className="exam-question">
          {question.question}
        </Heading>
        <RadioCards.Root
          key={index}
          columns="1"
          value={chosen === undefined ? '' : String(chosen)}
          onValueChange={(value) =>
            setAnswers((current) => Object.assign([...current], { [index]: Number(value) }))
          }
          aria-labelledby={headingId}
        >
          {question.options.map((option, optionIndex) => (
            <RadioCards.Item key={optionIndex} value={String(optionIndex)} className="exam-option">
              <Text>
                <Text weight="bold">{String.fromCharCode(65 + optionIndex)}.</Text> {option}
              </Text>
            </RadioCards.Item>
          ))}
        </RadioCards.Root>
      </Card>

      <Flex justify="between" gap="3" mt="4">
        <Button
          type="button"
          variant="soft"
          color="gray"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          disabled={chosen === undefined}
          onClick={() =>
            last ? onFinish(questions.map((_, i) => answers[i] ?? -1)) : goTo(index + 1)
          }
        >
          {last ? 'See results' : 'Next'}
          <ArrowRightIcon />
        </Button>
      </Flex>
    </Container>
  )
}
