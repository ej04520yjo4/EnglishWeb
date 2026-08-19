# Changelog

This file records user-visible or contributor-visible project changes. Detailed implementation history remains in Git.

## 2026-08-20 - Active Daily Review and Session Lifecycle

### Changed

- Replaced the passive Daily Learning review list with up to five real spelling, recognition, or formal-sentence application questions selected from due reviews and existing evidence.
- Stored the fixed review queue, completed item IDs, reveal/paste safety state, and active study seconds in temporary Daily Session v3 state, so F5 resumes the first unfinished question without granting duplicate evidence.
- Changed 「今日時間」 to visible active learning time with lifecycle flushes, a five-minute idle cap per uninterrupted segment, and no offline-gap accumulation.

### Fixed

- Revalidate the learner's device-local date before resume, answer, continue, and finish actions; yesterday's open session now returns home without writing evidence, course completion, unit passing, or CEFR passing.
- Kept third-error spelling reveal as a required retype and blocked revealed or pasted answers from clean spelling evidence.

## 2026-08-19 - Daily Session Context Hardening

### Fixed

- Bound resumable Daily Learning sessions to their original CEFR level and exact lesson, removing the cross-level fallback that could open an unrelated course after switching levels.
- Stored completed weakness lexeme IDs in the temporary v2 session so F5 resumes at the first unfinished item; invalid or duplicate saved IDs are sanitized without creating learning evidence.
- Replaced the last-seven-record weekly display with one deduplicated device-local Monday-to-Sunday calculation shared by the home card and top bar.

### Preserved

- Progress remains schema v6; discarded v1 temporary sessions are not migrated into course completion, assessment results, CEFR passing, or vocabulary evidence.
- A1/A2 course data, B1/B2 runtime gating, vocabulary targets, and existing learning rules remain unchanged.

## 2026-08-19 - Learning Foundation Hardening

### Fixed

- Changed study-day and vocabulary-mastery evidence from UTC date slicing to the learner device's local calendar day, including Taiwan early-morning coverage.
- Made recall hints deterministic for every error: letter count, first letter with audio replay, then full-answer reveal and required retyping. Near-miss wording no longer skips a hint level.
- Preserved clean-spelling rules so revealed or pasted answers still cannot create productive mastery evidence.

### Added

- Persisted unfinished Daily Learning position under an isolated same-day localStorage record; F5/close resumes the next review, lesson, or weakness step, while stale days expire and completed summaries clear the record.
- Added a 126-entry vocabulary baseline review artifact and executable source-reference checks. No target was added, removed, or promoted; unresolved source/license and reference-only human review are recorded explicitly.
- Added `npm run verify` as the shared local and GitHub quality gate; `npm test` now adds the full Playwright matrix.

## 2026-08-19 - Learning UX Verification and Content QA

### Fixed

- Made third-attempt recall reveal authoritative even when the spelling is a near miss, then required the learner to retype the shown answer without granting clean spelling evidence.
- Added repeated-Enter protection to the remaining weakness and assessment text inputs, completing the guard across learning flows.
- Centralized left/right and empty-box Backspace boundary behavior for recall and sentence input grids and added executable regressions.
- Made protected A1/A2 content hashes stable across LF and Windows CRLF checkouts without weakening the expected source hashes.
- Corrected the shared A1 `a` usage note so `I have a pen.` no longer refers to the book-specific measure word.

### Verified

- Re-audited all 32 A1 lessons/145 occurrences and 16 A2 lessons/95 occurrences together with transfer, recognition, response, passage, and comprehension content.
- Found no core-sentence grammar, person, or translation error that required changing an A1/A2 sentence or stable ID.
- Kept B1/B2 runtime-disabled and added no course, level, topic, or progress-schema feature.

## 2026-08-11 - Learning Input UX Polish

### Changed

- Reviewed the current A1/A2 core and exercise-facing English; no protected course sentence required a grammar correction in this pass.
- Prevented held/repeated Enter key events from advancing through more than one learning step.
- Added cross-box left/right arrow navigation (plus existing empty-box Backspace behavior) for word and sentence input grids.
- Reworked recall screens so the learner prompt is visually dominant, the answer input is second, and audio/status text is secondary.
- Simplified the post-answer word detail to the selected phonetic system and contextual part of speech, with secondary linguistic metadata collapsed under `更多字詞資訊`.
- Removed internal lexeme/sense identifiers from the normal learner-facing detail screen.


## 2026-08-09 - Daily Learning 2.0 and Focused Weakness Practice

### Added

- Added a resumable daily learning session that runs due review, one current lesson, up to three weakness drills, and a daily completion summary in a deterministic order.
- Added direct weakness practice from the weakness center with focus-specific spelling, recognition, and sentence-application exercises.
- Added daily summary counters for elapsed time, review items, lesson completion, weakness drills, and vocabulary mastery gains.
- Added desktop/mobile browser coverage for starting a daily session and launching a real weakness drill after a spelling error.

### Preserved

