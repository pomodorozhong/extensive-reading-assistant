# Handoff

Last verified: 2026-10-23 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### perf/dictionary-lookup

- Task: [#52](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52), make the first dictionary lookup in Story View instant, and stop the lookup note from moving the story text.
- PR: none. The branch is linked to #52 and pushed to `origin`.
- Code checkpoint: `origin/main` `9318f6c`; no code commits yet, only `docs:` handoff commits.
- State: measured, plan written, no code. The measurements, the layout-shift cause, and the plan are in the [#52 handoff note](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52#issuecomment-6356125708). In short: on localhost a lookup takes 1–9 ms, so only the spinner flash is visible; on GitHub Pages without a service worker a large shard takes 380–854 ms to fetch; parsing is at most 22 ms.
- Layout shift: the owner reported that the spinner pushes the layout around, and any spinner that stays must not do that. Likely cause, from the code but not yet reproduced: the spacer under the tapped word (`useLayoutEffect` in `src/pages/StoryView.tsx`) follows the note's height, so the text moves when "Looking up…" appears, again when the taller definition replaces it, and again if "Retry" wraps.
- Plan (**P-12**, awaiting approval):
  1. When Story View opens, preload the shards its words' candidate forms need during idle time, one at a time.
  2. In `lookupDefinition`, fetch candidate forms' shards in parallel, keeping form order so results are unchanged.
  3. Keep the note closed until the definition is ready or about 150 ms pass. If the spinner shows, give the note a minimum height of about two lines and keep the action row's layout identical while loading. Apply the same delay to the "Unknown words" list.
  - Checks: first reproduce the jump in the browser pane; then `npm run lint`, `npm run build`, every `test:*` suite, the timing reruns, a check that a fast lookup moves the text at most once, the slow path with an artificial delay, and offline use with the service worker. Hosted before/after timings are a reviewer follow-up after deploy.
- Next action: ask the owner to approve P-12, then build it and show the `open-pr` publish approval.
- Pending **P-12**: approve the plan above. Blocks: building.

## Ranked work

1. [#52 — Make the first dictionary lookup in Story View instant](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52) — in progress on `perf/dictionary-lookup`; measured, plan awaiting approval (P-12).
2. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
3. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
4. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
5. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
6. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
7. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
8. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

None. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
