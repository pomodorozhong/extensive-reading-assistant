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

### fix/story-view-id-change

- Task: [#45](https://github.com/pomodorozhong/extensive-reading-assistant/issues/45), make Story View show the new story when only the URL's story ID changes. The branch is local only and not yet linked to #45 (linking creates the remote branch, which needs push approval); link it when pushing.
- PR: none.
- Code checkpoint: `6496ecc` on `origin/main`; this branch adds only the `docs:` handoff commit so far.
- State: not started. The issue suggests remounting on ID change (`key={id}` on the route element) or reloading the story when `id` changes in `src/pages/StoryView.tsx`.
- Verification: none on this branch yet. `main` at `6496ecc` passed CI (`checks`) on #48.
- Next action: reproduce by changing the hash between two saved stories in the browser pane, then implement and verify title, text, word marks, and lookups update.
- Pending **P-06**: push `fix/story-view-id-change` (handoff commit only) and link it to #45. Why: pushing needs approval. Blocks: retrieving this `HANDOFF.md` from another computer.

## Ranked work

1. [#45 — Story View keeps showing the previous story when only the URL's story ID changes](https://github.com/pomodorozhong/extensive-reading-assistant/issues/45) — small bug with a likely `key={id}` fix.
2. [#46 — Explain the vocabulary levels on New Story and link to an online level test](https://github.com/pomodorozhong/extensive-reading-assistant/issues/46) — "i" button and dialog after **Vocabulary level**; pick the external test during implementation.
3. [#47 — Build an in-app reading level check to replace the external level test](https://github.com/pomodorozhong/extensive-reading-assistant/issues/47) — blocked by #46; needs an owner choice of method and reviewed content.
4. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk, and a `main` ruleset requiring the Checks status (owner setting).
5. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) follow-up — #38 merged without the screen-reader and mockup checks; confirm whether those still need doing.
6. Dependabot PRs [#41](https://github.com/pomodorozhong/extensive-reading-assistant/pull/41)–[#44](https://github.com/pomodorozhong/extensive-reading-assistant/pull/44) — major Action bumps; review before merging.
7. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
8. [#17 — Add onboarding for the extensive reading workflow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17) — can now explain key storage (#39 merged).
9. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
10. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
11. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
12. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

- **P-03** Delete merged local branches: `stack/new-story-reliability`, `feat/new-story-draft-persistence`, `fix/new-story-recovery-states`, `fix/dictionary-inflected-lookup`, `fix/restrict-gemini-endpoint`, `docs/refresh-handoff-and-docs`, `codex/new-story-generation-options` (PRs #30–#35 merged), `feat/gemini-key-dialog` (#48 merged), and `chore/verify-new-story-m1` (handoff-only, unpushed; its handoff now lives on the current work branch). Approved by the owner on 2026-10-21, but the session's permission mode refused the deletions; the owner runs them. The leftover `.agents/propose-stack/` working folders were deleted. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks. Blocks: nothing.
