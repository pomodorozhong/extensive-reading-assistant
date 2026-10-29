# Handoff

Last verified: 2026-10-29 (Asia/Taipei).

## In progress

### fix/prefer-common-entry-over-name

- Task: [#65](https://github.com/pomodorozhong/extensive-reading-assistant/issues/65) — tapping *banks, fields, laws* showed a name. The branch is linked to #65 and fully resolves it.
- PR: none yet.
- Code checkpoint: `61e4e1e` on `main` `c589d8f`.
- State: pushed; the PR draft awaits the owner's approval.
- Verification: 2026-10-29, `npm run lint`, `npm run build`, and all six `test:*` suites passed (90 tests). In the dev preview, a test story showed *bank, field, law, gate* for the lowercase words and James Stuart and the planet for *James* and *Mars*, with no console errors.
- Behavior to know: explanations are stored per lowercase word, so a story that writes both *Gates* and *gates* shows the ordinary word for both. The `-es` reorder also changes *bites, notes, games, cones* from *bit, not, gam, con* to their real bases.
- Next action: open the PR once the owner approves **P-22**.
- Pending **P-22**: open the PR "fix(dictionary): prefer the base word over a name for words met in lowercase" from this branch to `main`, closing #65. Why: opening a PR needs approval. Blocks: review and merge of #65.

## Ranked work

1. [#65 — Prefer the base form when a regular plural or past form has only a proper-noun entry](https://github.com/pomodorozhong/extensive-reading-assistant/issues/65) — fixed on `fix/prefer-common-entry-over-name`; the PR awaits approval (P-22).
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

[#18](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18), [#61](https://github.com/pomodorozhong/extensive-reading-assistant/issues/61) (difficulty feedback after reading, from roadmap draft D9), and [#63](https://github.com/pomodorozhong/extensive-reading-assistant/issues/63) (reading-size controls and keyboard skip, from D7) are labeled `ideas` and are not planned.

## Pending

- **P-21**: delete the 26 remote branches on `origin` whose PRs have merged (every remote branch except `main` and `fix/prefer-common-entry-over-name`; each tip matches its merged PR's head). Why: deleting remote branches is outward-facing, and the auto-mode safety check blocked it. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
