import { readFileSync, writeFileSync } from 'node:fs'

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const vocabulary = Object.create(null)
// These source files have no multiline fields. Preserve quoted commas and escaped quotes.
function fields(line) {
  return [...line.matchAll(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)]
    .map((match) => match[1].replace(/^"|"$/g, '').replaceAll('""', '"'))
}
for (const filename of ['cefrj-vocabulary-profile-1.5.csv', 'octanove-vocabulary-profile-c1c2-1.0.csv']) {
  const lines = readFileSync(new URL(`../data/cefr/${filename}`, import.meta.url), 'utf8').trim().split(/\r?\n/)
  for (const line of lines.slice(1)) {
    const [headword, , level] = fields(line)
    if (!levels.includes(level)) throw new Error(`Invalid CEFR level: ${line}`)
    for (const variant of headword.toLowerCase().replaceAll('’', "'").split('/')) {
      const word = variant.trim()
      // Keep lexical entries, including phrases; the first version matches individual words only.
      if (!word) continue
      if (!vocabulary[word] || levels.indexOf(level) < levels.indexOf(vocabulary[word])) {
        vocabulary[word] = level
      }
    }
  }
}
const sorted = Object.fromEntries(Object.entries(vocabulary).sort(([a], [b]) => a.localeCompare(b, 'en')))
writeFileSync(new URL('../src/data/cefr.json', import.meta.url), `${JSON.stringify(sorted, null, 2)}\n`)
console.log(`Bundled ${Object.keys(sorted).length} CEFR entries`)
