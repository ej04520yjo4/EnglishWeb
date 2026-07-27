# Product Plan

## Product Direction

英句練習 is a Traditional Chinese, keyboard-first English learning site. It builds sentence production from individual word recall to chunks, sentence patterns, complete sentences, and short passages.

A1 is the current production level. Later CEFR levels must extend the architecture without weakening the A1 data contract or bypassing human review.

## Milestones

### M0 - A1 MVP Foundation

**Status:** Complete

- One official v3 CSV builds 8 units, 32 lessons, and 145 word occurrences.
- Word/token, chunk, sentence-pattern, lesson, and passage layers remain separate.
- Course map, recall, detail, sentence rebuild, reviewed reading exercises, review scheduling, assessment, local progress, and content QA are connected.
- Desktop and mobile browser flows have automated coverage.

### M1 - Reviewed A1 Practice Expansion

**Status:** Current

- Expand transfer practice in small, manually reviewed batches.
- Next batch: `name-identification`, `demonstrative-identification`, review-mode `be-identification`, and `go-to-place`.
- Require learned lexeme/chunk checks, natural Taiwan Chinese, non-source variations, and matching source patterns.
- Finish when every enabled A1 pattern has validated exercises and browser coverage.

### M2 - Pronunciation Asset Completion

**Status:** Planned

- Keep Web Speech API only as a temporary word/sentence fallback.
- Produce or select free/open American-English audio with attribution.
- QA standalone KK symbols, word audio, and sentence audio separately.
- Mark audio `ready` only when a playable source and its license are recorded.

### M3 - A2 Curriculum Design

**Status:** Planned

- Define A2 vocabulary, grammar, length, tense, chunk, prompt, and speed limits.
- Create A2 content in a new versioned source; do not alter the A1 v3 contract.
- Validate prerequisite order and the intended old/new/challenge balance before UI rollout.

### M4 - Learning Depth and Release Readiness

**Status:** Planned

- Improve delayed review and mastery evidence across lexeme, sense, pattern, and passage.
- Reduce the size of the central page component only after behavior is protected by tests.
- Complete accessibility, responsive, import/export, licensing, and recovery checks.

## Milestone Completion Rule

A milestone closes only when:

1. Its acceptance tests pass.
2. `PROGRESS.md` records the verified outcome.
3. `CHANGELOG.md` records user-visible or contributor-visible effects.
4. `DECISIONS.md` records any durable choice made during the milestone.
5. This file marks the milestone complete and names the next active milestone.
6. A handoff summary is available for a fresh conversation.

Do not combine unrelated milestones merely to keep one conversation going.
