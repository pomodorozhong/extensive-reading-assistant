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
- PR: none yet. The branch is linked to #52 and pushed to `origin` up to the earlier `docs:` commits only.
- Code checkpoint: `5af2a84` on top of `origin/main` `9318f6c`; the code commits are local and unpushed.
- State: plan P-12 approved by the owner on 2026-10-23 and built in two commits: `0e7aa58` (preload the story's shards in idle time; fetch candidate shards in parallel, keeping form order) and `5af2a84` (keep the note closed until the definition is ready or 150 ms pass; inline spinner; two-line minimum once the spinner shows; hidden Retry placeholder; same 150 ms delay for the Unknown words list). Building it also found that Radix's `Spinner` is `display: block`, which spread "Looking up…" over three lines.
- Verification (2026-10-23): `npx oxlint`, `tsc -b`, `npm run build`, and all six `test:*` suites pass (dictionary has three new tests for parallel fetching). In the browser pane: before the fix, a 600–800 ms lookup moved the text twice; after it, a fast lookup moves it once with no spinner, and a 700 ms artificial delay opens the note once at about 240 ms with the spinner, with no second move. Preview with the service worker: tap to note in 10–17 ms; the preload finishes about 1.5 s after page load. Offline lookups work through the service worker.
- Not checked: hosted GitHub Pages timings (after deploy), slow phones, phone-width layout, and screen readers.
- Next action: get the owner's answer to P-13, then publish as the `open-pr` skill says.
- Pending **P-13**: push `perf/dictionary-lookup` and open the PR with the drafted title and body (Closes #52). Why: pushing and opening a PR need the owner's approval. Blocks: review and merge.

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
