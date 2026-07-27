# Changelog

This file records user-visible or contributor-visible project changes. Detailed implementation history remains in Git.

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
