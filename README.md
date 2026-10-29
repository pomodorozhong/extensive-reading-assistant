# Extensive Reading Assistant

Read stories written at your level, and look up only the words you need.

Extensive reading means reading lots of easy, enjoyable text. This web app helps with that. Pick your level (A1–C2 on the CEFR scale), and it writes a story for you with Google's Gemini. If you meet an unfamiliar word, tap it to see a short definition right below the line, then keep reading.

## What you can do

- **Generate a story at your level.** Choose a level, a reading length (5, 10, or 15 minutes), and optionally a topic, a text type (a fable, a diary, a news report, an opinion essay, and more), a tone, and a point of view.
- **Look up words as you read.** Tap a word to see its meaning. Definitions come from [Princeton WordNet](https://wordnet.princeton.edu/), which is bundled with the app, so they are not made up by the AI.
- **Keep track of new words.** Words you look up are marked as unknown. The **Vocabulary** page collects them from all your stories, grouped by level, with the sentence where you met each one. Mark a word as known once you've learned it.
- **Find your level.** Not sure where to start? The reading level check asks which words you know and suggests a level.
- **Read offline.** Install the app on your phone or computer, and saved stories work without an internet connection.

## Get started

1. Open the app. A short introduction walks you through it.
2. Get a free [Gemini API key](https://aistudio.google.com/apikey) from Google AI Studio and paste it in **Settings**.
3. Go to **New Story**, choose your level, and select **Generate Story**.

You need an internet connection to generate a story, but not to read one.

## Your data stays on your device

There is no account and no server. Your stories, word lists, and settings are saved in your browser only. They don't sync between devices, and clearing your browser data deletes them.

Your API key is sent only to Google's Gemini API, and only when you generate a story. Use a key made just for this app, and set a spending limit in Google Cloud to be safe. If you'd rather not store the key, turn off **Remember key on this device** in Settings.

## Learn more

- [Features](doc/features.md): how every part of the app works, in detail.
- [Development](doc/development.md): run the app locally, run the tests, and deploy to GitHub Pages.
- [Documentation index](doc/README.md): the product spec, implementation notes, and verification guides.

## License

The code is under the [MIT License](LICENSE). The bundled CEFR vocabulary data has its own terms, including CC BY-SA 4.0. See [data/cefr/README.md](data/cefr/README.md).
