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

- Task: [#52](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52), make the first dictionary lookup in Story View instant. The owner asked on 2026-10-23 to do it after #53 merged.
- PR: none. The branch is local and not linked to #52; linking with `gh issue develop` creates it on GitHub, which needs push approval.
- Code checkpoint: `origin/main` `9318f6c` (#53 merged); no code commits yet, only this handoff.
- State: not started. Cause found so far, not yet measured: `lookupDefinition` in `src/lib/dictionary.ts` fetches and parses a whole first-letter shard from `public/dictionary/` on that letter's first lookup per page load (27 shards, about 10 MB; `s.json` 1.17 MB), and awaits candidate forms one at a time. The service worker precaches the shards, but each one is still read and parsed again after every reload.
- Next action: measure fetch and parse time per shard, cold and warm, in `npm run dev` and in `npm run build && npm run preview`. Then show an `open-pr` plan before building.
- Pending **P-11**: link this branch to #52 with `gh issue develop` and push it with this handoff commit. Why: that creates the branch on GitHub. Blocks: retrieving this `HANDOFF.md` from another computer.

## Ranked work

1. [#52 — Make the first dictionary lookup in Story View instant](https://github.com/pomodorozhong/extensive-reading-assistant/issues/52) — in progress on `perf/dictionary-lookup`; measure shard fetch and parse time first.
2. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
3. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
4. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
5. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
6. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
7. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
8. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

None. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
