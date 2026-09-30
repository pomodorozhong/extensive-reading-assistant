# Bundled CEFR vocabulary

For the complete algorithm walkthrough, Mermaid flowcharts, and related implementation files, see [How CEFR vocabulary validation works](../../doc/cefr-vocabulary-validation.md).

Source: [Open Language Profiles — English datasets from CEFR-J](https://github.com/openlanguageprofiles/olp-en-cefrj), pinned at commit `d4e45b75b38f27b30dfc5c44d8c571aec7e7092f`.

- **CEFR-J Wordlist Version 1.5** (A1–B2), compiled by Yukio Tono, Tokyo University of Foreign Studies. Upstream retrieved it from <http://www.cefr-j.org/download.html> on January 20, 2020. Copyright belongs to Tono Laboratory at TUFS. Upstream permits research and commercial use without charge with proper citation; retain this attribution and the source terms when redistributing.
- **Octanove Vocabulary Profile C1/C2 Version 1.0**, created by Octanove Labs, licensed under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). The original CSV and derived combined JSON carry this attribution; the combined JSON is distributed under CC BY-SA 4.0. Dataset permissions are separate from the app's code license. See the bundled legal code and upstream terms.

The source CSVs retain all rows and fields, with line endings normalized to LF and trailing whitespace removed for repository checks. Upstream CSV SHA-256 values before that whitespace normalization:

```text
b0dd3c635f1c9a4fdf1490c7e5b7c48e8bbe55b652ad0c9860a95f98e10ae498  cefrj-vocabulary-profile-1.5.csv
18c33a407f2f89f7b8de9671c6d45fe3ea0bce45e7d2d7dcaab48d73e0f7b380  octanove-vocabulary-profile-c1c2-1.0.csv
```

Run `npm run build:cefr` to rebuild `src/data/cefr.json` from these local files. The transformation lowercases entries, normalizes curly apostrophes, splits slash alternatives, and chooses the lowest listed level for duplicate headwords across parts of speech and profiles. The output has 8,845 entries, including phrases. No dataset download occurs at build time or during validation. Vite bundles the JSON into app JavaScript, which the existing PWA service worker precaches.

## Calculation and limitations

The report examines the story body against its recorded level (the Settings level captured for generation), not its title or current Settings. A1 is included in A2, A1–A2 in B1, and so on through C2.

Words are Unicode letter sequences with optional internal straight or curly apostrophes. Punctuation, symbols, and numbers do not count. Hyphens split words. Each original occurrence counts once, including repetitions and contractions; detected person-name occurrences are counted separately and excluded from analysis. Percentage = above-level occurrences / all analyzed word occurrences × 100; zero analyzed words gives 0%. Unlisted words remain in the denominator and are reported separately, never inferred to be within or above level. Display rounds to one decimal place.

Vocabulary lookup ignores case after person-name detection. Undetected names are treated like ordinary words: a listed name receives that entry's level, and an absent name is unlisted. Capitalization alone does not exclude sentence-initial words.

Before lookup, compromise detects person-name spans in the original text. Word occurrences within those spans are shown separately and excluded from the vocabulary percentage. Detection is approximate and can miss names, including pet names, or misidentify ordinary words. Undetected names still undergo normal lookup.

Exact entries take precedence over lemmatization. After spelling aliases and possessive handling, wink-lemmatizer supplies verb, noun, and adjective candidates, in that order; a candidate must exist in the CEFR dataset. The plural pronoun `others` has a reviewed `other` alias. Contractions expand into components; the hardest component determines the original occurrence's level. If any component is unlisted, the whole contraction is unlisted. Pronoun `'s` is approximated as `be` (is/has are A1); `'d` as `would` (would/had are A1). Morphology does not use contextual part-of-speech disambiguation and may select an unrelated lemma. Both npm dependencies are MIT-licensed and bundled for offline analysis.

After exact lookup, a reviewed spelling-alias table maps `tranquillity` to the existing C1 `tranquility` entry. wink-lemmatizer resolves forms such as `met → meet` (A1), `became → become` (A1), `understood → understand` (A2), and `sat → sit` (A1). These reuse bundled levels rather than inventing new levels or inheriting levels across derived words. The [fixture coverage audit](../../doc/cefr-vocabulary-validation.md#fixture-coverage-audit) records the remaining gaps and criteria for supplemental data.

Multiword expressions, part of speech, word sense, grammar, idioms, and sentence complexity are not assessed. Choosing the lowest level can understate a difficult sense. The profiles are finite learner vocabulary lists and contain omissions and inaccuracies; they do not certify CEFR proficiency. Unlisted words and undetected names can dilute the percentage, so always read it alongside the unlisted and excluded-name counts. Readers can save and read flagged stories normally.

## Reproducible verification

Use Node.js 22.18 or newer (native TypeScript stripping) for `npm run test:cefr`. Run `npm run lint` and `npm run build` too.

For browser verification on a disposable local profile:

1. Run `npm install` and `npm run dev`; open the printed local URL.
2. Copy `tests/fixtures/cefr-stories.json` into a DevTools variable named `fixture`. Load it using `localStorage.setItem('era.v1.stories', JSON.stringify(fixture.stories))` and `localStorage.setItem('era.v1.settings', JSON.stringify(fixture.settings))`.
3. In Settings → Debugging, enable **Show approximate vocabulary difficulty (debugging)**. Open `/#/stories/cefr-fixture`. Expect A1, 37.5% (3 of 8), `concur × 2` at C1, `ephemeral × 1` at C2, and `zorblax × 1` unlisted. Settings is C2 with no key; the saved report must still use A1.
4. Change Settings and reopen the story. The report must remain A1. Word marking and reading must remain available.
5. With a Gemini key, select a generation level and generate a story. Confirm the saved level and report use that selection. Flagged content must remain saved and readable.
6. Run `VITE_BASE=/extensive-reading-assistant/ npm run build`, then `VITE_BASE=/extensive-reading-assistant/ npm run preview`. Seed the preview origin with the same fixture, enable the report switch there, and load `/extensive-reading-assistant/#/stories/cefr-fixture`. Allow service-worker activation, go offline, and reload. The saved report must still render without a key. Dev mode does not enable the production service worker.
