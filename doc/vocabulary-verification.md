# Vocabulary verification

Use a disposable browser profile so these steps do not overwrite personal stories. Start the app with `npm install` and `npm run dev`, then open the Vite URL. No API key is required. These steps assume the default local asset base `/`.

In the browser developer console, seed three saved stories and reset the disposable Vocabulary collection:

```js
const stories = await (await fetch('/tests/fixtures/vocabulary-stories.json')).json()
localStorage.setItem('era.v1.stories', JSON.stringify(stories))
localStorage.removeItem('era.v1.vocabulary')
location.hash = '#/vocabulary'
location.reload()
```

1. Open Vocabulary from Home and navigation at desktop and mobile widths. Expect one `Cat` entry with two sources: **The Window** / **A small animal.** and **The Rug** / **A pet that purrs.** Each source has its own sentence. `zorblax` remains visible with **No definition saved.**
2. Follow each `Cat` source link. Expect the correct story and the first occurrence of that word to receive focus and scroll into view. Click it to see its saved definition. Mark `Cat` known only in **The Window** and reopen Vocabulary: **The Rug** keeps the entry. Clear the remaining source and expect `Cat` to disappear. Looking up `Cat` again adds it back.
3. Reseed using the console block above. Simulate removal of **The Window** in the disposable profile (the app currently has no story deletion control):

   ```js
   localStorage.setItem('era.v1.stories', JSON.stringify(
     JSON.parse(localStorage.getItem('era.v1.stories')).filter(story => story.id !== 'vocabulary-cat-window')
   ))
   location.reload()
   ```

   Expect `Cat` to retain both definitions and sentences. **The Window** has a **Story removed** label and no broken source link; **The Rug** still links to its occurrence. Mark `Cat` known only in **The Rug** and reopen Vocabulary: the removed source still keeps `Cat` tracked.
4. Choose **Mark as known** on `Cat` in Vocabulary. Expect the entry to disappear and all remaining saved stories to mark `cat` known. Reload to confirm it remains cleared. Choose the same action for `zorblax` and expect the explanatory empty state.
5. Reseed, remove all stories with `localStorage.removeItem('era.v1.stories')`, and reload. Expect both words with their saved context and **Story removed** labels. Clear them in Vocabulary, reload, and expect the empty state.
6. Reseed and enable **Settings → Debugging → Show CEFR fixture articles in My Stories**. Open **A small garden** in My Stories and look up `garden` and `cat`. Open Vocabulary: expect `garden` with a **Debug fixture** source link and `Cat` with both saved-story and fixture sources. Follow the fixture link to check occurrence focus.
7. Turn the fixture option off and reopen Vocabulary. Expect `garden` to disappear and `Cat` to keep only its saved-story sources. Reload to confirm. Turn fixtures on again: both fixture sources return with their saved definitions.
8. With fixtures on, mark `Cat` known in Vocabulary. Expect it to clear from both saved and fixture stories and stay cleared after toggling off/on. A word marked known while fixtures are hidden affects only saved stories; an unknown fixture source reappears when enabled again.
9. Reseed, then add a third source with the same definition as **The Window**:

   ```js
   const duplicateStories = JSON.parse(localStorage.getItem('era.v1.stories'))
   duplicateStories.push({ ...duplicateStories[0], id: 'vocabulary-cat-door', title: 'The Door', body: 'A cat stood by the door.' })
   localStorage.setItem('era.v1.stories', JSON.stringify(duplicateStories))
   location.reload()
   ```

   Expect **A small animal.** once above the sentences and links for **The Window** and **The Door**. **A pet that purrs.** remains a separate definition with **The Rug** as its source. Follow all three links and confirm their occurrence focus. Missing definitions still show their own unavailable group.

Automated checks: `npm run test:vocabulary`, `npm run test:cefr`, `npm run lint`, and `npm run build`.
