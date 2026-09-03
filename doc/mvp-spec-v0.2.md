# Extensive Reading Assistant MVP Specification v0.2

Generate level-appropriate stories and let learners mark words as known or unknown while they read.

## In scope

- Set vocabulary level using CEFR (A1, A2, B1, B2, C1, C2)
- Generate stories matched to that level
- Mark words in a story as known or unknown

## Out of scope

- In-app test to determine vocabulary level
- Flashcards or other review of marked words

## User stories

- As a learner, I set my CEFR level so generated stories stay within my vocabulary.
- As a learner, I generate a new story at my level so I can read for pleasure without constantly looking words up.
- As a learner, I mark words as known or unknown while reading so I can notice what I still need.
- As a learner, I open a previously generated story so I can re-read it.
- As a learner, I change my level in Settings so later stories match my current ability.

## Features

| Feature | Where | Behavior |
| --- | --- | --- |
| Vocabulary level | Settings | Choose one CEFR band (A1–C2). This is the source of truth for generation. |
| New story | New Story | Generate a story constrained to the current level. |
| Word marking | Story View | Mark any word as known or unknown. Marks persist on that story. |
| Story library | My Stories | List saved stories and open one in Story View. |

## Sitemap

```mermaid
treeView-beta
Home/
    New Story
        Story View
    My Stories/
    Settings
```

- **Home** — entry to New Story, My Stories, and Settings
- **New Story** — generate a story, then open it in Story View
- **Story View** — read the story and mark words
- **My Stories** — saved stories; each item opens Story View
- **Settings** — vocabulary level
