# Handoff

Last verified: 2026-10-30 (Asia/Taipei).

## In progress

### feat/curated-starter-stories

- Task: [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27). Local branch carrying only an old handoff commit; not linked to #27. Rebuild it from `main` (or create a fresh branch from the issue) when starting the code.
- PR: none yet.
- Code checkpoint: none; no code yet.
- State: content chosen, code not started. The owner picked four starter stories, one per level A1–B2: *My New Friend* (A1 diary), *My New Pen Pal* (A2 letter), *The Whispering Books* (B1 short story), and *The Ghost in My Pocket* (B2 reflective essay). Their full text, generation settings, and prompts are in the [#27 handoff comment](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27#issuecomment-6520784916); a local copy may exist in the untracked `.claude/starter-stories-chosen.json`.
- Decisions: about 2 minutes each (160–240 words); no closing "THE END."; keep each story's generation record (#69) so Story View's provenance card (#71) shows how it was made.
- Not decided: how to label 2-minute reading time, since `ReadingMinutes` is 5, 10, or 15.
- Next action: after #76 and #77, plan the #27 PR with the owner (where starters live in code, entry points on Home and empty My Stories, the 2-minute label), and change `*Thump.*` to plain text in *The Whispering Books*.

### feat/save-varied-sentences

- Task: [#76 — Save the varied sentence length choice on each story and show it in Story View](https://github.com/pomodorozhong/extensive-reading-assistant/issues/76). Linked to #76; the PR will fully resolve it. Unblocked: #75 merged in [#78](https://github.com/pomodorozhong/extensive-reading-assistant/pull/78).
- PR: none yet.
- Code checkpoint: none; branch created from `main` `f174636` to carry this handoff.
- State: not started. The approach that worked in an earlier unpushed version is in the [#76 handoff comment](https://github.com/pomodorozhong/extensive-reading-assistant/issues/76#issuecomment-6520788663).
- Avoid: skipping `test:level-check` or `test:dictionary` locally; CI runs all six `test:*` suites, and the level-check suite builds New Story drafts by hand (it broke CI on #78).
- Next action: implement #76 and open a PR with the `open-pr` skill.

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

- **P-21**: delete the 33 remote branches on `origin` whose PRs have merged: every remote branch except `main`, `feat/curated-starter-stories`, and `feat/save-varied-sentences` (rechecked 2026-10-30; now including `feat/save-generation-request` (#70), `feat/story-generation-details` (#74), `docs/exam-workflow-mockup` (#72), and `feat/varied-sentence-length` (#78)). Why: deleting remote branches is outward-facing, and the auto-mode safety check blocked it on 2026-10-30 even after the user asked for cleanup; the user can run the deletion. Merged local branches are deleted, except `docs/exam-workflow-mockup`, which is checked out in the main checkout. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
