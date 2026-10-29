// Local verification fixture only. Never forwards requests or accepts real keys.
import { createServer } from 'node:http'

const port = 5175
const fixtureKey = 'era-local-fixture'
const server = createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-goog-api-key')
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.setHeader('Content-Type', 'application/json')
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }
  if (request.method !== 'POST' || request.url !== '/v1beta/models/gemini-3.1-flash-lite:generateContent') {
    response.writeHead(404).end(JSON.stringify({ error: { message: 'Unknown fixture request' } }))
    return
  }
  if (request.headers['x-goog-api-key'] !== fixtureKey) {
    response.writeHead(403).end(JSON.stringify({ error: { message: 'Use the synthetic era-local-fixture key for this local test.' } }))
    return
  }
  try {
    let body = ''
    for await (const chunk of request) body += chunk
    const prompt = JSON.parse(body).contents[0].parts[0].text
    const level = prompt.match(/CEFR (A1|A2|B1|B2|C1|C2)/)?.[1]
    const length = prompt.match(/Aim for (\d+)-(\d+) words, approximately (5|10|15) minutes/)
    const topic = prompt.match(/^Topic: (.+)$/m)?.[1] ?? 'an original topic'
    const textType = prompt.match(/^Text type: ([^—]+) —/m)?.[1]?.trim() ?? 'any text type'
    const tone = prompt.match(/^Tone: (\w+)\./m)?.[1] ?? 'any tone'
    const pointOfView = prompt.match(/^Tell it in the (first|third) person/m)?.[1] ?? 'any'
    if (!level || !length) throw new Error('Missing generation choices')
    const text = `Title: Generation options fixture\n\nThis local fixture received CEFR ${level}, ${length[3]} minutes, and a target of ${length[1]}-${length[2]} words.\n\nThe topic is ${topic}. The text type is ${textType}, the tone is ${tone}, and the point of view is ${pointOfView}. A friend visits a garden.\n\nTHE END.`
    response.end(JSON.stringify({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }))
  } catch {
    response.writeHead(400).end(JSON.stringify({ error: { message: 'The fixture could not read the generation choices.' } }))
  }
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Local Gemini fixture: http://127.0.0.1:${port}/v1beta (synthetic key: ${fixtureKey})`)
})
