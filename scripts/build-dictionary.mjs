import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const wordnetRoot = path.dirname(require.resolve('wordnet/package.json'))
const dbDir = path.join(wordnetRoot, 'db')
const outDir = path.join(process.cwd(), 'public', 'dictionary')

const POS_FILES = [
  { index: 'index.noun', data: 'data.noun', pos: 'n' },
  { index: 'index.verb', data: 'data.verb', pos: 'v' },
  { index: 'index.adj', data: 'data.adj', pos: 'a' },
  { index: 'index.adv', data: 'data.adv', pos: 'r' },
]

function parseGloss(line) {
  const pipe = line.indexOf('|')
  if (pipe < 0) {
    return ''
  }
  return line
    .slice(pipe + 1)
    .trim()
    .split(';')[0]
    .trim()
    .replace(/^["']|["']$/g, '')
}

// Returns each synset's gloss and the lowercased words it spells with a capital, such
// as "banks" for the synset of Sir Joseph Banks.
function loadGlosses(filePath, pos) {
  const glosses = new Map()
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    if (!line || line.startsWith(' ')) {
      continue
    }
    const offset = Number.parseInt(line.slice(0, 8), 10)
    if (Number.isNaN(offset)) {
      continue
    }
    const gloss = parseGloss(line)
    if (gloss) {
      const parts = line.split(' ')
      const wordCount = Number.parseInt(parts[3], 16)
      const capitalized = new Set()
      for (let i = 0; i < wordCount; i++) {
        const word = parts[4 + 2 * i].replace(/\(.*\)$/, '')
        if (/\p{Lu}/u.test(word)) {
          capitalized.add(word.toLowerCase())
        }
      }
      glosses.set(`${pos}:${offset}`, { gloss, capitalized })
    }
  }
  return glosses
}

function parseIndexLine(line) {
  if (!line || line.startsWith(' ')) {
    return null
  }
  const parts = line.split(' ')
  const lemma = parts[0]
  const pos = parts[1]
  const synsetCount = Number.parseInt(parts[2], 10)
  const pointerCount = Number.parseInt(parts[3], 10)
  const synsetOffsets = parts.slice(6 + pointerCount, 6 + pointerCount + synsetCount).map(Number)
  const tagSenseCount = Number.parseInt(parts[5 + pointerCount], 10)
  if (!lemma || synsetOffsets.length === 0 || synsetOffsets.some(Number.isNaN)) {
    return null
  }
  return { lemma, pos, synsetOffsets, tagSenseCount: Number.isNaN(tagSenseCount) ? 0 : tagSenseCount }
}

const glossByOffset = new Map()
for (const file of POS_FILES) {
  const fileGlosses = loadGlosses(path.join(dbDir, file.data), file.pos)
  for (const [key, value] of fileGlosses) {
    glossByOffset.set(key, value)
  }
}

/** @type {Map<string, { gloss: string, score: number, name: boolean }>} */
const best = new Map()
// The most frequent sense that is not a name, for words whose best entry is one.
/** @type {Map<string, { gloss: string, score: number }>} */
const bestCommon = new Map()

for (const file of POS_FILES) {
  const text = fs.readFileSync(path.join(dbDir, file.index), 'utf8')
  for (const line of text.split('\n')) {
    const parsed = parseIndexLine(line)
    if (!parsed) {
      continue
    }
    const synsets = parsed.synsetOffsets.map((offset) => glossByOffset.get(`${parsed.pos}:${offset}`))
    const first = synsets[0]
    if (!first) {
      continue
    }
    const key = parsed.lemma.replace(/_/g, ' ').toLowerCase()
    const current = best.get(key)
    if (!current || parsed.tagSenseCount > current.score) {
      best.set(key, { gloss: first.gloss, score: parsed.tagSenseCount, name: first.capitalized.has(parsed.lemma) })
    }
    const common = synsets.find((synset) => synset && !synset.capitalized.has(parsed.lemma))
    const currentCommon = bestCommon.get(key)
    if (common && (!currentCommon || parsed.tagSenseCount > currentCommon.score)) {
      bestCommon.set(key, { gloss: common.gloss, score: parsed.tagSenseCount })
    }
  }
}

// A name's gloss is stored under the word with its first letter capitalized ("Banks"),
// so a lookup can pass over it for a word the reader met in lowercase.
function nameKey(word) {
  return word.replace(/\p{Ll}/u, (letter) => letter.toUpperCase())
}

/** @type {Map<string, Record<string, string>>} */
const shards = new Map()
function addEntry(word, key, gloss) {
  const first = word.charAt(0)
  const shard = /[a-z]/.test(first) ? first : '_'
  if (!shards.has(shard)) {
    shards.set(shard, {})
  }
  shards.get(shard)[key] = gloss
}

for (const [word, { gloss, name }] of best) {
  if (!name) {
    addEntry(word, word, gloss)
    continue
  }
  addEntry(word, nameKey(word), gloss)
  const common = bestCommon.get(word)
  if (common) {
    addEntry(word, word, common.gloss)
  }
}

fs.mkdirSync(outDir, { recursive: true })
for (const file of fs.readdirSync(outDir)) {
  if (file.endsWith('.json')) {
    fs.unlinkSync(path.join(outDir, file))
  }
}

let words = 0
for (const [shard, entries] of shards) {
  words += Object.keys(entries).length
  fs.writeFileSync(path.join(outDir, `${shard}.json`), JSON.stringify(entries))
}

console.log(`Wrote ${words} WordNet glosses into ${shards.size} files in ${path.relative(process.cwd(), outDir)}`)
