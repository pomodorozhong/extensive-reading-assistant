# Handoff

Last verified: 2026-10-29 (Asia/Taipei).

## In progress

### feat/story-text-type

- Task: text types, a topic field, and style options on New Story, so #27's starter stories can cover each text type. No issue yet, so the branch is not linked to one. See P-22.
- PR: none yet.
- Code checkpoint: `945bb65` on `main` `45e22a4`.
- State: committed and pushed; awaiting an issue (P-22) and a PR.
- Design: 16 forms in 4 modes (Stories, Real life, Ideas, Practical), each with a level range in `src/lib/generation-options.ts`; picked in two steps (mode, then form). Story genres such as mystery became topic examples. Forms with their own point of view turn off the point-of-view control. Stories and drafts with the old `theme` field load it as the topic.
- Verification: 2026-10-29, `npx oxlint`, `npm run build`, and all six `test:*` suites passed (101 tests). In the dev preview with the Gemini fixture, a News report at A2 generated with the right text type and no point of view; switching B1 to A2 cleared Opinion essay with a note; at 375px the mode bar fits with no horizontal scroll.
- Not checked: output quality with real Gemini, especially notices and instructions at 10–15 minutes and play scripts.
- Next action: file the issue from P-22, link this branch to it, then open a PR with the `open-pr` skill.
- Pending: **P-22** — file this issue. Why: creating an issue is outward-facing. Blocks: linking the branch and the PR.
  - Title: Let readers choose a text type, topic, and style for new stories
  - Body: New Story has a free-text theme and nothing else to shape the text. Add a topic field (renamed from theme, migrating saved data), a text type picked as a mode then a form (Stories: short story, fairy tale, fable, myth, play script; Real life: personal narrative, diary entry, news report, biography; Ideas: description, explanation, reflective essay, opinion essay; Practical: letter or email, notice or invitation, instructions), each bound to a CEFR level range, and collapsed style options for tone and point of view. Each form shapes the prompt. This lets #27's curated starter stories cover each text type.

## Ranked work

1. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — lets a new reader try the app without a key; needs starter content the owner reviews (Claude can draft one story per level). `feat/story-text-type` adds the text types the starter stories can cover.
2. [#56 — Add browser-local backup and restore with clear device and offline status](https://github.com/pomodorozhong/extensive-reading-assistant/issues/56) — all data lives only in `localStorage`; unblocks story deletion (#28) and the storage move (#60).
3. [#57 — Resume unfinished stories and offer an explicit completion flow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/57) — reading position and finished state; blocks #28's status filters.
4. [#58 — Clarify the scope of Mark as known and add undo](https://github.com/pomodorozhong/extensive-reading-assistant/issues/58)
5. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — blocked by #57.
6. [#59 — Audit dictionary senses and expressions for learner lookups](https://github.com/pomodorozhong/extensive-reading-assistant/issues/59) — do before #14.
7. [#60 — Add end-to-end tests and move library storage to IndexedDB](https://github.com/pomodorozhong/extensive-reading-assistant/issues/60) — blocked by #56; the end-to-end tests come first.
8. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
9. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after #27.
10. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — most speculative; the spec is young.

[#18](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18), [#61](https://github.com/pomodorozhong/extensive-reading-assistant/issues/61) (difficulty feedback after reading, from roadmap draft D9), and [#63](https://github.com/pomodorozhong/extensive-reading-assistant/issues/63) (reading-size controls and keyboard skip, from D7) are labeled `ideas` and are not planned.

## Pending

- **P-21**: delete the 27 remote branches on `origin` whose PRs have merged (every remote branch except `main` and `feat/story-text-type`; each tip matches its merged PR's head, and `fix/prefer-common-entry-over-name` merged as #66). Why: deleting remote branches is outward-facing, and the auto-mode safety check blocked it. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
