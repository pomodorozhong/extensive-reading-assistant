import { ArrowLeftIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons'
import { Badge, Button, Card, Container, Flex, Heading, Text } from '@radix-ui/themes'
import type { ReactNode } from 'react'
import type { ExamResult } from '../lib/progress'

/** The score, then each question with the reader's answer, the correct answer, and why. */
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
  const percent = result.total ? Math.round((result.score / result.total) * 100) : 0

  return (
    <Container size="2" px="4">
      <Button type="button" variant="ghost" size="2" mb="3" onClick={onBack}>
        <ArrowLeftIcon />
        {backLabel}
      </Button>
      <Flex align="center" gap="2" wrap="wrap" mb="1">
        <Heading size="7">
          {result.score} of {result.total} correct
        </Heading>
        <Badge color={percent >= 70 ? 'green' : 'amber'} size="2">
          {percent}%
        </Badge>
      </Flex>
      <Text as="p" color="gray" mb="4">
        {label} · {new Date(result.createdAt).toLocaleDateString()}
      </Text>
      {actions && (
        <Flex gap="3" wrap="wrap" mb="5">
          {actions}
        </Flex>
      )}

      <Heading as="h2" size="4" mb="3">
        Review your answers
      </Heading>
      <Flex direction="column" gap="3">
        {result.questions.map((question, index) => {
          const chosen = result.answers[index]
          const correct = question.correct === chosen
          return (
            <Card key={index}>
              <Flex justify="between" align="start" gap="3" mb="2">
                <Heading as="h3" size="3">
                  {index + 1}. {question.question}
                </Heading>
                <Badge color={correct ? 'green' : 'red'} className="exam-review-badge">
                  {correct ? <CheckIcon /> : <Cross2Icon />}
                  {correct ? 'Correct' : 'Incorrect'}
                </Badge>
              </Flex>
              <Text as="p" size="2">
                <Text weight="medium">Your answer:</Text> {question.options[chosen] ?? 'No answer'}
              </Text>
              {!correct && (
                <Text as="p" size="2">
                  <Text weight="medium">Correct answer:</Text> {question.options[question.correct]}
                </Text>
              )}
              {question.explanation && (
                <Text as="p" size="2" color="gray" mt="2">
                  {question.explanation}
                </Text>
              )}
            </Card>
          )
        })}
      </Flex>
    </Container>
  )
}
