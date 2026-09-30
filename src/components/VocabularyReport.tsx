import { Badge, Card, Flex, Heading, Text } from '@radix-ui/themes'
import { useMemo } from 'react'
import { analyzeVocabulary, type VocabularyEntry } from '../lib/cefr'
import type { CefrLevel } from '../types'

function WordList({ entries }: { entries: VocabularyEntry[] }) {
  return (
    <ul>
      {entries.map((entry) => (
        <li key={entry.word}>
          <strong>{entry.word}</strong> × {entry.count}
          {entry.level && <> <Badge>{entry.level}</Badge></>}
          {entry.level && entry.lemmas.join(' + ') !== entry.word && (
            <Text size="2" color="gray"> (matched {entry.lemmas.join(' + ')})</Text>
          )}
        </li>
      ))}
    </ul>
  )
}

export function VocabularyReport({ body, level }: { body: string; level: CefrLevel }) {
  const report = useMemo(() => analyzeVocabulary(body, level), [body, level])
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Heading as="h2" size="4">Approximate vocabulary difficulty</Heading>
        <Text as="p" size="2" color="gray">
          Compared with this story’s recorded level, {level}. This advisory report estimates
          vocabulary only; it does not certify CEFR level. You can keep reading any story.
        </Text>
        {report.total === 0 ? <Text>No vocabulary occurrences to analyze.</Text> : (
          <Text as="p">
            <strong>{report.abovePercent.toFixed(1)}% above {level}</strong>
            {' '}({report.aboveCount} of {report.total} word occurrences).
            {' '}{report.unlistedCount} unlisted {report.unlistedCount === 1 ? 'occurrence' : 'occurrences'}, reported separately.
          </Text>
        )}
        <details>
          <summary>Detected names ({report.nameCount} {report.nameCount === 1 ? 'occurrence' : 'occurrences'} excluded)</summary>
          <Text as="p" size="2" color="gray">
            Automatically detected person names are excluded from the percentage. Detection can miss names or misidentify words, including pet names.
          </Text>
          {report.names.length > 0 && <WordList entries={report.names} />}
        </details>
        <details>
          <summary>Above-level words ({report.aboveLevel.length} distinct)</summary>
          {report.aboveLevel.length ? <WordList entries={report.aboveLevel} /> : <Text as="p" size="2">No listed words above {level}.</Text>}
        </details>
        <details>
          <summary>Unlisted words ({report.unlisted.length} distinct)</summary>
          <Text as="p" size="2" color="gray">These words are unclassified, including undetected names or words the dataset does not cover.</Text>
          {report.unlisted.length > 0 && <WordList entries={report.unlisted} />}
        </details>
        <details>
          <summary>Calculation and dataset</summary>
          <Text as="p" size="2">
            Percentage = above-level occurrences ÷ all analyzed word occurrences × 100.
            Repetitions count each time; unlisted words stay in the denominator but are neither
            above-level nor within-level. Punctuation and numbers are excluded. Hyphenated words
            split into words. Detected person names are excluded before case-insensitive lookup;
            {` ${report.nameCount} of ${report.wordCount} original word occurrences were excluded.`}
            {' '}Inflections use wink-lemmatizer; names use compromise. Both are approximate. A contraction
            counts once at its hardest matched component’s level. A2 includes A1, and so on.
          </Text>
          <Text as="p" size="2" mt="2">
            Data: <a href="https://github.com/openlanguageprofiles/olp-en-cefrj">CEFR-J Wordlist 1.5</a>
            {' '}(Yukio Tono, TUFS; use with attribution) and Octanove C1/C2 Profile 1.0
            {' '}(<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>).
            Entries shared by levels use the lowest listed level. Word senses, grammar, and
            multiword expressions are not assessed; coverage is incomplete.
          </Text>
        </details>
      </Flex>
    </Card>
  )
}
