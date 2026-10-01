import type { Story } from '../types.ts'
import { normalizeWord, tokenize } from './tokenize.ts'

export type VocabularySource = {
  storyId: string
  title: string
  sentence: string
  tokenIndex: number | null
  definition: string | null
}

export type VocabularyWord = {
  key: string
  word: string
  sources: VocabularySource[]
}

/** Keep snapshots from removed stories; refresh marks and context for present stories. */
export function reconcileVocabulary(saved: VocabularyWord[], stories: Story[]): VocabularyWord[] {
  const storyIds = new Set(stories.map((story) => story.id))
  const words = new Map<string, VocabularyWord>()
  for (const entry of saved) {
    const sources = entry.sources.filter((source) => !storyIds.has(source.storyId))
    if (sources.length) words.set(entry.key, { ...entry, sources })
  }

  for (const story of stories) {
    const tokens = tokenize(story.body)
    const marks = new Map(Object.entries(story.wordMarks).map(([key, mark]) => [normalizeWord(key), mark]))
    const definitions = new Map(Object.entries(story.explanations).map(([key, text]) => [normalizeWord(key), text]))
    const seen = new Set<string>()
    let offset = 0
    tokens.forEach((token, tokenIndex) => {
      const start = offset
      offset += token.value.length
      if (token.type !== 'word' || marks.get(token.key) !== 'unknown' || seen.has(token.key)) return
      seen.add(token.key)
      const source: VocabularySource = {
        storyId: story.id,
        title: story.title,
        sentence: sourceSentence(story.body, start, offset),
        tokenIndex,
        definition: definitions.get(token.key)?.trim() || null,
      }
      const entry = words.get(token.key)
      if (entry) entry.sources.push(source)
      else words.set(token.key, { key: token.key, word: token.value, sources: [source] })
    })
    // Legacy marks may outlive edits to story text. Retain these words too.
    for (const [key, mark] of marks) {
      if (mark !== 'unknown' || seen.has(key)) continue
      const source: VocabularySource = {
        storyId: story.id, title: story.title, sentence: '', tokenIndex: null,
        definition: definitions.get(key)?.trim() || null,
      }
      const entry = words.get(key)
      if (entry) entry.sources.push(source)
      else words.set(key, { key, word: key, sources: [source] })
    }
  }
  return [...words.values()].sort((a, b) => a.key.localeCompare(b.key))
}

function sourceSentence(body: string, start: number, end: number): string {
  const before = body.slice(0, start)
  const boundary = Math.max(before.lastIndexOf('.'), before.lastIndexOf('!'), before.lastIndexOf('?'), before.lastIndexOf('\n'))
  const after = body.slice(end).search(/[.!?\n]/u)
  return body.slice(boundary + 1, after < 0 ? body.length : end + after + 1).trim()
}

export function vocabularySourcePath(source: VocabularySource): string {
  const storyPath = `/stories/${encodeURIComponent(source.storyId)}`
  return source.tokenIndex === null ? storyPath : `${storyPath}?word=${source.tokenIndex}`
}
