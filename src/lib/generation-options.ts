import {
  CEFR_LEVELS,
  TEXT_TYPES,
  type CefrLevel,
  type PointOfView,
  type ReadingMinutes,
  type Settings,
  type TextMode,
  type TextType,
  type Tone,
} from '../types.ts'

// Story genres such as mystery or sci-fi live here as topics, so any text type can use them.
export const TOPIC_EXAMPLES = [
  'A rainy afternoon at a bookshop',
  'A weekend in Tokyo',
  'A mystery about a missing cat',
  'A robot learns to cook',
  'A ghost in the school library',
] as const

export const MAX_TOPIC_LENGTH = 120

export const TEXT_MODE_LABELS: Record<TextMode, string> = {
  stories: 'Stories',
  'real-life': 'Real life',
  ideas: 'Ideas',
  practical: 'Practical',
}

type TextTypeInfo = {
  label: string
  mode: TextMode
  /** One line shown to the reader. */
  description: string
  /** What the prompt asks for, as in "Write a complete fable". */
  noun: string
  /** Added to the prompt to shape the text. */
  guide: string
  examples: readonly string[]
  /** The lowest and highest levels the text type is offered at. */
  levels: readonly [CefrLevel, CefrLevel]
  /** How much dialogue to ask for; null when the guide already says. */
  dialogue: 'plenty' | 'some' | null
  /** The form's own point of view; 'none' when it has no narrator, as in instructions. */
  fixedPointOfView?: PointOfView | 'none'
  /** About real things, so facts must be accurate. */
  factual?: boolean
}

