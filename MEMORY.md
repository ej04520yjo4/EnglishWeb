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
- Local keys: `yingju-progress-v1`, `yingju-settings-v1`, `yingju-course-rows-v3`, and isolated temporary session key `yingju-daily-session-v2`; legacy daily-session v1 records are discarded.
- Related-vocabulary topics use `public/data/vocabulary-groups-v1.json`; missing non-course words use `public/data/reference-vocabulary-v1.json`.
- Related-vocabulary version 1 contains days of the week, times of day, months, and family members.
- Months and family members are the second trial batch and still require user review; new gaps remain reference-only until reviewed.
- A2 pilot source `public/data/a2-course-v1.csv` contains 4 units, 16 lessons, and 95 occurrences; unit 1 remains the original 4 lessons and 25 occurrences.
- A2 units 2–4 cover travel/transportation, shopping/comparison, and health/advice. All remain `pilot_review_required`.
- B1 pilot source `public/data/b1-course-v1.csv` contains 8 units, 32 lessons, and 249 occurrences.
- B2 pilot source `public/data/b2-course-v1.csv` contains 8 units, 32 lessons, and 298 occurrences.
- B1 and B2 each include 32 recognition exercises, 64 transfer examples, 32 text responses, 8 four-sentence passages, and 32 comprehension questions.
- B1/B2 source data remains structurally validated and `pilot_review_required`, but both catalog entries are `disabled`; startup, selectors, and advanced preview must not load them.
- `docs/a2-curriculum-blueprint.md` reserves ten A2 units, but units 5–10 have no formal CSV/JSON data.
- Finishing current A2 pilot content must never mark the complete A2 level passed or unlock B1.
- Progress schema v6 stores course levels separately and adds global A1/A2 `vocabularyProgress`; old v3/v4/v5 data migrates without inventing mastery.
- The A1/A2 vocabulary goal is 3000 cumulative canonical lexemes: 1500 active and 1500 receptive. A1's cumulative subgoal is 1200: 700 active and 500 receptive.
- The current target file is intentionally partial and contains 126 sourced baseline entries: 100 active curriculum-covered candidates and 26 receptive reference-only candidates. A1/A2 contains 102 union curriculum lexemes; lesson-specific names Amy and Ben are intentionally excluded from the general-vocabulary target.
- Occurrences, word forms, senses, and chunks are not separate lexemes for target counting.
- Receptive mastery requires two correct recognition records on two dates. Active additionally requires two clean spelling records on two dates plus one correct application; reveal and paste cannot create clean spelling evidence.
- A study date means the learner device's local calendar day. New evidence stores that date beside the ISO timestamp so later timezone changes or imports do not reinterpret it.
- Daily Learning v2 stores its originating CEFR level and completed weakness lexeme IDs. It restores only an exact valid lesson and the first unfinished same-day weakness item; restore never creates evidence, completion, unit pass, or CEFR pass, and finishing the summary removes the temporary record.
- “本週學習” means unique selected-level study dates inside the learner device's local Monday-to-Sunday week; it is not a rolling seven-record count and does not use global vocabulary evidence dates.
- The 126-entry metadata QA found no duplicate or rejection, but provenance remains unresolved: all 126 need license evidence and 26 reference-only targets need a lexical/content source plus user language/phonetic review.

## Content and Audio Guardrails

- Do not scrape Oxford, Cambridge, or other protected dictionaries.
- Audio must be free/open or generated under recorded legal terms.
- Retain source, author, license, voice/model, version, date, speed, and QA status.
- `audio_status !== "ready"` must never be treated as a playable URL.
- KK phonetic-symbol audio is a separate learning area, not KK notation added to A-Z letter practice.
- Keep sentence casing in `answer` while treating case variants such as `My/my` and `The/the` as the same lexeme.
- Formal course data remains primary for progress, occurrences, audio, and source metadata. Explicitly opening a reference detail records exposure only; it never counts as course completion, recognition, spelling, application, or a review-schedule change.
- Vocabulary target expansion must use small deduplicated batches with recorded source version, reference, and license. Do not copy protected lists or generate filler to reach 3000.
- Related-vocabulary cards display canonical lemmas and may use a validated group-level Traditional Chinese override; course answers remain occurrence-specific.
- A related-vocabulary shortcut is safe only after the current A1 word has been answered correctly.

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
- Use `npm run verify` for the shared local/CI quality gate; `npm test` adds Playwright.
