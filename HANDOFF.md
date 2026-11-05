# Handoff

Last verified: 2026-11-05 (Asia/Taipei).

## In progress

### claude/app-redesign-mockup-cc1e9f

- Task: redesign the whole app to follow the designer's exam workflow mockup (`doc/design/exam-workflow-mockup`). No issue; the branch is not linked to one.
- PR: none yet.
- Code checkpoint: `db620e1` on `main` `e837ad0`.
- State: implemented and committed locally; awaiting approval to push and open the PR (P-22). The restyle covers the header, navigation, Settings sections, My Stories (stats line, group and sort dropdowns, collapsible groups, preview cards), and Story View (side panel with Save word, end card, topic and tone chips, Example chip). New features: the reading comprehension exam (Gemini writes 4 questions), the Exam tab, the Dictionary rename with a `/vocabulary` redirect, and an exam switch in Settings. Read state and scores live in the new `era.v1.progress` entry.
- Verification: 2026-11-05, `npm run lint`, `npm run build`, and all seven `test:*` suites passed. In the browser pane, My Stories, Story View, Exam (vocabulary quiz and results), the reading exam without a key, and Settings rendered and worked; no console errors were checked beyond that.
- Not verified: reading exam question generation with a real Gemini key.
- Next action: after approval, push and open the PR with the `open-pr` skill.
- Pending: **P-22**: push this branch and open its PR with the title and body shown in the session. Why: publishing is outward-facing. Blocks: the PR.

### feat/curated-starter-stories

- Task: [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27). Local branch carrying only an old handoff commit; not linked to #27. Rebuild it from `main` (or create a fresh branch from the issue) when starting the code.
- PR: none yet.
- Code checkpoint: none; no code yet.
- State: content chosen, code not started. The owner picked four starter stories, one per level A1–B2: *My New Friend* (A1 diary), *My New Pen Pal* (A2 letter), *The Whispering Books* (B1 short story), and *The Ghost in My Pocket* (B2 reflective essay). Their full text, generation settings, and prompts are in the [#27 handoff comment](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27#issuecomment-6520784916); a local copy may exist in the untracked `.claude/starter-stories-chosen.json`.
- Decisions: about 2 minutes each (160–240 words); no closing "THE END."; keep each story's generation record (#69) so Story View's provenance card (#71) shows how it was made.
- Not decided: how to label 2-minute reading time, since `ReadingMinutes` is 5, 10, or 15.
- Next action: after #76 and #77, plan the #27 PR with the owner (where starters live in code, entry points on Home and empty My Stories, the 2-minute label), and change `*Thump.*` to plain text in *The Whispering Books*.

### feat/save-varied-sentences

- Task: [#76 — Save the varied sentence length choice on each story and show it in Story View](https://github.com/pomodorozhong/extensive-reading-assistant/issues/76). Linked to #76; the PR fully resolves it.
- PR: none yet.
- Code checkpoint: `ba33ba6` on `main` `f174636`.
- State: implemented and committed locally; awaiting approval to push and open the PR (open-pr publish approval).
- Verification: 2026-10-30, `npm run lint`, `npm run build`, and all six `test:*` suites passed (generation 36/36). In the browser pane, seeded stories showed **Sentence length: Varied**, **Not requested**, and no row for a story without the field; no console errors.
- Also on this branch: `2b84ba8` restores the lowercase-word sentence for `test:dictionary` in `doc/development.md`, which was committed on the #66 branch after its PR merged.
- Next action: after approval, push and open the PR with the `open-pr` skill.

## Ranked work

1. [#76 — Save the varied sentence length choice on each story and show it in Story View](https://github.com/pomodorozhong/extensive-reading-assistant/issues/76) — small; branch `feat/save-varied-sentences` is ready.
2. [#77 — Stop asking generated texts to end with THE END](https://github.com/pomodorozhong/extensive-reading-assistant/issues/77) — small and independent; the owner found the line no longer fits.
3. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — the four starters are chosen; code remains.
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

- **P-21**: delete the remote branch `fix/prefer-common-entry-over-name` once `feat/save-varied-sentences` (PR #79) merges; `2b84ba8` carries its only unmerged change. The user deleted the other 32 merged remote branches on 2026-10-30, and all merged local branches are deleted. Why: deleting remote branches is outward-facing, and the auto-mode safety check blocks it; the user can run it. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
