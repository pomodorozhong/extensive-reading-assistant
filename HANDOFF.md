# Handoff

Last verified: 2026-10-24 (Asia/Taipei).

## In progress

### chore/verify-new-story-m1

- Task: [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24), the last Milestone 1 issue. Its fixes merged in #38; left undone: a real screen-reader pass (VoiceOver or NVDA), the mockup comparison (the mockup attached to #21 is not in the repository or the issue text), and #50's 200% zoom, screen-reader, and touch checks.
- PR: none.
- Code checkpoint: `origin/main` `3a13b21`; this branch holds only the `docs:` handoff commit, created locally and not linked to #24 (linking creates it on GitHub).
- State: waiting on the owner's decision: close #24 with the remaining checks as follow-ups, or keep it open while the owner runs VoiceOver and supplies the mockup for comparison.
- Verification: none on this branch; `main` passed lint, build, and every `test:*` suite on 2026-10-23 before #54 merged.
- Next action: ask the owner the #24 question above, then act on the answer.
- Pending **P-16**: push this branch so another computer can read this handoff. Why: pushing needs the owner's approval. Blocks: resuming elsewhere.

### codex/docs/user-flow-roadmap

- Task: preserve the earlier user-flow review, roadmap drafts, and session history until their remaining value has been reviewed against the published issues.
- PR: none.
- Code checkpoint: `ea08b9d2429c343967872d286b84ae54a9c37959`.
- State: six older documentation commits exist only on this local branch, outside `origin/main`; no matching branch exists on `origin`. They include `doc/user-flow-review-and-roadmap.md` and `doc/roadmap-issue-drafts.md`.
- Verification: inspected its commit list and file inventory; no application checks were run for this historical documentation branch.
- Next action: compare the two archive documents with current GitHub issues before deciding whether to publish or retire the branch. Preserve the local branch until that review is complete.
- Avoid: copying its superseded `AGENTS.md` or `.agents` continuity instructions into the current workflow. The current handoff guidance is the marked section in root `AGENTS.md`.

## Ranked work

1. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) — last Milestone 1 issue, handed off on `chore/verify-new-story-m1`: confirm whether the screen-reader and mockup checks still need doing. #50's 200% zoom, screen-reader, and touch checks were not done before merge.
2. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk (`pomodorozhong.github.io` serves about 20 of the owner's Pages sites; a docs PR for this was proposed and dropped on 2026-10-21), and a `main` ruleset requiring the Checks status (owner setting).
3. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
4. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
5. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
6. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
7. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

- **P-14** — file this issue. Why: filing needs the owner's approval. Blocks: nothing.
  - Title: `Prefer the base form when a word's surface form is a rare proper or archaic entry`
  - Labels: `bug`. Milestone: none.
  - Body: Tapping *ate* in Story View shows the WordNet gloss for "Ate" (the Greek goddess of criminal rashness) instead of *eat*. `dictionaryForms('ate')` returns `['ate', 'eat']`, and `lookupDefinition` returns the first form with an entry, so the surface form wins whenever the dictionary has any entry for it, even a rare proper noun. Other irregular past forms that are also nouns may do the same. Found while measuring #52; #54 kept the candidate order unchanged on purpose. Possible fixes: add *ate* (and similar forms) to the `IRREGULAR` table in `src/lib/dictionary.ts`, or skip glosses built from capitalized WordNet lemmas when building shards. Acceptance: *ate* shows the *eat* definition; `npm run test:dictionary` passes with a case for it.
- **P-15** — delete the merged `perf/dictionary-lookup` branch, locally and on `origin`. Its tree is identical to `main` after the squash merge of #54, so nothing is lost. Why: deleting a branch needs the owner's approval. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
