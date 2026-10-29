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

### fix/prefer-base-form-for-irregular-verbs

- Task: [#55](https://github.com/pomodorozhong/extensive-reading-assistant/issues/55) — tapping *ate* showed the goddess Ate. The branch is linked to #55 and fully resolves it.
- PR: [#64](https://github.com/pomodorozhong/extensive-reading-assistant/pull/64), opened 2026-10-29.
- Code checkpoint: `origin/main` `e27c769` merged in; the fix is `5e481ea` (adds *ate, bade, drew, fed, led, lent, sung* to `IRREGULAR` in `src/lib/dictionary.ts`, with a `test:dictionary` case).
- State: awaiting review and merge.
- Verification: 2026-10-29, `npm run lint`, `npm run build`, and all six `test:*` suites passed (85 tests). In the dev preview, tapping *ate*, *drew*, and *led* in a test story showed "take in solid food", "cause to move by pulling", and "take somebody somewhere", with no console errors.
- Next action: merge #64 once its Checks pass and the owner approves.
- Avoid: dropping capitalized-only WordNet entries at build time. Lookups use the lowercased word, and the lemmatizer would then map names wrongly (*James → jam*, *Mars → mar*).

## Ranked work

1. [#55 — Prefer the base form when a word's surface form is a rare proper or archaic entry](https://github.com/pomodorozhong/extensive-reading-assistant/issues/55) — fixed for irregular past forms on `fix/prefer-base-form-for-irregular-verbs`; [PR #64](https://github.com/pomodorozhong/extensive-reading-assistant/pull/64) awaiting merge.
2. [#65 — Prefer the base form when a regular plural or past form has only a proper-noun entry](https://github.com/pomodorozhong/extensive-reading-assistant/issues/65) — same bug for about 130 words (*banks, fields, laws*); needs a way to tell names from inflections.
3. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — lets a new reader try the app without a key; needs starter content the owner reviews (Claude can draft one story per level).
4. [#56 — Add browser-local backup and restore with clear device and offline status](https://github.com/pomodorozhong/extensive-reading-assistant/issues/56) — all data lives only in `localStorage`; unblocks story deletion (#28) and the storage move (#60).
5. [#57 — Resume unfinished stories and offer an explicit completion flow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/57) — reading position and finished state; blocks #28's status filters.
6. [#58 — Clarify the scope of Mark as known and add undo](https://github.com/pomodorozhong/extensive-reading-assistant/issues/58)
7. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — blocked by #57.
8. [#59 — Audit dictionary senses and expressions for learner lookups](https://github.com/pomodorozhong/extensive-reading-assistant/issues/59) — do before #14.
9. [#60 — Add end-to-end tests and move library storage to IndexedDB](https://github.com/pomodorozhong/extensive-reading-assistant/issues/60) — blocked by #56; the end-to-end tests come first.
10. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
11. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after #27.
12. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — most speculative; the spec is young.

[#18](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18), [#61](https://github.com/pomodorozhong/extensive-reading-assistant/issues/61) (difficulty feedback after reading, from roadmap draft D9), and [#63](https://github.com/pomodorozhong/extensive-reading-assistant/issues/63) (reading-size controls and keyboard skip, from D7) are labeled `ideas` and are not planned.

## Pending

None.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
