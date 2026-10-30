# Handoff

Last verified: 2026-10-30 (Asia/Taipei).

## In progress

### docs/exam-workflow-mockup

- Task: add the designer's exam workflow mockup to `doc/design/exam-workflow-mockup/` as a design reference, with no implementation. No issue; not linked.
- PR: none yet; awaiting publish approval.
- Code checkpoint: `99edcc6` on `main` `afaa8f8`.
- State: committed locally; awaiting push and PR approval.
- Verification: 2026-10-30, `npm run lint` and `npm run build` passed; the prototype file matches the designer's original byte for byte and renders in the browser pane with no console errors.
- Not checked: the prototype's interactive flows, since the browser pane shows local files as static snapshots.
- Next action: after approval, push and open the PR with the `open-pr` skill.

### feat/curated-starter-stories

- Task: [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27). Created locally from `main` to carry this handoff; not linked to #27, because it is not yet known whether one PR will fully resolve it.
- PR: none yet.
- Code checkpoint: `77eac36` on `main` (no work yet).
- State: not started. The text types it can cover merged in [#67](https://github.com/pomodorozhong/extensive-reading-assistant/pull/67).
- Next action: plan the starter stories with the user (which levels and text types, and how the owner reviews the content) before writing code.

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
