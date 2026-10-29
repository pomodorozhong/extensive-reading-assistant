# Handoff

Last verified: 2026-10-29 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- State: every roadmap draft is now published or superseded (D1–D10 → #23, #26–#28, #56–#59, #61, #63).
- Next action: delete the local branch once the owner approves **P-20**.
- Pending **P-20**: delete the local-only branch `codex/docs/user-flow-roadmap`. Why: deleting unpushed commits can't be undone. Blocks: nothing.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### docs/roadmap-issues-and-stale-docs

- Task: land this session's documentation fixes on `main`: README and MVP spec lines made stale by merged work (#26's draft persistence, six `test:*` suites in CI, the in-app level check and introduction), and the `AGENTS.md` handoff block synced with the current skill template. Renamed locally from `chore/verify-new-story-m1` after [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) closed; not linked to any issue.
- PR: [#62](https://github.com/pomodorozhong/extensive-reading-assistant/pull/62), opened 2026-10-29.
- Code checkpoint: `origin/main` `3a13b21`; this branch adds only `docs:` commits.
- State: awaiting review and merge.
- Verification: documentation-only changes; `main` passed lint, build, and all six `test:*` suites (84 tests) on 2026-10-29.
- Next action: merge #62 once its Checks pass and the owner approves; then delete this branch.

## Ranked work

1. [#55 — Prefer the base form when a word's surface form is a rare proper or archaic entry](https://github.com/pomodorozhong/extensive-reading-assistant/issues/55) — small, reader-visible dictionary bug (*ate* shows the goddess Ate).
2. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — lets a new reader try the app without a key; needs starter content the owner reviews (Claude can draft one story per level).
3. [#56 — Add browser-local backup and restore with clear device and offline status](https://github.com/pomodorozhong/extensive-reading-assistant/issues/56) — all data lives only in `localStorage`; unblocks story deletion (#28) and the storage move (#60).
4. [#57 — Resume unfinished stories and offer an explicit completion flow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/57) — reading position and finished state; blocks #28's status filters.
5. [#58 — Clarify the scope of Mark as known and add undo](https://github.com/pomodorozhong/extensive-reading-assistant/issues/58)
6. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — blocked by #57.
7. [#59 — Audit dictionary senses and expressions for learner lookups](https://github.com/pomodorozhong/extensive-reading-assistant/issues/59) — do before #14.
8. [#60 — Add end-to-end tests and move library storage to IndexedDB](https://github.com/pomodorozhong/extensive-reading-assistant/issues/60) — blocked by #56; the end-to-end tests come first.
9. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
10. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after #27.
11. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — most speculative; the spec is young.

[#18](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) [#61](https://github.com/pomodorozhong/extensive-reading-assistant/issues/61) (difficulty feedback after reading, from roadmap draft D9), and [#63](https://github.com/pomodorozhong/extensive-reading-assistant/issues/63) (reading-size controls and keyboard skip, from D7) are labeled `ideas` and are not planned.

## Pending

None.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
