# Handoff

Last verified: 2026-11-12 (Asia/Taipei).

## In progress

### feat/curated-starter-stories

- Task: [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27). Local branch carrying only an old handoff commit; not linked to #27. Rebuild it from `main` (or create a fresh branch from the issue) when starting the code.
- PR: none yet.
- Code checkpoint: none; no code yet.
- State: content chosen, code not started. The owner picked four starter stories, one per level A1–B2: *My New Friend* (A1 diary), *My New Pen Pal* (A2 letter), *The Whispering Books* (B1 short story), and *The Ghost in My Pocket* (B2 reflective essay). Their full text, generation settings, and prompts are in the [#27 handoff comment](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27#issuecomment-6520784916); a local copy may exist in the untracked `.claude/starter-stories-chosen.json`.
- Decisions: about 2 minutes each (160–240 words); no closing "THE END."; keep each story's generation record (#69) so Story View's provenance card (#71) shows how it was made.
- Not decided: how to label 2-minute reading time, since `ReadingMinutes` is 5, 10, or 15.
- Next action: after #76 and #77, plan the #27 PR with the owner (where starters live in code, entry points on Home and empty My Stories, the 2-minute label), and change `*Thump.*` to plain text in *The Whispering Books*.

### feat/new-story-search-home

- Task: [#81 — Simplify the New Story home screen to a Google-style search bar with topic chips](https://github.com/pomodorozhong/extensive-reading-assistant/issues/81). Local branch from `main` at `da997f7`, not pushed and not linked to #81.
- PR: none yet.
- Code checkpoint: `729fb0d` (`fix(new-story): close Options and lock its controls while generating`), after `13c8d0f` (the guide button) and `d93911d` (the search-bar home).
- State: the owner chose direction A from the design canvas (search bar, one row of topic + text type ideas, Generate Story, Options panel from a summary line). Built as approved, plus a text type list in Options so all 16 forms stay reachable, since the ideas cover only ten pairs. At the owner's request the introduction no longer opens by itself: a **How it works** button under Generate Story opens it as a guide, and Settings keeps **Show the guide**.
- Verification: lint, build and all seven test suites passed (generation 37, onboarding 5). In the in-app browser at 1280 × 800, 390 × 844 and 320 × 568: an idea sets topic and text type and saves the draft, shuffle shows the next three, Options changes length and text type and filters forms by level, Generate Story without a key opens the key dialog, no sideways page scroll, Generate visible at 320 × 568, the placeholder types out topics, no console errors. With storage cleared no popup opens, and How it works opens the guide with the new step 2 text. With a test key and a stalled request, starting generation with Options open closes the panel and Options stays disabled. Not checked in a browser: reduced motion (CSS and hook only), a real generation, offline and unsaved-story states (code paths unchanged).
- Pending: **P-24**: push this branch and open the PR that closes #81. Why: pushing is outward-facing. Blocks: the PR.
- Next action: get P-24 approved, then push and open the PR with the `open-pr` skill.

### feat/reading-and-vocabulary-exams

- Task: [#73 — Add reading comprehension and vocabulary exams from the exam workflow mockup](https://github.com/pomodorozhong/extensive-reading-assistant/issues/73). The PR fully resolves it (`Closes #73`). Implementation migrated from the closed experiment PR #80, without its visual redesign (no restyle, side panel, Save word button, Dictionary rename, My Stories grouping, or Settings sections).
- PR: [#82](https://github.com/pomodorozhong/extensive-reading-assistant/pull/82), open, Checks passed.
- Code checkpoint: `62faac0` on `main` `e837ad0` (exam logic, exam UI, docs, a Debugging switch that adds example words to Vocabulary, and exam-specific Gemini error messages).
- State: pushed and PR opened with the owner's approval; awaiting review and merge.
- Verification: 2026-11-12, `npm run lint`, `npm run build`, and all seven `test:*` suites passed (exam 8/8, cefr 23/23). The first two commits were also checked on their own. In the browser pane: vocabulary exam from both sources (including the too-few-words message), keyboard-only answering, results, practice on missed words, retake; Finish reading with the switch on and off; the no-key message; a full reading exam, saved result, and retake with a stubbed Gemini response; Read and score badges on My Stories; the example-words switch (on: 18 words in Vocabulary and a 10-question exam from them; off: Vocabulary empty again); no horizontal scroll at 375 px; no console errors.
- Not run: a reading exam against the real Gemini API.
- Next action: the owner reviews and merges the PR; afterwards remove this subsection.

### feat/search-home-layout

- Task: rework the New Story home screen at the owner's request: Generate Story inside the topic bar, a line of chips under it (level, length, and text type menus, plus a removable chip for each changed style option, with Options at the right end), topic ideas as cards below, and Options showing its style and model controls directly. No issue; the owner asked for the PR directly. Local branch from `main` at `a5af6f4`, not linked to any issue.
- PR: none yet.
- Code checkpoint: `2e35d62` (`feat(new-story): put Generate in the bar and the story choices in chips`), which also updates the README, the features doc, and the guide's second step.
- State: built and checked; awaiting approval to push. A trial that also put the creator at the end of Story View was dropped at the owner's request.
- Verification: 2026-11-12, `npm run lint`, `npm run build`, and all seven `test:*` suites passed (generation 37, onboarding 5). In the browser pane at desktop width and 375 × 812: Generate Story sits 6 px from the bar's top, right, and bottom (a 44 px circle on phones); the level, length, and text type menus change their values; the level menu opens the level guide; a level that doesn't offer the chosen form clears it and shows the note; tone, point of view, and sentence variety chips appear and their × resets each option; the chips stay on one line and scroll sideways with Options visible; idea cards set topic and type and scroll sideways on phones; no sideways page scroll; no console errors.
- Not checked: a real generation, the offline and unsaved-story states, and reduced motion in a browser.
- Pending: **P-27**: push this branch and open the PR. Why: pushing is outward-facing. Blocks: the PR.
- Next action: get P-27 approved, then push and open the PR with the `open-pr` skill.

### feat/story-view-side-dictionary

- Task: show the clicked word's meaning in a Dictionary card at the top of a Story View side panel, with the "Words in this story" list below it, following the exam workflow mockup (the side card added on the local `docs/mockup-side-dictionary` branch). At the owner's request, tapping a word now only shows its meaning and underlines the word in blue; **Mark as unknown** in the card or note tracks it and highlights it in yellow. No issue; the owner chose to open the PR without one.
- PR: none yet.
- Code checkpoint: `867abc3` on `main` `17849d5`.
- State: built and committed locally; awaiting the owner's approval to push and open the PR.
- Verification: 2026-11-12, lint, production build and all 115 tests passed. In the browser pane with the CEFR fixture articles: at 1280 and 1440 px a tapped word is underlined in blue, its meaning fills the side card, no note opens, and nothing is added to the list or Vocabulary; **Mark as unknown** turns every occurrence yellow, lists it, adds it to Vocabulary, and switches to **Mark as known**, which reverses it; ×, Escape and tapping again clear the card; a word with no entry shows Retry; the panel stays 80 px from the top while scrolling. At 940, 768, 375 and 320 px the note opens under the word with the same buttons, the list sits below the story, and nothing scrolls sideways. Resizing across 940 px with a word open moves its meaning between the card and the note. No console errors.
- Not checked: the slow-lookup spinner in the side card (it uses the same text as the note).
- Pending: P-01, push `feat/story-view-side-dictionary` and open its PR. Blocks the PR.
- Next action: on approval, push and open the PR; after it merges, remove this subsection.

### feat/story-view-topic-tone-chips

- Task: bring over the one part of the rejected 2026-11-05 redesign the owner wanted to keep (the topic and tone chips in Story View's header, from the closed PR #80 branch), restyled at the owner's request to follow the home page's chip order and style, and also shown on each My Stories card at the owner's request. No issue; the owner asked for the PR directly. Related to #87 (fixes its finding 4 for Story View) but does not resolve it, so the branch is not linked. Local branch from `main` at `82039a2`.
- PR: none yet.
- Code checkpoint: `931c045` (`feat(story-view): show the story's choices as chips under the title`), then the My Stories commit, which moves the chips into a shared `StoryChips` component; both update the features doc.
- State: built and committed; awaiting approval to push and open the PR. Under the title, Story View shows topic, level, length, and text type as soft gray pill badges, then tone in the accent color, then the Debug fixture and Read badges. My Stories cards show the same chips under the title and date, with Read and exam score badges on the right; the blue level badge is gone. Debug fixtures show no topic chip. The "How this story was made" card is unchanged.
- Verification: 2026-11-14, `npm run lint`, `npm run build`, and all seven `test:*` suites passed (cefr 23, vocabulary 19, generation 37, level-check 11, exam 8, onboarding 5, dictionary 12). In the browser pane with a story seeded in local storage: the chips match the home chips' computed size (24 px tall, 12 px weight-500 text, 8 px padding), they wrap at 375 × 812 with no sideways scroll, and there are no console errors. My Stories shows the full chip row for a story with every choice, only level and type for an older story, and only the level for debug fixtures; it fits at 375 × 812 with no sideways scroll.
- Not checked: a real generated story, a debug fixture in Story View, and a card with an exam score.
- Pending: **P-28**: push this branch and open the PR. Why: pushing is outward-facing. Blocks: the PR.
- Next action: on P-28 approval, push and open the PR with the `open-pr` skill; after it merges, remove this subsection.

### feat/two-minute-reading-length

- Task: add a 2-minute reading length (160–240 words) and make it the default for new stories, at the owner's request. Related to #27 (it settles the starter stories' 2-minute label) but does not resolve it, so the branch is not linked.
- PR: none yet.
- Code checkpoint: `448184a` on `main` `07d8f37`.
- State: built and committed locally; awaiting the owner's approval to push and open the PR. Drafts and stories with a valid saved length keep it; missing or invalid draft lengths fall back to 2 minutes.
- Verification: 2026-11-12, lint, production build and all 115 tests passed. In the browser pane with the local Gemini fixture: New Story opens at **A2 · about 2 minutes**, Options shows 2, 5, 10 and 15 min with 2 selected and "About 160–240 words", generating sends the 160–240 word target, and Story View's card shows "About 2 minutes" and "160–240 words". At 320 px the four-item length control fits without sideways scrolling.
- Pending: P-01, push `feat/two-minute-reading-length` and open its PR. Blocks the PR.
- Next action: on approval, push and open the PR; after it merges, remove this subsection and update #27's "Not decided" 2-minute label note.

## Ranked work

1. [#77 — Stop asking generated texts to end with THE END](https://github.com/pomodorozhong/extensive-reading-assistant/issues/77) — small and independent; the owner found the line no longer fits.
2. [#27 — Offer curated starter stories without requiring a Gemini API key](https://github.com/pomodorozhong/extensive-reading-assistant/issues/27) — the four starters are chosen; code remains.
3. [#56 — Add browser-local backup and restore with clear device and offline status](https://github.com/pomodorozhong/extensive-reading-assistant/issues/56) — all data lives only in `localStorage`; unblocks story deletion (#28) and the storage move (#60). The backup should include exam progress (`era.v1.progress`, from #73).
4. [#57 — Resume unfinished stories and offer an explicit completion flow](https://github.com/pomodorozhong/extensive-reading-assistant/issues/57) — reading position and finished state; blocks #28's status filters.
5. [#58 — Clarify the scope of Mark as known and add undo](https://github.com/pomodorozhong/extensive-reading-assistant/issues/58)
6. [#28 — Add search and filters for My Stories and Vocabulary](https://github.com/pomodorozhong/extensive-reading-assistant/issues/28) — blocked by #57.
7. [#59 — Audit dictionary senses and expressions for learner lookups](https://github.com/pomodorozhong/extensive-reading-assistant/issues/59) — do before #14.
8. [#60 — Add end-to-end tests and move library storage to IndexedDB](https://github.com/pomodorozhong/extensive-reading-assistant/issues/60) — blocked by #56; the end-to-end tests come first.
9. [#14 — Add static definitions adapted to the reader's CEFR level](https://github.com/pomodorozhong/extensive-reading-assistant/issues/14) — needs a dataset and license choice.
10. [#1 — Add an in-browser mini LLM alternative](https://github.com/pomodorozhong/extensive-reading-assistant/issues/1) — revisit after #27.
11. [#10 — Expose reading features through WebMCP](https://github.com/pomodorozhong/extensive-reading-assistant/issues/10) — most speculative; the spec is young.

[#18](https://github.com/pomodorozhong/extensive-reading-assistant/issues/18), [#61](https://github.com/pomodorozhong/extensive-reading-assistant/issues/61) (difficulty feedback after reading, from roadmap draft D9), and [#63](https://github.com/pomodorozhong/extensive-reading-assistant/issues/63) (reading-size controls and keyboard skip, from D7) are labeled `ideas` and are not planned.

## Pending

- **P-21**: delete the remote branch `fix/prefer-common-entry-over-name` once `feat/save-varied-sentences` (PR #79) merges; `2b84ba8` carries its only unmerged change. The user deleted the other 32 merged remote branches on 2026-10-30, and all merged local branches are deleted. Why: deleting remote branches is outward-facing, and the auto-mode safety check blocks it; the user can run it. Blocks: nothing.

Keep the untracked `.claude/launch.json`: it holds the preview configs used for browser checks.
