# Handoff

Last verified: 2026-10-30 (Asia/Taipei).

## In progress

### feat/curated-starter-stories

- Task: [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27). Created locally from `main` to carry this handoff; not linked to #27, because it is not yet known whether one PR will fully resolve it.
- PR: none yet.
- Code checkpoint: `77eac36` on `main` (no work yet).
- State: not started. The text types it can cover merged in [#67](https://github.com/pomodorozhong/extensive-reading-assistant/pull/67).
- Next action: plan the starter stories with the user (which levels and text types, and how the owner reviews the content) before writing code.

### feat/save-generation-request

- Task: [#69 — Save the full generation request with each generated story](https://github.com/pomodorozhong/extensive-reading-assistant/issues/69). Linked to #69; the PR fully resolves it. Done before returning to #27, whose starter stories can use the same record for provenance.
- PR: none yet; awaiting publish approval.
- Code checkpoint: `3c6210f` on `main` `77eac36`.
- State: committed locally; awaiting push and PR approval.
- Design: `Story.generation` (optional) holds the model, temperature, target word range, and exact system and user prompts; `generateStory` builds it from the same values it sends, and `createGeneratedStory` saves it. No UI change.
- Verification: 2026-10-30, `npm run lint`, `npm run build`, and `test:generation` (33), `test:cefr` (20), `test:vocabulary` (19), `test:onboarding` (6) passed. In the dev preview with the Gemini fixture, a generated A2, 10-minute story saved the full record with 800–1200 words and no key.
- Not checked: `test:level-check` and `test:dictionary`, which this change cannot affect.
- Next action: after approval, push and open the PR with the `open-pr` skill, then return to `feat/curated-starter-stories`.

## Ranked work

1. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — lets a new reader try the app without a key; needs starter content the owner reviews (Claude can draft one story per level). The text types from [#67](https://github.com/pomodorozhong/extensive-reading-assistant/pull/67) give the starter stories forms to cover.
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

- **P-21**: delete the 29 remote branches on `origin` whose PRs have merged (every remote branch except `main` and `feat/curated-starter-stories`; each tip matches its merged PR's head, including `feat/story-text-type` (#67) and `docs/readme-split` (#68)). Why: deleting remote branches is outward-facing, and the auto-mode safety check blocked it again on 2026-10-30 after the user asked for cleanup; the user can run the deletion. The merged local branches are already deleted. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
