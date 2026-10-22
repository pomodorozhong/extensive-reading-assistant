# Handoff

Last verified: 2026-10-22 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### feat/onboarding

- Task: [#17](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17), first-use onboarding for the extensive reading workflow. The owner asked on 2026-10-22 for it to be animation heavy, easy to understand, and easy to follow, and approved a six-step CSS-animated dialog shown only to readers with no outcome saved and no stories.
- PR: none yet; the branch is local and not linked to #17 (linking creates it on GitHub, which needs push approval).
- Code checkpoint: `9eadc46` (`feat(onboarding): add an animated first-use introduction to the reading workflow`), one commit on `origin/main` `66f35fb`.
- State: done and awaiting the owner's approval to publish. `src/components/Onboarding.tsx` holds the dialog and its six animated scenes; `src/lib/onboarding.ts` holds the `era.v1.onboarding` outcome, the first-use rule, and the open state that Settings uses to reopen it; motion styles are the `.ob-*` rules in `src/index.css`.
- Verification: lint, build, and all six `test:*` suites passed (new `test:onboarding`, 6 tests, also added to CI). Browser pane: first visit with empty storage opens it with focus on Next; arrow keys and Enter step through; Skip and Esc save `skipped` and it stays closed after reload; a reader with saved stories is not shown it; reopening from Settings and finishing via Check my level goes to `/level-check` and changes only `era.v1.onboarding` in storage; Choose a level and start goes to `/new`; closing returns focus to the Settings button; at 320 px there is no horizontal scroll, the story panel grows instead of clipping, and buttons stack in focus order.
- Checks not run: reduced motion was confirmed in the stylesheet but not seen rendered (the pane cannot emulate it); a real screen reader; touch on a device; 200% zoom.
- Next action: owner answers **P-10**.
- Pending **P-10**: push `feat/onboarding`, link it to #17, and open a PR that closes #17. Why: publishing needs the owner's approval. Blocks: CI and merge.

## Ranked work

1. [#17 — Add onboarding for the extensive reading workflow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17) — built on `feat/onboarding`; awaiting P-10.
2. [#52 — Make the first dictionary lookup in Story View instant](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52) — the owner wants it next, after #17 merges; measure shard fetch and parse time first.
3. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
4. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
5. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
6. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
7. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
8. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
9. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

None. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
