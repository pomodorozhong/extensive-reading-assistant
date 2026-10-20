# Handoff

Last verified: 2026-10-20 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`. This branch is separate from the completed New Story implementation and the current wrap-up branch.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### docs/refresh-handoff-and-docs

- Task: documentation maintenance after [PR #30](https://github.com/pomodorozhong/extensive-reading-assistant/pull/30): record the New Story completion, refresh the `AGENTS.md` handoff block to the handoff skill's current template, fix stale `doc/` content, and archive the 2025-03-02 UI mockups under `doc/archive/`. No issue; the branch is intentionally unlinked.
- PR: none yet; awaiting push approval (**P-01**). This local branch was renamed from `codex/new-story-draft-persistence`, which was never pushed.
- Code checkpoint: `e1b39449b0f5ae04d83dc650f7b1397bdbcc61b9` on `origin/main`; the branch adds documentation commits only, with no source changes.
- State: doc fixes cover the removed Home page in `doc/vocabulary-verification.md`, the per-story New Story level in `doc/cefr-vocabulary-validation.md`, and the Vocabulary screen in `doc/mvp-spec-v0.2.md`. [#26](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26) draft persistence is not started; its plan is in the [issue handoff note](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26#issuecomment-6211087674), which still names the old local branch.
- Verification: `git diff --check` passes and every local Markdown link in the changed documents resolves. Application checks were not run because no source changed; the merged PR #30 implementation passed `npm run test:generation`, `npm run test:cefr`, `npm run test:vocabulary`, `npm run lint`, and `npm run build`.
- Next action: once P-01 is approved, push and open the PR; after it merges, start #26 on a fresh branch from `main` with `gh issue develop 26`.
- Pending **P-01**: push `docs/refresh-handoff-and-docs` and open a docs-only PR against `main` that closes no issues. Why: pushing and opening PRs need approval. Blocks: retrieving this `HANDOFF.md` from another computer.

## Ranked work

1. [#26 — M1.3: Preserve New Story drafts and return from Settings](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26) — next task; the controls and generation prerequisites have merged.
2. [#23 — M1.5: Complete loading, offline, error, and save-recovery states](https://github.com/pomodorozhong/extensive-reading-assistant/issues/23) — follows draft persistence.
3. [#24 — M1.6: Verify visual fidelity, responsiveness, and accessibility](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — finish Milestone 1 after implementation and controlled-flow checks.
4. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — add a reviewed key-free reading path after the primary flow is stable.
5. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — security gate before publicly releasing the generation flow.
6. [#17 — Add onboarding for the extensive reading workflow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17) — introduce the reading loop after the New Story flow is stable.
7. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
8. [#12 — Handle inflected words in dictionary lookup](https://github.com/pomodorozhong/extensive-reading-assistant/issues/12) — improve lookup coverage before definition wording.
9. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — follows lookup coverage.
10. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
11. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

No cross-branch approval requests or unfiled issue drafts. This branch's publication request is **P-01** above.
