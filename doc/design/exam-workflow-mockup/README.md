# Exam workflow mockup

Design reference only: nothing here is implemented in the app.

[`exam-workflow-prototype.html`](exam-workflow-prototype.html) is an interactive prototype from the designer, 啟平, received in October 2026. To try it, download the file and open it in a browser. It runs offline with sample stories and questions, needs no Gemini key, and keeps its demo progress in `localStorage` under its own key (**Settings → Reset demo progress** clears it).

## Scope

The designer built the mockup around exams and asked that its Vocabulary screen, the **Dictionary** page (`#dictionary`), be ignored. Ignore its layout and behavior. The Exam tab's **From my Dictionary** source, which draws on the saved words, is still part of the exam flow.

The rest of the design is still worth adapting, even beyond exams: the header and navigation, the cards, the segmented controls, the end-of-story card, the quiz and results pages, and the Settings layout.

## Proposed flows

- **Reading comprehension after a story.** Finishing a story opens a short multiple-choice exam about that article, which the reader can skip. The results show the score and review each answer with an explanation. A Settings switch, **Offer an exam after each story**, turns this on or off.
- **Vocabulary exam on its own Exam tab.** The reader picks a question source (words from all past stories, or only saved words), chooses 5 or 10 questions, and answers random definition questions. The results offer a retake and practice on the missed words. This tab works regardless of the Settings switch.

## Differences from the current app

- The navigation adds **Exam** and names the word page **Dictionary** instead of Vocabulary.
- In the prototype, words are saved with an explicit **Save word** button. In the app, any word the reader looks up is tracked as unknown until marked as known.
- Story View adds a sidebar listing the words in the story, and an end card with **Finish reading**.
- My Stories shows reading progress (stories read, saved words) and each story's last comprehension score.
- Every story and question is a hard-coded sample. Generating questions with Gemini, and saving exam results, would both need design work.
