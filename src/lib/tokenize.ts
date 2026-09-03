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

export function nextMark(current: 'known' | 'unknown' | undefined): 'known' | 'unknown' | undefined {
  if (!current) {
    return 'unknown'
  }
  if (current === 'unknown') {
    return 'known'
  }
  return undefined
}
