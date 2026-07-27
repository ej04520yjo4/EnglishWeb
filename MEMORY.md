# Project Memory

This file stores long-lived product facts and working preferences. Current task state belongs in `PROGRESS.md` and `TASKS.md`.

## Product and Learner

- Product name: 英句練習.
- Primary user is currently the creator; no publishing, account, or age-segmentation requirement drives the MVP.
- The first production level is CEFR A1.
- Main goal: practical everyday American English, especially sentence fluency, spelling recall, and distinguishing similar words.
- Primary environment: Windows 11 Chrome on desktop. Mobile browser support remains required.
- Interface language: natural Traditional Chinese used in Taiwan.

## Non-Negotiable Learning Rules

1. Ordinary recall asks for one English word per input.
2. Multiword chunks retain whole meaning and notes but do not automatically become one answer box.
3. Function words may use grammar/context prompts instead of false one-to-one Chinese translations.
4. Three unsuccessful attempts must reveal enough help or the correct answer; the learner must not become permanently stuck.
5. Enter performs the page's primary safe action, and a new input stage focuses the first editable field.
6. `context_pos` is the displayed part of speech. Progress keys use `lexeme_id`; `sense_id` separates contextual meanings; `sentence_pattern_id` tracks structures.
7. New exercises may use only lexemes/chunks taught by that lesson unless explicitly marked as reviewed challenge content.
8. Completed lessons remain replayable. Completion, passing, and mastery are separate concepts.

## Course and Data Facts

- Hierarchy: Level -> Unit -> Lesson -> Stage -> Exercise.
- A1 v3 contains 8 units, 32 lessons, and 145 word occurrences.
- Official source: `public/data/a1-course-v3.csv`.
- Reviewed additions: `public/data/a1-pattern-exercises.json` and `public/data/a1-reading-exercises.json`.
- Unit 8 passage order:
  1. `I get up at seven.`
  2. `I eat breakfast at home.`
  3. `I go to work at eight.`
  4. `I go to work by bus.`
- Local keys: `yingju-progress-v1`, `yingju-settings-v1`, and `yingju-course-rows-v3`.

## Content and Audio Guardrails

- Do not scrape Oxford, Cambridge, or other protected dictionaries.
- Audio must be free/open or generated under recorded legal terms.
- Retain source, author, license, voice/model, version, date, speed, and QA status.
- `audio_status !== "ready"` must never be treated as a playable URL.
- KK phonetic-symbol audio is a separate learning area, not KK notation added to A-Z letter practice.
- Keep sentence casing in `answer` while treating case variants such as `My/my` and `The/the` as the same lexeme.

## Context Engineering Preferences

- The eight root context files are the preferred project memory and take precedence over reconstructed chat history.
- Read the context before coding; update it after verified work.
- Keep one active milestone and one concrete next step.
- Start a new conversation after completing a milestone or changing problem domains.
- New conversations must read the context files instead of asking the user to repeat settled facts.
- Record durable reasoning in `DECISIONS.md`, not only in commit messages or chat.

## Communication Preferences

- Make changes directly when scope is clear.
- Preserve the existing simple, Duolingo-like visual direction unless redesign is explicitly requested.
- Report concrete outcomes and actual test results in Traditional Chinese.
- Do not describe unverified work as complete.
