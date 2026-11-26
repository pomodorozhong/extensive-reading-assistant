export type WordToken = {
  type: 'word'
  value: string
  key: string
}

export type OtherToken = {
  type: 'other'
  value: string
}

export type Token = WordToken | OtherToken

export function normalizeWord(value: string): string {
  return value.toLowerCase()
}

export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  const wordPattern = /(\p{L}+(?:['’]\p{L}+)*)/gu
  let lastIndex = 0

  for (const match of text.matchAll(wordPattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      tokens.push({ type: 'other', value: text.slice(lastIndex, index) })
    }
    const value = match[0]
    tokens.push({ type: 'word', value, key: normalizeWord(value) })
    lastIndex = index + value.length
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'other', value: text.slice(lastIndex) })
  }

  return tokens
}

// A line of only three or more `*`, `-`, or `_` (spaces allowed between), the Markdown way to break
// sections, as Gemini writes between letters or scenes. Blank lines before it belong to the break, and
// the lookahead leaves the line end after it for the next break or part.
const SECTION_BREAK = /\n+[ \t]*([*_-])(?:[ \t]*\1){2,}[ \t]*(?=\n)/u

/**
 * Split the text between two words at its section-break lines, for Story View to draw each break as a
 * divider instead of literal asterisks. A break line has no letters, so it always falls inside one
 * non-word token, and word tokens and their indexes stay as they are. A token's edges are line edges
 * only at the start and end of the story, which `atStart` and `atEnd` say. One part means no break.
 */
export function splitSectionBreaks(text: string, atStart = false, atEnd = false): string[] {
  const padded = `${atStart ? '\n' : ''}${text}${atEnd ? '\n' : ''}`
  const parts = padded
    .split(new RegExp(SECTION_BREAK, 'gu'))
    .filter((_, index) => index % 2 === 0)
    // Blank lines after a break belong to it too.
    .map((part, index) => (index > 0 ? part.replace(/^\n+/u, '') : part))
  if (atStart) parts[0] = parts[0].replace(/^\n/u, '')
  if (atEnd) parts[parts.length - 1] = parts[parts.length - 1].replace(/\n$/u, '')
  return parts
}
