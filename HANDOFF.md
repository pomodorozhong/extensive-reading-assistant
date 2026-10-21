# Handoff

Last verified: 2026-10-21 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### feat/reading-level-check

- Task: [#47](https://github.com/pomodorozhong/extensive-reading-assistant/issues/47), an in-app reading level check that replaces the external level test link. The owner chose a vocabulary-recognition check from `src/data/cefr.json` with made-up words and a guessing correction (80% pass threshold) on 2026-10-21, then asked for batches instead of one word at a time, with each batch tuned by the previous answers.
- PR: none yet; the branch is local and not linked to #47 (linking creates it on GitHub, which needs push approval).
- Code checkpoint: `19dd8be` (`feat(level-check): add an adaptive in-app reading level check`), one commit on `origin/main` `04de502`.
- State: done and awaiting the owner's review. `/level-check` (`src/pages/LevelCheck.tsx`) shows three sets of tick-the-words-you-know checkboxes: 2 words per band plus 4 made-up words, then two sets of 4 unseen words from the suggested band and the one above plus 4 made-up words (40 words in all). Word lists, set selection, and scoring are in `src/lib/level-check.ts`. The level dialog links to it, and the result can set the New Story draft's level (keeping theme, length, and model) and optionally the Settings default.
- Verification: lint, build, and all five `test:*` suites passed (new `test:level-check`, 10 tests, also added to CI). Browser pane: keyboard Tab and Space tick words; a scripted B1 reader got sets 2–3 drawn only from B1/B2 and a B1 result; no horizontal scroll at 320 px; a scripted A2 reader got A2, and applying it kept the draft's theme and 15-minute length. Saving the Settings default was checked on the earlier one-word-at-a-time version; that code is unchanged.
- Checks not run: a real screen reader, touch on a device, 200% zoom.
- Next action: owner tries `/level-check` and reviews the word and made-up-word lists in `src/lib/level-check.ts`, then answers **P-08**.
- Pending **P-08**: push `feat/reading-level-check` and open a PR that closes #47. Why: publishing needs the owner's approval. Blocks: CI and merge.

## Ranked work

1. [#47 — Build an in-app reading level check to replace the external level test](https://github.com/pomodorozhong/extensive-reading-assistant/issues/47) — built on `feat/reading-level-check`; awaiting owner review and P-08.
2. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue now that #49 and #50 have merged: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
3. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
4. Dependabot PRs [#41](https://github.com/pomodorozhong/extensive-reading-assistant/pull/41)–[#44](https://github.com/pomodorozhong/extensive-reading-assistant/pull/44) — major Action bumps; review before merging.
5. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
6. [#17 — Add onboarding for the extensive reading workflow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17) — can now explain key storage (#39 merged).
7. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
8. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
9. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
10. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

- **P-03** Delete merged local branches: `stack/new-story-reliability`, `feat/new-story-draft-persistence`, `fix/new-story-recovery-states`, `fix/dictionary-inflected-lookup`, `fix/restrict-gemini-endpoint`, `docs/refresh-handoff-and-docs`, `codex/new-story-generation-options` (PRs #30–#35 merged), `feat/gemini-key-dialog` (#48 merged), `fix/story-view-id-change` (#49 merged; its unpushed wrap-up `docs:` commit is superseded), `feat/vocabulary-level-dialog` (#50 merged), and `chore/verify-new-story-m1` (handoff-only, unpushed; its handoff now lives on the current work branch). Approved by the owner on 2026-10-21, but the session's permission mode refused the deletions; the owner runs them. The leftover `.agents/propose-stack/` working folders were deleted. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks. Blocks: nothing.
