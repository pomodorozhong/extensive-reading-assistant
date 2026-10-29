# Handoff

Last verified: 2026-10-29 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### fix/prefer-base-form-for-irregular-verbs

- Task: [#55](https://github.com/pomodorozhong/extensive-reading-assistant/issues/55) — tapping *ate* showed the goddess Ate. The branch is linked to #55 and fully resolves it.
- PR: [#64](https://github.com/pomodorozhong/extensive-reading-assistant/pull/64), opened 2026-10-29.
- Code checkpoint: `origin/main` `3a13b21` plus `5e481ea` (adds *ate, bade, drew, fed, led, lent, sung* to `IRREGULAR` in `src/lib/dictionary.ts`, with a `test:dictionary` case).
- State: awaiting review and merge.
- Verification: 2026-10-29, `npm run lint`, `npm run build`, and all six `test:*` suites passed (85 tests). In the dev preview, tapping *ate*, *drew*, and *led* in a test story showed "take in solid food", "cause to move by pulling", and "take somebody somewhere", with no console errors.
- Next action: merge #64 once its Checks pass and the owner approves. Then put [#65](https://github.com/pomodorozhong/extensive-reading-assistant/issues/65) (the same bug for regular plurals and past forms, filed 2026-10-29) in #55's place at the top of `Ranked work`.
- Avoid: dropping capitalized-only WordNet entries at build time. Lookups use the lowercased word, and the lemmatizer would then map names wrongly (*James → jam*, *Mars → mar*).

## Ranked work

1. [#52 — Make the first dictionary lookup in Story View instant](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52) — in progress on `perf/dictionary-lookup`; built and checked, PR awaiting publish approval (P-13).
2. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
3. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
4. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
5. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
6. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
7. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
8. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

None. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
