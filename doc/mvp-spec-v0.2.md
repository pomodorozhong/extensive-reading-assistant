# Extensive Reading Assistant MVP Specification v0.2

Generate level-appropriate stories and let learners mark words as known or unknown while they read.

## In scope

- Set vocabulary level using CEFR (A1, A2, B1, B2, C1, C2)
- Generate stories matched to that level
- Mark words in a story as known or unknown

## Out of scope

- Flashcards or review scheduling for marked words

## User stories

- As a learner, I set my CEFR level so generated stories stay within my vocabulary.
- As a learner, I generate a new story at my level so I can read for pleasure without constantly looking words up.
- As a learner, I mark words as known or unknown while reading so I can notice what I still need.
- As a learner, I open a previously generated story so I can re-read it.
- As a learner, I change my level in Settings so later stories match my current ability.

## Features

| Feature | Where | Behavior |
| --- | --- | --- |
| Vocabulary level | Settings and New Story | A2 by default. A saved Settings preference supplies the initial CEFR band (A1–C2); the New Story selection applies to that story. |
| New story | New Story | Generate with the selected level, optional topic, text type (a mode, then a form offered at that level), reading length, supported model, and optional tone and point of view. Topic examples fill the form without submitting. |
| Word marking | Story View | Mark any word as known or unknown. Marks persist on that story. |
| Story library | My Stories | List saved stories and open one in Story View. |
| Reading level check | Level check | An approximate, offline word-recognition check that suggests a CEFR level for New Story and, optionally, Settings. It is an estimate, not a certified result. |
| Introduction | First use and Settings | A six-step introduction to the reading workflow, shown once to new readers and available again from Settings. |
| Unknown-word collection | Vocabulary | Collect unknown words across stories, grouped by approximate CEFR level, with saved definitions, sentences, and links back to each occurrence. |

Reading length is an advisory 5, 10, or 15 minutes, initially 10 minutes, with prompt targets of 400–600, 800–1,200, and 1,200–1,800 words respectively. Reading time varies by learner. New stories record their requested reading minutes; older stories remain readable without this optional metadata. Form choices apply per story and do not overwrite Settings defaults.

## Sitemap

```mermaid
treeView-beta
App/
    New Story/
        Story View
    Level check/
    My Stories/
    Vocabulary/
    Settings/
```

- **Landing route (`/`)** — redirects to the canonical New Story route (`/new`)
- **New Story** — choose a level, optional topic, text type, reading length, supported model, and style, then generate and open a story in Story View
- **Level check (`/level-check`)** — estimate a reading level from word recognition, then apply it to New Story
- **Story View** — read the story and mark words
- **My Stories** — saved stories; each item opens Story View
- **Vocabulary** — review unknown words and return to their source stories
- **Settings** — saved vocabulary-level preference, Gemini access, app installation, and debugging options
