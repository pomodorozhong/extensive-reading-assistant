# Development

How to run, test, verify, and deploy the app. For what the app does, see the [README](../README.md) and [Features](features.md).


## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

Build a production bundle with `npm run build`. Preview it with `npm run preview`.

Run `npm run test:dictionary` to check that inflected words such as *met*, *children*, and *happier* find their base-form definitions, and that a word a story writes in lowercase, such as *banks*, finds the base word rather than a name. It rebuilds the bundled WordNet files first.

## Verify generation without a live API

Run `npm run test:generation` for mocked request, parsing, persistence, legacy-story, and credential-exclusion checks. No Google requests are made by these tests.

The generation tests give each test a fresh in-memory `localStorage` Map and replace `fetch` with a controlled response. Reuse this pattern for draft and recovery checks so tests stay isolated and cannot send a real provider request.

For a complete browser walkthrough, start these in separate terminals:

```bash
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
npm run dev:gemini-fixture
```

Use a disposable browser context at `http://127.0.0.1:5174`. In Settings, set the API base URL to `http://127.0.0.1:5175/v1beta` and the API key to the synthetic value `era-local-fixture`. Return to New Story, choose a topic, a text type, B1, and 5 min, then select Generate Story. Story View should open **Generation options fixture** at B1, with text confirming the received topic, text type, tone, point of view, level, 5-minute request, and 400–600-word target. Reload to verify the saved story, then try other lengths. The loopback fixture accepts only the synthetic key and never forwards requests. It returns a short diagnostic story, not a sample of Gemini quality or requested length.

## Content Security Policy

Production builds (`npm run build`) add a Content Security Policy `<meta>` tag defined in `vite.config.ts`. It allows scripts only from the app itself, blocks inline scripts, and lets the page connect only to its own origin and Google's Gemini API, so injected code cannot send a stored key elsewhere. Styles allow inline attributes because Radix Themes and React use them. The development server has no policy because Vite injects inline scripts for hot reload. A `<meta>` policy cannot set `frame-ancestors`; that needs a response header, which GitHub Pages does not allow.

To check it, run `npm run build && npm run preview` and watch the browser console for Content Security Policy errors while reading a story, looking up a word, and opening each page.

## GitHub Pages

This repo deploys the production build with GitHub Actions. Hash-based routes (`#/stories`, `#/settings`) work on Pages without extra rewrite rules. The Vite `base` path is set automatically from the repository name.

1. Push to `main` (or run the **Deploy to GitHub Pages** workflow).
2. In the GitHub repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. After the workflow succeeds, the site is at `https://<user>.github.io/<repo>/`.

Every pull request runs the **Checks** workflow: `npm run lint`, `npm run build`, and the six `test:*` suites. Run all six locally before pushing, even ones that look unrelated: `test:level-check` also builds New Story drafts, so a new generation choice can break it. A deploy runs the same checks first and stops if any fail. Third-party actions are pinned to full commit hashes, and Dependabot proposes updates to them weekly. To block merging until the checks pass, require the **Checks** status in a branch ruleset for `main` (a repository setting, not part of this code).

To override the asset base path, set `VITE_BASE` (for example `/` for a custom domain at the site root).
