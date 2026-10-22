import { InfoCircledIcon } from '@radix-ui/react-icons'
import { Button, Callout, Checkbox, CheckboxCards, Flex, Heading, Progress, Text } from '@radix-ui/themes'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { initialGenerationChoices } from '../lib/generation-options'
import {
  firstLevelCheckSet, LEVEL_CHECK_SETS, nextLevelCheckSet, PASS_THRESHOLD, scoreLevelCheck, type LevelCheckItem,
} from '../lib/level-check'
import { setNewStoryDraftLevel } from '../lib/new-story-draft'
import { loadSettings, saveSettings } from '../lib/storage'

type Step = 'intro' | 'set' | 'result'

/** A tick-the-words-you-know check in short sets that suggests a reading level. Answers never leave the page. */
export function LevelCheck() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('intro')
  // Every word shown so far, the current set, and the answers for all finished sets.
  const [items, setItems] = useState<LevelCheckItem[]>([])
  const [current, setCurrent] = useState<LevelCheckItem[]>([])
  const [answers, setAnswers] = useState<Map<string, boolean>>(new Map())
  const [ticked, setTicked] = useState<string[]>([])
  const [setNumber, setSetNumber] = useState(1)
  const [setDefault, setSetDefault] = useState(false)
  // Each step's heading takes focus so keyboard and screen-reader users start at its top.
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [step, setNumber])

  function start() {
    const first = firstLevelCheckSet()
    setItems(first)
    setCurrent(first)
    setAnswers(new Map())
    setTicked([])
    setSetNumber(1)
    setSetDefault(false)
    setStep('set')
  }

  // Unticked words count as unknown; the next set is tuned by every answer so far.
  function finishSet() {
    const next = new Map(answers)
    for (const item of current) next.set(item.word, ticked.includes(item.word))
    setAnswers(next)
    setTicked([])
    if (setNumber >= LEVEL_CHECK_SETS) {
      setStep('result')
      return
    }
    const following = nextLevelCheckSet(items, next)
    setItems([...items, ...following])
    setCurrent(following)
    setSetNumber(setNumber + 1)
  }

  if (step === 'intro') {
    return (
      <div className="level-check-page">
        <Heading as="h1" size="7" mb="3" ref={heading} tabIndex={-1} className="level-check-heading">
          Reading level check
        </Heading>
        <Text as="p" size="3" mb="3">
          You’ll see {LEVEL_CHECK_SETS} short sets of words. In each set, tick every word you know.
          Each set adjusts to your answers so far. It takes about a minute.
        </Text>
        <Text as="p" size="3" mb="3">
          Tick a word only if you could explain it or use it in a sentence. Some words are made up,
          so leave a word unticked when you aren’t sure. Guessing makes the result less accurate.
        </Text>
        <Text as="p" size="2" color="gray" mb="5">
          The result is an estimate for picking reading material, based on vocabulary only. It is not
          a certified CEFR result. Your answers stay on this device.
        </Text>
        <Flex wrap="wrap" gap="3">
          <Button size="3" onClick={start}>Start the check</Button>
          <Button size="3" variant="soft" color="gray" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Flex>
      </div>
    )
  }

  if (step === 'set') {
    return (
      <div className="level-check-page">
        <Heading as="h1" size="5" mb="3" ref={heading} tabIndex={-1} className="level-check-heading">
          Set {setNumber} of {LEVEL_CHECK_SETS}: which words do you know?
        </Heading>
        <Progress value={((setNumber - 1) / LEVEL_CHECK_SETS) * 100} mb="4" aria-hidden="true" />
        <Text as="p" id="level-check-instructions" size="2" color="gray" mb="3">
          Tick every word you could explain. Leave the rest unticked.
        </Text>
        <CheckboxCards.Root
          aria-labelledby="level-check-instructions"
          value={ticked}
          onValueChange={setTicked}
          columns={{ initial: '2', sm: '3' }}
          gap="2"
          size="2"
          lang="en"
        >
          {current.map((item) => (
            <CheckboxCards.Item key={item.word} value={item.word} className="level-check-word">
              {item.word}
            </CheckboxCards.Item>
          ))}
        </CheckboxCards.Root>
        <Flex justify="between" align="center" wrap="wrap" gap="3" mt="5">
          <Button size="3" onClick={finishSet}>
            {setNumber < LEVEL_CHECK_SETS ? 'Next set' : 'See my level'}
          </Button>
          <Button variant="ghost" color="gray" onClick={() => setStep('intro')}>
            Start over
          </Button>
        </Flex>
      </div>
    )
  }

  const result = scoreLevelCheck(items, answers)
  const passedA1 = result.bands[0].corrected >= PASS_THRESHOLD
  const firstMiss = result.bands.find((band) => band.corrected < PASS_THRESHOLD)

  function applyLevel() {
    const settings = loadSettings()
    if (setDefault) saveSettings({ ...settings, cefrLevel: result.suggested })
    setNewStoryDraftLevel(result.suggested, initialGenerationChoices(settings))
    navigate('/new')
  }

  return (
    <div className="level-check-page">
      <Heading as="h1" size="7" mb="3" ref={heading} tabIndex={-1} className="level-check-heading">
        Suggested level: {result.suggested}
      </Heading>
      <Text as="p" size="3" mb="4">
        {passedA1
          ? `You knew most words up to ${result.suggested}, so ${result.suggested} stories should feel comfortable.`
          : 'A1 is the easiest level, so it is the best place to start.'}
        {firstMiss && ` At ${firstMiss.level} you knew ${firstMiss.known} of ${firstMiss.total} words.`}
        {' '}If stories feel too easy or too hard, change the level any time.
      </Text>

      {result.guessingWarning && (
        <Callout.Root color="amber" mb="4">
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            You answered Yes to {result.pseudoClaimed} of {result.pseudoTotal} made-up words, so this
            estimate may be off. For a better result, take the check again and answer Yes only for words
            you could explain.
          </Callout.Text>
        </Callout.Root>
      )}

      <table className="level-check-table">
        <caption>Words you knew at each level</caption>
        <thead>
          <tr>
            <th scope="col">Level</th>
            <th scope="col">Known</th>
          </tr>
        </thead>
        <tbody>
          {result.bands.map((band) => (
            <tr key={band.level}>
              <th scope="row">{band.level}</th>
              <td>{band.known} of {band.total}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Made-up</th>
            <td>{result.pseudoClaimed} of {result.pseudoTotal} answered Yes</td>
          </tr>
        </tbody>
      </table>
      <Text as="p" size="1" color="gray" mt="2" mb="5">
        Scores are adjusted for made-up words answered Yes. This is an estimate from vocabulary only,
        not a certified CEFR result.
      </Text>

      <Text as="label" size="2" mb="4" className="level-check-default">
        <Checkbox checked={setDefault} onCheckedChange={(checked) => setSetDefault(checked === true)} />
        Also make {result.suggested} my default level in Settings
      </Text>
      <Flex wrap="wrap" gap="3">
        <Button size="3" onClick={applyLevel}>Use {result.suggested} for New Story</Button>
        <Button size="3" variant="soft" color="gray" onClick={start}>Take the check again</Button>
      </Flex>
    </div>
  )
}