// Every mode offers at least one type at every level; forms that need nuance start at B1.
export const TEXT_TYPE_INFO: Record<TextType, TextTypeInfo> = {
  'short-story': {
    label: 'Short story',
    mode: 'stories',
    description: 'Characters, a problem, and an ending',
    noun: 'short story',
    guide: 'invented characters, one clear problem, and a satisfying ending',
    examples: ['A mystery about a missing cat', 'A robot learns to cook', 'The last train home'],
    levels: ['A1', 'C2'],
    dialogue: 'plenty',
  },
  'fairy-tale': {
    label: 'Fairy tale',
    mode: 'stories',
    description: 'Once upon a time, a happy ending',
    noun: 'fairy tale',
    guide: 'the shape of a classic fairy tale, clear good and bad characters, and a happy ending',
    examples: ['The princess who loved maps', 'A wish under the old tree', 'The tailor and the giant'],
    levels: ['A1', 'B2'],
    dialogue: 'plenty',
  },
  fable: {
    label: 'Fable',
    mode: 'stories',
    description: 'A short tale with a lesson',
    noun: 'fable',
    guide: 'animals or simple characters, a short plot, and a clear lesson stated at the end',
    examples: ['The fox and the clever bird', 'The patient farmer', 'Why the moon is shy'],
    levels: ['A1', 'B2'],
    dialogue: 'plenty',
  },
  myth: {
    label: 'Myth or legend',
    mode: 'stories',
    description: 'Heroes and how things began',
    noun: 'myth or legend',
    guide: 'the style of an old myth or legend, with heroes, wonder, and how something came to be',
    examples: ['How the river got its name', 'The hero who could not lie', 'The island that moves'],
    levels: ['A2', 'C2'],
    dialogue: 'plenty',
  },
  'play-script': {
    label: 'Play script',
    mode: 'stories',
    description: 'A scene told in dialogue',
    noun: 'play script',
    guide:
      "a cast list, then lines that each start with the speaker's name and a colon, with short stage directions in brackets",
    examples: ['Two friends lost in a museum', 'The wrong order at a café', 'A very strange job interview'],
    levels: ['A2', 'C2'],
    dialogue: null,
  },
  'personal-narrative': {
    label: 'Personal narrative',
    mode: 'real-life',
    description: 'One event from your life, told as "I"',
    noun: 'personal narrative',
    guide: "one memorable event from the narrator's life, told in order, with what they felt and learned",
    examples: ['My first day at a new school', 'The day I got lost', 'Learning to ride a bike'],
    levels: ['A1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'first',
  },
  diary: {
    label: 'Diary entry',
    mode: 'real-life',
    description: 'A few days of a life, with dates',
    noun: 'set of diary entries',
    guide: 'three to five dated entries by one person, following one situation over several days',
    examples: ['A week at summer camp', 'Our new puppy', 'Moving to a new city'],
    levels: ['A1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'first',
  },
  'news-report': {
    label: 'News report',
    mode: 'real-life',
    description: 'What happened, where, and who saw it',
    noun: 'news report',
    guide: 'an invented everyday local event, the key facts first, then details and a quote from a witness; no real people',
    examples: ['A lost cat comes home after a year', 'The town opens a new library', 'A school wins a robot contest'],
    levels: ['A2', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'third',
  },
  biography: {
    label: 'Biography',
    mode: 'real-life',
    description: "Key moments in a real person's life",
    noun: 'short biography',
    guide: 'key moments from the life of a real, well-known person, in time order',
    examples: ['Marie Curie', 'The Wright brothers', 'Ludwig van Beethoven'],
    levels: ['B1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'third',
    factual: true,
  },
  descriptive: {
    label: 'Description',
    mode: 'ideas',
    description: 'A place or person, through the senses',
    noun: 'descriptive piece',
    guide: 'a vivid picture of one place, person, or scene through sight, sound, smell, taste, and touch, with little plot',
    examples: ['A busy market in the morning', "My grandmother's kitchen", 'A beach after a storm'],
    levels: ['A1', 'C2'],
    dialogue: 'some',
  },
  expository: {
    label: 'Explanation',
    mode: 'ideas',
    description: 'How or why something works',
    noun: 'explanatory article',
    guide: 'an informative article that explains how or why something works, in clear steps with everyday examples',
    examples: ['How coffee travels to your cup', 'Why cats purr', 'How a bicycle works'],
    levels: ['A2', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'none',
    factual: true,
  },
  reflective: {
    label: 'Reflective essay',
    mode: 'ideas',
    description: 'Thoughts and feelings about an experience',
    noun: 'reflective essay',
    guide: 'personal thoughts and feelings about an experience, a place, or an idea, and how they changed',
    examples: ['What my old phone taught me', 'Why I love rainy days', 'Saying goodbye to a friend'],
    levels: ['B1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'first',
  },
  argumentative: {
    label: 'Opinion essay',
    mode: 'ideas',
    description: 'One view, with reasons and the other side',
    noun: 'argumentative essay',
    guide: 'a clear position, two or three reasons with examples, one opposing view answered, and a conclusion',
    examples: ['Should homework be banned?', 'Cities should be car-free', 'Is it better to live in the country?'],
    levels: ['B1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'none',
  },
  letter: {
    label: 'Letter or email',
    mode: 'practical',
    description: 'To a friend, family, or a company',
    noun: 'letter or exchange of letters',
    guide: 'one letter or an exchange of letters or emails, each with a greeting, news or a request, and a sign-off',
    examples: ['A thank-you letter to a teacher', 'Emails with a new pen pal', 'A complaint about a late package'],
    levels: ['A1', 'C2'],
    dialogue: 'some',
    fixedPointOfView: 'first',
  },
  notice: {
    label: 'Notice or invitation',
    mode: 'practical',
    description: 'An event: what, when, and where',
    noun: 'set of notices and invitations',
    guide: 'related notices, invitations, and short replies about one event, each saying what, when, and where',
    examples: ['A neighborhood party', 'The school sports day', 'The library is moving'],
    levels: ['A1', 'C2'],
    dialogue: null,
    fixedPointOfView: 'none',
  },
  instructions: {
    label: 'Instructions',
    mode: 'practical',
    description: 'Steps to make or do something',
    noun: 'set of instructions',
    guide: 'a short introduction, a list of things you need, numbered steps with tips, and what to do if something goes wrong',
    examples: ['How to make pancakes', 'How to grow tomatoes', 'How to look after a lost cat'],
    levels: ['A1', 'C2'],
    dialogue: null,
    fixedPointOfView: 'none',
  },
}

/** Whether the text type is offered at the level. */
export function textTypeFitsLevel(textType: TextType, level: CefrLevel): boolean {
  const [lowest, highest] = TEXT_TYPE_INFO[textType].levels
  const index = CEFR_LEVELS.indexOf(level)
  return CEFR_LEVELS.indexOf(lowest) <= index && index <= CEFR_LEVELS.indexOf(highest)
}

/** The mode's text types offered at the level, in display order. */
export function textTypesForLevel(mode: TextMode, level: CefrLevel): TextType[] {
  return TEXT_TYPES.filter((textType) => TEXT_TYPE_INFO[textType].mode === mode && textTypeFitsLevel(textType, level))
}

/** The level range as shown to the reader, such as "B1–C2". */
export function textTypeLevelRange(textType: TextType): string {
  const [lowest, highest] = TEXT_TYPE_INFO[textType].levels
  return `${lowest}–${highest}`
}

/** The mode's text types that a higher level unlocks, for telling the reader what is ahead. */
export function lockedTextTypes(mode: TextMode, level: CefrLevel): TextType[] {
  const index = CEFR_LEVELS.indexOf(level)
  return TEXT_TYPES.filter(
    (textType) =>
      TEXT_TYPE_INFO[textType].mode === mode &&
      CEFR_LEVELS.indexOf(TEXT_TYPE_INFO[textType].levels[0]) > index,
  )
}

/** A known text type offered at the level, or null. */
export function cleanTextType(value: unknown, level: CefrLevel): TextType | null {
  return (TEXT_TYPES as readonly unknown[]).includes(value) && textTypeFitsLevel(value as TextType, level)
    ? (value as TextType)
    : null
}

/** Whether the reader's point of view applies, or the text type sets its own. */
export function allowsPointOfView(textType: TextType | null): boolean {
  return !textType || !TEXT_TYPE_INFO[textType].fixedPointOfView
}

export const TONE_LABELS: Record<Tone, string> = {
  cozy: 'Cozy',
  tense: 'Tense',
  funny: 'Funny',
  thoughtful: 'Thoughtful',
}

export const POINT_OF_VIEW_LABELS: Record<PointOfView, string> = {
  first: 'First person',
  third: 'Third person',
}

/** Topic suggestions for the chosen text type, or the general examples when none is chosen. */
export function topicExamples(textType: TextType | null): readonly string[] {
  return textType ? TEXT_TYPE_INFO[textType].examples : TOPIC_EXAMPLES
}

export const SUPPORTED_MODELS = [
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
] as const

export type GenerationModel = (typeof SUPPORTED_MODELS)[number]['id']
export const DEFAULT_MODEL = SUPPORTED_MODELS[0].id
export const DEFAULT_GENERATION_LEVEL: CefrLevel = 'A2'
export const DEFAULT_READING_MINUTES: ReadingMinutes = 10

// Product targets for a reading session, not measured or guaranteed reading times.
export const READING_LENGTHS: Record<ReadingMinutes, { minWords: number; maxWords: number }> = {
  5: { minWords: 400, maxWords: 600 },
  10: { minWords: 800, maxWords: 1200 },
  15: { minWords: 1200, maxWords: 1800 },
}

export const READING_MINUTE_OPTIONS = [5, 10, 15] as const satisfies readonly ReadingMinutes[]

export type GenerationChoices = {
  level: CefrLevel
  topic: string
  /** null leaves the text type to the model, which usually writes a story. */
  textType: TextType | null
  /** null leaves the tone to the model. */
  tone: Tone | null
  /** null leaves the point of view to the model. */
  pointOfView: PointOfView | null
  readingMinutes: ReadingMinutes
  model: GenerationModel
}

export function initialGenerationChoices(settings: Pick<Settings, 'cefrLevel' | 'model'>): GenerationChoices {
  const savedModel = settings.model.trim().replace(/^models\//, '')
  return {
    level: settings.cefrLevel,
    topic: '',
    textType: null,
    tone: null,
    pointOfView: null,
    readingMinutes: DEFAULT_READING_MINUTES,
    model: SUPPORTED_MODELS.find((model) => model.id === savedModel)?.id ?? DEFAULT_MODEL,
  }
}

// Made-up words are hardest on beginners, who look up the most words.
const PLAIN_INVENTION_LEVELS: readonly CefrLevel[] = ['A1', 'A2']

/** Whether imaginative writing at a beginner level must avoid made-up words. */
export function usesPlainWordsForInventions(choices: Pick<GenerationChoices, 'level' | 'textType'>): boolean {
  return (
    PLAIN_INVENTION_LEVELS.includes(choices.level) &&
    (!choices.textType || TEXT_TYPE_INFO[choices.textType].mode === 'stories')
  )
}

/** Short notes that explain how the current choices shape the text. */
export function generationNotes(
  choices: Pick<GenerationChoices, 'level' | 'textType' | 'pointOfView'>,
): string[] {
  const notes: string[] = []
  // The rule also applies with no text type chosen, but a note on the untouched form would be noise.
  if (choices.textType && usesPlainWordsForInventions(choices)) {
    notes.push(`At ${choices.level}, made-up words are left out, so every word can still be looked up.`)
  }
  if (choices.textType && TEXT_TYPE_INFO[choices.textType].factual) {
    notes.push('Topic words are explained in the text the first time they appear.')
  }
  if (choices.level === 'A1' && choices.pointOfView === 'third' && allowsPointOfView(choices.textType)) {
    notes.push('First person is often easier to follow at A1.')
  }
  return notes
}
