# Changelog

This file records user-visible or contributor-visible project changes. Detailed implementation history remains in Git.

## 2026-07-27 — Context Engineering and Windows Start

### Added

- Root Context Engineering files for rules, roadmap, current progress, decisions, tasks, long-term memory, changes, and architecture.
- Windows one-click start and update launchers with UTF-8 Chinese output, dependency checks, safe Git update checks, port selection, and automatic browser opening.
- Automated launcher scenario checks for fresh/existing installs, missing Node, install failure, occupied port, dirty Git, and Chinese/spaced paths.

### Documentation

- Added the Windows one-click workflow to `README.md`.
- Defined the required read/update lifecycle for future Codex work.

## 2026-07-27 — Reviewed A1 Exercise Expansion

- Corrected A1 reading-person prompts.
- Added validated pattern coverage derived from official CSV pattern IDs.
- Enabled reviewed `have-possession`, `be-relationship`, `be-location`, and `action-at-time` practice.
- Added GitHub Actions quality and Playwright browser jobs.
- Aligned `a1-u3-l2` transfer practice with `be-relationship`.

## 2026-07-25 — Stable v3 Learning Flow

- Unified all 32 lessons on `public/data/a1-course-v3.csv`.
- Added passage rebuild, per-token statistics and review schedules, content import validation, source revision handling, and reload persistence.
- Separated answer-reveal states and strengthened desktop/mobile end-to-end tests.
