import type { Story } from '../types.ts'

/**
 * Reviewed starter stories, one per level from A1 to B2, that anyone can read without a Gemini key
 * (#27). The owner chose them from 32 Gemini drafts; each keeps the request that produced it, so Story
 * View's **How this story was made** card shows its provenance. Edits since generation: the closing
 * "THE END." line was removed, *The Whispering Books* writes plain "Thump." instead of Markdown
 * asterisks, and *My New Pen Pal* drops the `***` line between its two letters, since the reader shows
 * asterisks literally.
 *
 * They are listed in My Stories as an overlay, like the debug fixtures, until the reader changes one;
 * then a full copy is saved under the same id, so it is never duplicated.
 */
const starters: ReadonlyArray<Omit<Story, 'createdAt' | 'wordMarks' | 'explanations'>> = [
  {
    "id": "starter-a1",
    "title": "My New Friend",
    "level": "A1",
    "topic": "Our new puppy",
    "textType": "diary",
    "tone": "cozy",
    "variedSentences": false,
    "readingMinutes": 2,
    "generation": {
      "model": "gemini-3.1-flash-lite",
      "temperature": 0.7,
      "minWords": 160,
      "maxWords": 240,
      "systemPrompt": "You generate level-appropriate texts for extensive reading. Output only the title and the text.",
      "userPrompt": "Write a complete set of diary entries at CEFR A1 (very simple words and short sentences; present tense; everyday topics).\nText type: Diary entry — three to five dated entries by one person, following one situation over several days.\nTopic: Our new puppy\nTone: cozy.\nAim for 160-240 words, approximately 2 minutes of reading. Reading time varies by learner.\nStay within that vocabulary level so a learner can read for pleasure without looking many words up.\nInclude a title on the first line.\nUse dialogue only where it fits naturally.\nEnd with THE END.\nNo preamble, no notes, no word list — only the title and the text."
    },
    "body": "Monday, October 10\nToday is a big day. I have a new puppy! His name is Max. He is very small and soft. He has brown fur and big ears. Max is a little scared. He hides under the chair. I sit on the floor and wait. \"It is okay, Max,\" I say. He comes to me and licks my hand. I am very happy.\n\nTuesday, October 11\nMax is very busy today. He likes my blue socks. He runs with a sock in his mouth. He is very fast! We play in the garden. The sun is warm. Max jumps and barks. He is a happy puppy. Now, he is tired. He sleeps on my feet. He is a good boy.\n\nWednesday, October 12\nMax knows his name now. When I say, \"Max!\" he runs to me. We go for a walk in the park. Many people stop to look at him. \"He is so cute,\" they say. Max wags his tail. I give him a treat. He eats it fast. I love my little puppy. We are best friends."
  },
  {
    "id": "starter-a2",
    "title": "My New Pen Pal",
    "level": "A2",
    "topic": "Emails with a new pen pal",
    "textType": "letter",
    "variedSentences": false,
    "readingMinutes": 2,
    "generation": {
      "model": "gemini-3.1-flash-lite",
      "temperature": 0.7,
      "minWords": 160,
      "maxWords": 240,
      "systemPrompt": "You generate level-appropriate texts for extensive reading. Output only the title and the text.",
      "userPrompt": "Write a complete letter or exchange of letters at CEFR A2 (simple connected text; common vocabulary; basic past and future).\nText type: Letter or email — one letter or an exchange of letters or emails, each with a greeting, news or a request, and a sign-off.\nTopic: Emails with a new pen pal\nAim for 160-240 words, approximately 2 minutes of reading. Reading time varies by learner.\nStay within that vocabulary level so a learner can read for pleasure without looking many words up.\nInclude a title on the first line.\nUse dialogue only where it fits naturally.\nEnd with THE END.\nNo preamble, no notes, no word list — only the title and the text."
    },
    "body": "Dear Sam,\n\nMy name is Elena and I live in a small town in Italy. My teacher gave me your email address because we are both learning English. I am very happy to be your new pen pal!\n\nI am seventeen years old. I live with my parents and my younger brother, Marco. We have a big dog named Bruno. He likes to run in the garden every afternoon. In my free time, I love listening to music and cooking pasta. Last weekend, I made a delicious tomato sauce for my family.\n\nWhat about you? Where do you live? Do you have any brothers or sisters? Please tell me about your hobbies.\n\nNext summer, I want to visit London with my school. Have you ever been there? I am very excited about the trip, but I need to practice my English more. I hope we can write to each other often.\n\nI look forward to hearing from you soon!\n\nBest wishes,\n\nElena\n\nDear Elena,\n\nIt is great to meet you! My name is Sam and I live in Manchester, England. I am seventeen, too. I have a sister, but no pets.\n\nI like playing football and watching movies. Last week, I watched a great film with my friends. Next month, I will start a photography class. I think it will be fun!\n\nI live near London, so I go there sometimes. It is a very busy city, but there are many interesting things to see.\n\nI am happy to help you with your English. Let’s write every week!\n\nBest,\n\nSam"
  },
  {
    "id": "starter-b1",
    "title": "The Whispering Books",
    "level": "B1",
    "topic": "A ghost in the school library",
    "textType": "short-story",
    "tone": "tense",
    "variedSentences": true,
    "readingMinutes": 2,
    "generation": {
      "model": "gemini-3.1-flash-lite",
      "temperature": 0.7,
      "minWords": 160,
      "maxWords": 240,
      "systemPrompt": "You generate level-appropriate texts for extensive reading. Output only the title and the text.",
      "userPrompt": "Write a complete short story at CEFR B1 (clear standard language on familiar topics; some description and dialogue).\nText type: Short story — invented characters, one clear problem, and a satisfying ending.\nTopic: A ghost in the school library\nTone: tense.\nAim for 160-240 words, approximately 2 minutes of reading. Reading time varies by learner.\nStay within that vocabulary level so a learner can read for pleasure without looking many words up.\nVary sentence and paragraph length: mix short, punchy sentences with longer, flowing ones, and short paragraphs with longer ones, so the text has rhythm.\nInclude a title on the first line.\nFill the story with as much dialogue as possible.\nNo preamble, no notes, no word list — only the title and the text."
    },
    "body": "The school library was silent, except for the sound of rain against the windows. Leo sat alone at a wooden table, finishing his history project. Suddenly, a book fell from a high shelf. Thump.\n\nLeo froze. \"Who’s there?\" he whispered. \n\nNo answer. He stood up, his heart beating fast. He walked toward the back aisle, where the shadows were deep and cold. Another book slid off the shelf, landing right at his feet. It was an old, dusty diary. \n\n\"Is someone playing a joke?\" Leo asked, his voice shaking.\n\n\"Not a joke,\" a thin, hollow voice replied from the darkness.\n\nLeo jumped back. A faint, glowing mist hovered near the encyclopedias. \"What do you want?\"\n\n\"My story,\" the ghost sighed. \"It is unfinished. Please, read the last page.\"\n\nLeo’s hands trembled as he opened the diary. He read the final entry aloud. As the last word left his lips, the mist began to fade. The library felt warmer, and the heavy, tense atmosphere vanished instantly.\n\n\"Thank you,\" the voice whispered, sounding peaceful now.\n\nLeo stood in the silence for a long time. The library was finally just a library again. He picked up his bag and hurried toward the exit, never looking back."
  },
  {
    "id": "starter-b2",
    "title": "The Ghost in My Pocket",
    "level": "B2",
    "topic": "What my old phone taught me",
    "textType": "reflective",
    "tone": "thoughtful",
    "variedSentences": true,
    "readingMinutes": 2,
    "generation": {
      "model": "gemini-3.1-flash-lite",
      "temperature": 0.7,
      "minWords": 160,
      "maxWords": 240,
      "systemPrompt": "You generate level-appropriate texts for extensive reading. Output only the title and the text.",
      "userPrompt": "Write a complete reflective essay at CEFR B2 (fluent narrative with a wider vocabulary; natural dialogue; some nuance).\nText type: Reflective essay — personal thoughts and feelings about an experience, a place, or an idea, and how they changed.\nTopic: What my old phone taught me\nTone: thoughtful.\nAim for 160-240 words, approximately 2 minutes of reading. Reading time varies by learner.\nStay within that vocabulary level so a learner can read for pleasure without looking many words up.\nVary sentence and paragraph length: mix short, punchy sentences with longer, flowing ones, and short paragraphs with longer ones, so the text has rhythm.\nInclude a title on the first line.\nUse dialogue only where it fits naturally.\nNo preamble, no notes, no word list — only the title and the text."
    },
    "body": "For years, I carried a cracked, sluggish smartphone that seemed to have a personality of its own. It was a relic of a different era, its battery fading faster than the sunset. My friends often teased me about it. \"Seriously?\" they would ask, watching me struggle to open a simple map app. \"Isn't it time you joined the present?\"\n\nI always laughed it off, but deep down, I was stubborn. I clung to that device because it held the digital clutter of my past: blurry photos of trips long forgotten, half-finished drafts of ideas, and thousands of messages. \n\nWhen it finally died last month, the silence was deafening. I felt a strange, sudden panic. Without that constant stream of notifications, I was forced to look at the world around me. I noticed the way light hit the pavement during my morning commute and the cadence of conversations in the coffee shop. \n\nReplacing it with a sleek, modern model felt like an upgrade, yet I realized something profound. My old phone had taught me that I was using technology to hide from the present moment. I don’t miss the glitches or the slow loading times, but I am grateful for the lesson: we are more than the sum of our digital archives."
  }
]

export const STARTER_STORIES: readonly Story[] = starters.map((story) => ({
  ...story,
  createdAt: '2026-10-30T00:00:00.000Z',
  wordMarks: {},
  explanations: {},
}))

export function isStarterStory(id: string): boolean {
  return STARTER_STORIES.some((story) => story.id === id)
}
