# Mockup from 美幸, 2026-11

Design reference only: nothing here is implemented in the app.

[`extensive-reading-prototype.html`](extensive-reading-prototype.html) is an interactive prototype from the designer, 美幸, received on 2026-11-13. To try it, download the file and open it in a browser. It needs no Gemini key: story generation and the API key setup are simulated, every story shows the same sample text, and saved stories, history, and words are kept in `localStorage` under `tw-` keys.

## Stale: New Story

Ignore the **New Story** home screen and its **Advanced options** dialog. The team has already iterated on New Story over several rounds in the design meeting of the week of 2026-11-09, so the app's current home screen supersedes this one.

## Main design references

- **Story View reading tools.** The toolbar above the story: **A−** and **A+** to change the text size, a font menu (Serif, Sans, Monospace), and **Save story**. Beside the story, the **Vocabulary** panel has two modes, switched by a toggle: **Reading mode** keeps the meanings of the collected words hidden, and **Review mode** shows them. On phones, a bar at the bottom shows reading progress and a **Review words** button that switches the mode.
- **The "Which level should I choose?" dialog.** Opened from **How can I choose?** next to the vocabulary level. Use its layout for the level introductions: the six levels A1–C2 in a two-column list, each with a one-line description, followed by a tip ("If you keep stopping to look up words, try a lower level") and the entry to the level check.
- **The story list in My Stories.** Saved stories sit in a grid, and a **History** row below lists every story generated recently, including ones never saved, in one horizontal scroll area with cards that snap into place.

## Differences from the current app

- Story View has no text size or font controls.
- In the app, tapping a word opens its meaning in a Dictionary card or note, and **Mark as unknown** tracks it. In the prototype, tapping a word collects it in the panel, and its meaning is shown only in Review mode.
- My Stories lists only saved stories; generated stories that were never saved are not kept.
- The app's reading level check asks which words the reader knows. The prototype's check asks six multiple-choice questions about short passages instead.
