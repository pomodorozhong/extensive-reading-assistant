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
      glosses.set(`${pos}:${offset}`, gloss)
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
  const pointerCount = Number.parseInt(parts[3], 10)
  const synsetOffset = Number.parseInt(parts[6 + pointerCount], 10)
  const tagSenseCount = Number.parseInt(parts[5 + pointerCount], 10)
  if (!lemma || Number.isNaN(synsetOffset)) {
    return null
  }
  return { lemma, pos, synsetOffset, tagSenseCount: Number.isNaN(tagSenseCount) ? 0 : tagSenseCount }
}

const glossByOffset = new Map()
for (const file of POS_FILES) {
  const fileGlosses = loadGlosses(path.join(dbDir, file.data), file.pos)
  for (const [key, value] of fileGlosses) {
    glossByOffset.set(key, value)
  }
}

/** @type {Map<string, { gloss: string, score: number }>} */
const best = new Map()

for (const file of POS_FILES) {
  const text = fs.readFileSync(path.join(dbDir, file.index), 'utf8')
  for (const line of text.split('\n')) {
    const parsed = parseIndexLine(line)
    if (!parsed) {
      continue
    }
    const gloss = glossByOffset.get(`${parsed.pos}:${parsed.synsetOffset}`)
    if (!gloss) {
      continue
    }
    const key = parsed.lemma.replace(/_/g, ' ').toLowerCase()
    const current = best.get(key)
    if (!current || parsed.tagSenseCount > current.score) {
      best.set(key, { gloss, score: parsed.tagSenseCount })
    }
  }
}

/** @type {Map<string, Record<string, string>>} */
const shards = new Map()
for (const [word, { gloss }] of best) {
  const first = word.charAt(0)
  const shard = /[a-z]/.test(first) ? first : '_'
  if (!shards.has(shard)) {
    shards.set(shard, {})
  }
  shards.get(shard)[word] = gloss
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