- Daily-session completion does not mark lessons, units, or CEFR levels as passed by itself.
- Revealed answers and pasted spelling do not create clean mastery evidence.
- Progress schema remains v6; the daily session is intentionally temporary UI state rather than a new persisted completion system.

## 2026-07-31 - A1/A2 Vocabulary 3000 Foundation

### Added

- Added a sourced, partial A1/A2 canonical vocabulary target contract with cumulative 1200/3000 goals.
- Added a 126-entry baseline: 100 curriculum-covered active candidates and 26 reference-only receptive candidates.
- Added vocabulary target validation, baseline generation, audit, coverage reporting, and protected-source hash checks.
- Added progress schema v6 with global exposure, recognition, clean spelling, and application evidence shared across A1/A2.
- Added vocabulary coverage and personal mastery summaries to the learning-progress page.
- Added a home-page daily learning plan that prioritizes due review, the next lesson, and up to three evidence-backed vocabulary weaknesses.
- Added a weakness center that ranks only actually missed target lexemes and separates spelling, recognition, and application focus.

### Changed

- Disabled B1/B2 at runtime while retaining their CSV/JSON, generators, structural tests, and project-data audits.
- Renamed the persisted preview setting to `showAdvancedPilots`, while continuing to read legacy `showA2Pilot` backups.
- Related-vocabulary details now record exposure only when explicitly opened; browsing, search, audio, and rendering remain evidence-neutral.
- Receptive and active mastery now require repeated correct evidence across different study dates; revealed or pasted spelling cannot count as clean evidence.

### Preserved

- Protected A1/A2 CSV and exercise JSON files remain byte-for-byte unchanged.
- A1 remains 8/32/145 and A2 remains 4/16/95.
- Vocabulary progress does not unlock or pass a CEFR level.

## 2026-07-31 - B1 and B2 Pilot Curriculum

### Added

- Added independent B1 and B2 v1 pilot curricula with 8 units and 32 lessons per level.
- Added 249 B1 and 298 B2 one-word occurrences while retaining multiword chunk explanations.
- Added recognition, two transfer exercises, text response, passage rebuild, and comprehension data across both levels.
- Added B1/B2-specific unit tests and representative desktop/mobile Playwright learning flows.
- Added `npm run audit:project` for catalog-orphaned data, duplicate files and IDs, unsafe lesson repetition, generator-key collisions, and tracked build artifacts.

### Changed

- Extended the level catalog, common loader, validation, content management, and local progress from A1/A2 to A1/A2/B1/B2.
- Migrated saved progress to schema v5 while preserving legacy A1/A2 records and isolating B1/B2.
- Advanced QA preview can inspect A2, B1, or B2 without creating formal completion or passing prerequisites.
- The Playwright wrapper now forwards command-line filters consistently on Windows.

### Preserved

- A1 remains production at 8 units, 32 lessons, and 145 occurrences.
- A2 remains unchanged at 4 units, 16 lessons, and 95 occurrences.
- B1/B2 content and audio remain `pilot_review_required`/`pending` until manual review.

## 2026-07-28 - Stable A2 Mobile E2E Initialization

### Fixed

- Seeded A2 Playwright progress and settings before application JavaScript runs, removing the mobile hydration race caused by writing `localStorage` after the first page load.
- Preserved progress created during a test across later navigation and reload instead of reapplying the original fixture.
- Waited for observable A2 home and course-map states before interacting with hydrated controls.

### Changed

- Added a Playwright HTML report while retaining screenshots and traces on failure.
- GitHub Actions now uploads `playwright-report/` and `test-results/` after every browser-test run without failing when no artifacts exist.
- A2 pilot completion rules and all A1/A2 curriculum data remain unchanged.

## 2026-07-28 - A2 Units 2–4 Reading QA

### Fixed

- Changed the unit 2 transportation answer from an action phrase to the direct noun answer `The bus.`.
- Replaced A2 unit 2–4 passage distractors that used words from later or unintroduced lessons.
- Reworded the unit 4 symptom questions to match the noun answer `A headache.` naturally without introducing `because of`.

### Changed

- Added optional per-option lexeme and chunk metadata for passage comprehension questions.
- New A2 passage options are validated against content learned by the passage completion lesson.
- Legacy A1 string-only passage options remain valid and unchanged.

## 2026-07-28 - A2 Pilot Units 2–4

### Added

- Added A2 pilot units for travel and transportation, shopping and comparison, and health and advice.
- Added 12 lessons and 70 one-word occurrences while preserving A2 unit 1 at 25 occurrences.
- Added recognition, two slot-validated transfer exercises, and a text response for each new lesson.
- Added three ordered four-sentence passages and 14 supported comprehension questions.
- Added a ten-unit A2 blueprint while keeping units 5–10 out of formal course data.

### Changed

- QA preview can inspect all pilot units without changing learner unlock records.
- Completing current A2 content reports pilot completion without marking the full level passed or exposing B1.
- Curriculum validation now checks 4 A2 units, 16 lessons, 95 occurrences, structured transfer slots, and passage evidence.

### Preserved

- A1 remains 8 units, 32 lessons, and 145 occurrences.
- A2 unit 1 remains 4 lessons and 25 occurrences with its original IDs and content.
- Related-vocabulary topics and reference-only review status are unchanged.

