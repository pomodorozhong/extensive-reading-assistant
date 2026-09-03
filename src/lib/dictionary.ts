const FUNCTION_WORDS: Record<string, string> = {
  a: 'The indefinite article; one, any, or each.',
  an: 'The indefinite article, used before a vowel sound.',
  the: 'The definite article; points to a specific person or thing.',
  and: 'Joins words or ideas together.',
  or: 'Shows a choice between two things.',
  but: 'Shows a contrast or exception.',
  of: 'Shows that something belongs to or is part of something else.',
  to: 'Shows direction, purpose, or the person who receives something.',
  in: 'Inside or during.',
  on: 'Touching a surface, or about a time or topic.',
  at: 'A point in space or time.',
  i: 'The person who is speaking.',
  you: 'The person being spoken to.',
  he: 'A male person already mentioned.',
  she: 'A female person already mentioned.',
  it: 'A thing or animal already mentioned.',
  we: 'The speaker and at least one other person.',
  they: 'People or things already mentioned.',
}

const IRREGULAR: Record<string, string> = {
  am: 'be',
  are: 'be',
  been: 'be',
  being: 'be',
  is: 'be',
  was: 'be',
  were: 'be',
  became: 'become',
  came: 'come',
  did: 'do',
  does: 'do',
  done: 'do',
  felt: 'feel',
  found: 'find',
  gave: 'give',
  given: 'give',
  gone: 'go',
  got: 'get',
  had: 'have',
  has: 'have',
  knew: 'know',
  known: 'know',
  left: 'leave',
  made: 'make',
  ran: 'run',
  said: 'say',
  sat: 'sit',
  saw: 'see',
  seen: 'see',
  took: 'take',
  taken: 'take',
  thought: 'think',
  told: 'tell',
  went: 'go',
}

const shardCache = new Map<string, Record<string, string>>()
const shardPromises = new Map<string, Promise<Record<string, string>>>()

function shardName(word: string): string {
  const first = word.charAt(0)
  return /[a-z]/.test(first) ? first : '_'
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

export function dictionaryForms(word: string): string[] {
  const normalized = word.toLowerCase().replace(/’/g, "'")
  const forms: string[] = []

  if (IRREGULAR[normalized]) {
    forms.push(IRREGULAR[normalized])
  }

  forms.push(normalized)

  if (normalized.endsWith("'s") && normalized.length > 3) {
    forms.push(normalized.slice(0, -2))
  }

  if (normalized.endsWith('ies') && normalized.length > 4) {
    forms.push(`${normalized.slice(0, -3)}y`)
  }

  if (normalized.endsWith('es') && normalized.length > 3) {
    forms.push(normalized.slice(0, -2))
  }

  if (normalized.endsWith('s') && !normalized.endsWith('ss') && normalized.length > 2) {
    forms.push(normalized.slice(0, -1))
  }

  if (normalized.endsWith('ing') && normalized.length > 5) {
    const stem = normalized.slice(0, -3)
    forms.push(stem, `${stem}e`)
    if (stem.length > 1 && stem.at(-1) === stem.at(-2)) {
      forms.push(stem.slice(0, -1))
    }
  }

  if (normalized.endsWith('ed') && normalized.length > 4) {
    const stem = normalized.slice(0, -2)
    forms.push(stem, `${stem}e`, normalized.slice(0, -1))
    if (stem.length > 1 && stem.at(-1) === stem.at(-2)) {
      forms.push(stem.slice(0, -1))
    }
  }

  return unique(forms.filter(Boolean))
}

async function loadShard(name: string): Promise<Record<string, string>> {
  const cached = shardCache.get(name)
  if (cached) {
    return cached
  }

  const pending = shardPromises.get(name)
  if (pending) {
    return pending
  }

  const request = fetch(`${import.meta.env.BASE_URL}dictionary/${name}.json`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Dictionary data could not be loaded (${response.status}).`)
      }
      const data = (await response.json()) as Record<string, string>
      shardCache.set(name, data)
      shardPromises.delete(name)
      return data
    })
    .catch((error: unknown) => {
      shardPromises.delete(name)
      throw error
    })

  shardPromises.set(name, request)
  return request
}

export type DictionaryResult =
  | { ok: true; text: string }
  | { ok: false; message: string }

export async function lookupDefinition(word: string): Promise<DictionaryResult> {
  const forms = dictionaryForms(word)

  for (const form of forms) {
    if (FUNCTION_WORDS[form]) {
      return { ok: true, text: FUNCTION_WORDS[form] }
    }
  }

  try {
    for (const form of forms) {
      const shard = await loadShard(shardName(form))
      const gloss = shard[form]
      if (gloss) {
        return { ok: true, text: gloss }
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Dictionary data could not be loaded.'
    return { ok: false, message }
  }

  return { ok: false, message: 'No dictionary entry for this word.' }
}
