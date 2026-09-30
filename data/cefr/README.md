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

Words are Unicode letter sequences with optional internal straight or curly apostrophes. Punctuation, symbols, and numbers do not count. Hyphens split words. Every original occurrence counts once, including repetitions and contractions. Percentage = above-level occurrences / all analyzed word occurrences × 100; zero words gives 0%. Unlisted words remain in the denominator and are reported separately, never inferred to be within or above level. Display rounds to one decimal place.

Case is ignored. Names are treated like ordinary words: a listed name receives that entry's level, and an absent name is unlisted. There is no capital-letter heuristic, so sentence-initial words are not silently excluded.

Exact entries take precedence over inflection rules. Common irregular forms and regular plural, past, progressive, comparative, superlative, and possessive patterns are checked against the dataset. Contractions expand into components; the hardest component determines the original occurrence's level. If any component is unlisted, the whole contraction is unlisted. Pronoun `'s` is approximated as `be` (is/has are A1); `'d` as `would` (would/had are A1). These rules are approximate: they can miss rare inflections or match an unrelated lemma. They are not a contextual lemmatizer.

Multiword expressions, part of speech, word sense, grammar, idioms, and sentence complexity are not assessed. Choosing the lowest level can understate a difficult sense. The profiles are finite learner vocabulary lists and contain omissions and inaccuracies; they do not certify CEFR proficiency. Unlisted words and names can dilute the percentage, so always read it alongside the unlisted count. Readers can save and read flagged stories normally.

## Reproducible verification

Use Node.js 22.18 or newer (native TypeScript stripping) for `npm run test:cefr`. Run `npm run lint` and `npm run build` too.

For browser verification on a disposable local profile:

1. Run `npm install` and `npm run dev`; open the printed local URL.
2. Copy `tests/fixtures/cefr-stories.json` into a DevTools variable named `fixture`. Load it using `localStorage.setItem('era.v1.stories', JSON.stringify(fixture.stories))` and `localStorage.setItem('era.v1.settings', JSON.stringify(fixture.settings))`.
3. Open `/#/stories/cefr-fixture`. Expect A1, 37.5% (3 of 8), `concur × 2` at C1, `ephemeral × 1` at C2, and `zorblax × 1` unlisted. Settings is C2 with no key; the saved report must still use A1.
4. Change Settings and reopen the story. The report must remain A1. Word marking and reading must remain available.
5. With a Gemini key, select a generation level and generate a story. Confirm the saved level and report use that selection. Flagged content must remain saved and readable.
6. Run `VITE_BASE=/extensive-reading-assistant/ npm run build`, then `VITE_BASE=/extensive-reading-assistant/ npm run preview`. Load `/extensive-reading-assistant/#/stories/cefr-fixture` after seeding the preview origin with the same fixture. Allow service-worker activation, go offline, and reload. The saved report must still render without a key. Dev mode does not enable the production service worker.