## 2026-07-28 - Related Vocabulary Display and Search Fixes

### Fixed

- Related-vocabulary cards now use the canonical lemma, so `brother` stays singular beside `my brother` while the formal course still tests `brothers`.
- Added a reusable group-level Traditional Chinese override for canonical category meanings.
- Cross-topic English and Chinese searches now open the first matching topic automatically.
- A search with no matches now shows one global empty state without stale topic details.

### Preserved

- The four existing topics, all reference-only review states, and the formal A1/A2 course files remain unchanged in scope.

## 2026-07-28 - Related Vocabulary Content Expansion

### Added

- Added months from January through December with ordered cards, `in + month` chunks, pronunciation fallback, and usage reminders.
- Added family, parents, siblings, spouses, sons, and daughters with natural Taiwan Traditional Chinese explanations.
- Reused formal A1 records for May, mother, brothers, and wife; kept all missing vocabulary reference-only.
- Added month/family ordering, source-priority, search, responsive layout, and pronunciation browser tests.

### Preserved

- The A1 CSV and A2 pilot data were not changed.
- Viewing the new topics still does not alter lesson progress, scores, or review schedules.

## 2026-07-27 - Related Vocabulary

### Added

- Added 「相關字詞」 to the main navigation with the existing active style and keyboard behavior.
- Added two responsive topics: days of the week and times of day.
- Added English/Chinese search, learned-state filters, KK/IPA, normal and slow pronunciation, common chunks, and Taiwan Traditional Chinese usage reminders.
- Added a correct-answer-only shortcut from A1 word details, current-word highlighting, and return to the same lesson detail stage.
- Added versioned group and reference-only sources plus independent validation and failure handling.

### Preserved

- Viewing related vocabulary does not alter attempts, scores, completed lessons, mastery, or review intervals.
- Formal A1 data remains authoritative; no A1 CSV, A2 course, or additional vocabulary topic was added.

## 2026-07-27 - CEFR A2 Pilot Foundation

### Added

- Added a versioned course catalog and an isolated A2 v1 pilot source.
- Added one A2 unit with four lessons covering past activity, past movement, future intention, and invitation.
- Added A2 recognition, two transfer questions per lesson, typed response, a four-sentence passage rebuild, and three comprehension questions.
- Added level switching, formal A2 unlock, and a local QA preview that does not alter passed levels.
- Added progress schema v4 with exact A1 migration and separate A2 records.
- Added shared curriculum loading, validation, source storage, and Traditional Chinese level-error handling.
- Added 44 unit/data checks and 26 desktop/mobile browser flows.

### Preserved

- A1 remains on `public/data/a1-course-v3.csv` with 8 units, 32 lessons, 145 occurrences, stable IDs, and existing local progress.
- A2 is still marked `pilot_review_required`; no A2 unit 2 or later content was added.

## 2026-07-27 - EnglishWeb First-Level Launchers

### Added

- Added `啟動英句練習.bat` and `更新並啟動英句練習.bat` to the first level of the EnglishWeb workspace.
- The first-level files delegate to the maintained PowerShell launcher inside `english-learning-app` so startup logic remains single-source.
- Root BAT contents use ASCII-only commands and CRLF line endings to avoid `cmd.exe` UTF-8 parsing errors.

## 2026-07-27 - Context Engineering Hardening

### Changed

- Rebuilt all eight project-context files as clean UTF-8 Markdown.
- Defined the required read, implementation, verification, update, milestone, and new-conversation handoff cycle.
- Added a reusable new-conversation prompt and a file-update responsibility matrix.
- Added an automated check for missing context files, required sections, and suspicious encoding characters.
- Added the context check to the normal test command and CI quality job.
- Rewrote the README in readable Traditional Chinese and linked the context workflow.

### Preserved

- Existing A1 curriculum data, product behavior, learning rules, tests, launchers, and architecture decisions.

## 2026-07-27 - Windows Start Workflow

### Added

- Windows one-click start and update launchers with UTF-8 Chinese output.
- Dependency checks, safe Git update checks, port selection, and automatic browser opening.
- Automated launcher scenarios for fresh/existing installs, missing Node, install failure, occupied port, dirty Git, and Chinese/spaced paths.
- README instructions now state which BAT to double-click for first use and updates, and how to stop the site.

## 2026-07-27 - Reviewed A1 Exercise Expansion

- Corrected A1 reading-person prompts.
- Added validated pattern coverage derived from official CSV pattern IDs.
- Enabled reviewed `have-possession`, `be-relationship`, `be-location`, and `action-at-time` practice.
- Added GitHub Actions quality and Playwright browser jobs.
- Aligned `a1-u3-l2` transfer practice with `be-relationship`.

## 2026-07-25 - Stable v3 Learning Flow

- Unified all 32 lessons on `public/data/a1-course-v3.csv`.
- Added passage rebuild, per-token statistics and review schedules, content import validation, source revision handling, and reload persistence.
- Separated answer-reveal states and strengthened desktop/mobile end-to-end tests.
