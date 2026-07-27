# Changelog

This file records user-visible or contributor-visible project changes. Detailed implementation history remains in Git.

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
