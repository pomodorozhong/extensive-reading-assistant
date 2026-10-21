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

### feat/gemini-key-dialog

- Task: [#36](https://github.com/pomodorozhong/extensive-reading-assistant/issues/36), ask for a Gemini API key in a guided dialog on New Story. The branch is local only; link it to #36 when it is pushed (the PR fully resolves #36).
- PR: none yet.
- Code checkpoint: `a895114` on `6c53a8b` (`origin/main`). `26f19cd` moves the key field, switch, and storage wording into `src/components/GeminiKeyField.tsx` (Settings unchanged on screen). The feature commit adds `src/components/GeminiKeyDialog.tsx`, opens it from Generate Story, removes the missing-key notice above the form, and documents the dialog in `README.md`.
- State: implementation complete; PR approval requested. Owner decisions: remove the missing-key notice, since the dialog covers it; make the dialog friendlier (two numbered steps, plain wording), with the shared key-field wording simplified in Settings too and the "anyone using this browser profile or code on this site can read it" caveat moved into the Settings guidance. Offline with no key, the dialog still opens and only saves the key ("Save key").
- Verification: `npm run lint`, `npm run build`, `test:generation` (23), `test:cefr` (20), `test:vocabulary` (19), `test:dictionary` (3) passed; `26f19cd` also built and passed `test:generation` alone. Browser checks in the desktop app's pane against the loopback fixture: dialog opens with no key and focus in the key field, accessible name and description set; Escape returns focus to Generate Story with the draft unchanged; empty submit shows an alert and keeps focus; remembered key generates with the draft's choices and is stored only in `era.v1.gemini-key`; memory-only key generates, stores nothing, and is gone after reload; Tab wraps inside the dialog; offline saves without generating and marks the button unavailable; with a key saved, no dialog appears; at 320 px the dialog scrolls with no horizontal overflow; Settings shows the same field, wording, and Forget key. Not run: 200% zoom, a real screen reader, a real Gemini request.
- Next action: on approval, push and open the PR with the `open-pr` skill (P-05). Closing #36 relies on `Closes #36` in the PR body; the branch is not linked from the issue's Development sidebar.
- Pending **P-05**: push `feat/gemini-key-dialog` and open its PR (title and body shown for approval on 2026-10-21). Why: pushing and opening a PR need approval. Blocks: review and CI for #36.

## Ranked work

1. [#36 — Ask for a Gemini API key in a guided dialog when generating without one](https://github.com/pomodorozhong/extensive-reading-assistant/issues/36) — built on `feat/gemini-key-dialog`, awaiting push and PR (P-05).
2. [#45 — Story View keeps showing the previous story when only the URL's story ID changes](https://github.com/pomodorozhong/extensive-reading-assistant/issues/45) — small bug with a likely `key={id}` fix.
3. [#46 — Explain the vocabulary levels on New Story and link to an online level test](https://github.com/pomodorozhong/extensive-reading-assistant/issues/46) — "i" button and dialog after **Vocabulary level**; pick the external test during implementation.
4. [#47 — Build an in-app reading level check to replace the external level test](https://github.com/pomodorozhong/extensive-reading-assistant/issues/47) — blocked by #46; needs an owner choice of method and reviewed content.
5. [#18 — Improve Gemini BYOK security for hosted users](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18) — #37, #39, and #40 merged; left: a dedicated hostname or documented origin-sharing risk, and a `main` ruleset requiring the Checks status (owner setting).
6. [#24](https://github.com/pomodorozhong/extensive-reading-assistant/issues/24) follow-up — #38 merged without the screen-reader and mockup checks; confirm whether those still need doing.
7. Dependabot PRs [#41](https://github.com/pomodorozhong/extensive-reading-assistant/pull/41)–[#44](https://github.com/pomodorozhong/extensive-reading-assistant/pull/44) — major Action bumps; review before merging.
8. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — needs reviewed starter content chosen by the owner.
9. [#17 — Add onboarding for the extensive reading workflow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/17) — can now explain key storage (#39 merged).
10. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — organize growing collections after reading-state metadata is available.
11. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
12. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — follows credential and core-flow stabilization.
13. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after the reading loop and recovery are dependable.

## Pending

- **P-03** Delete merged local branches and leftover local files: branches `stack/new-story-reliability`, `feat/new-story-draft-persistence`, `fix/new-story-recovery-states`, `fix/dictionary-inflected-lookup`, `fix/restrict-gemini-endpoint`, `docs/refresh-handoff-and-docs`, `codex/new-story-generation-options` (PRs #30–#35 merged), and `chore/verify-new-story-m1` (handoff-only, unpushed; its handoff now lives on `feat/gemini-key-dialog`), plus the Git-excluded folders `.agents/propose-stack/new-story-reliability/` and `.agents/propose-stack/m1-verify-and-byok-hardening/`. Approved by the owner on 2026-10-21, but the session's permission mode refused the deletions; the owner runs them. Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks. Blocks: nothing.
