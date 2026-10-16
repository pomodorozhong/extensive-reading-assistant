# Handoff

Last verified: 2026-10-16 (Asia/Taipei).

## In progress

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`. This branch is separate from the completed New Story implementation and the current wrap-up branch.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

### codex/new-story-draft-persistence

- Task: [#26 — Preserve New Story drafts and return from Settings](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26).
- PR: none. This is a local branch prepared for the next task; it has no linked GitHub development branch yet.
- Code checkpoint: `e1b39449b0f5ae04d83dc650f7b1397bdbcc61b9` on `origin/main`, the merge of [PR #30](https://github.com/pomodorozhong/extensive-reading-assistant/pull/30). Its tree matches the reviewed source tip `5f2504ecdf5a1a5c601cc3cd3afa8cfbe5d43f5f`.
- State: [#21](https://github.com/pomodorozhong/extensive-reading-assistant/issues/21) is closed by [PR #29](https://github.com/pomodorozhong/extensive-reading-assistant/pull/29); [#25](https://github.com/pomodorozhong/extensive-reading-assistant/issues/25) and [#22](https://github.com/pomodorozhong/extensive-reading-assistant/issues/22) are closed by [PR #30](https://github.com/pomodorozhong/extensive-reading-assistant/pull/30). Draft persistence remains unimplemented. This branch contains wrap-up documentation only, with no unfinished source changes.
- Issue handoffs: [landing completion](https://github.com/pomodorozhong/extensive-reading-assistant/issues/21#issuecomment-6211086392), [controls and responsive layout](https://github.com/pomodorozhong/extensive-reading-assistant/issues/25#issuecomment-6211086787), [request wiring](https://github.com/pomodorozhong/extensive-reading-assistant/issues/22#issuecomment-6211087200), and [next draft-persistence task](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26#issuecomment-6211087674).
- Verification: the reviewed implementation passed `npm run test:generation` (9), `npm run test:cefr` (20), `npm run test:vocabulary` (19), `npm run lint`, and `npm run build`; every implementation commit was checked independently. Browser verification covered the loopback generation/save/reload/reader/vocabulary flow, keyboard selection, 320/390 px phones, both sides of the 768/1024 px breakpoints, and a 1024 px panel at a 1440 px viewport. No Google requests were made. The build has the existing large-chunk warning.
- Wrap-up verification: whitespace checks passed; all 14 local file links across five Markdown documents resolve; `AGENTS.md` matches the handoff template exactly; the merged tree matches the reviewed implementation; and all four posted issue notes were fetched and verified. Application tests were not rerun for the documentation-only wrap-up.
- Checks not run: live Gemini quality/timing, exact comparison against the newer approved mockup (image unavailable), and final milestone-wide zoom/screen-reader checks. The latter verification remains in [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24).
- Next action: implement an allowlisted non-secret draft that survives Settings navigation and reload, restores the selected choices, and clears only after successful generation/save; add the Settings return action and controlled regression tests.
- Decisions to preserve: fresh defaults are A2 and 10 minutes, with a saved CEFR preference taking precedence; the form grows to 1024 px; all three options share a row at viewport widths of 1024 px or more, use two rows at 768–1023 px, and stack below 768 px. See [generation behavior and local verification](README.md#choose-a-story).
- Avoid: copying Settings credentials or the API endpoint into a draft, resetting the draft on failure, or undoing the segmented controls' minimum-width fixes. Use the fresh localStorage Map and mocked-fetch pattern in `tests/generate.test.mjs`; the earlier property-mocking setup stalled test workers.
- Pending **P-01**: push this branch's wrap-up documentation to `origin/codex/new-story-draft-persistence` and link the branch to [#26](https://github.com/pomodorozhong/extensive-reading-assistant/issues/26). Scope: the documentation commit based on `e1b3944`; exclude the historical roadmap branch, new source work, PR creation, and merging. Why approval is needed: the earlier publication approval covered the exact reviewed [PR #30](https://github.com/pomodorozhong/extensive-reading-assistant/pull/30) branch; it did not include this later wrap-up commit. Blocks: retrieving the current `HANDOFF.md` from another computer and discovering this local branch through the issue. Local implementation can continue without this push.

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

No cross-branch approval requests or unfiled issue drafts. The current branch's publication request is **P-01** above. The older local roadmap history remains recorded in its branch subsection.
