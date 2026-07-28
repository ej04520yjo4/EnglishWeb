# Product Plan

## Product Direction

英句練習 is a Traditional Chinese, keyboard-first English learning site. It builds sentence production from individual word recall to chunks, sentence patterns, complete sentences, and short passages.

A1 is the current production level. A2 has two isolated pilot units for technical and linguistic review. Later CEFR levels must extend the architecture without weakening the A1 data contract or bypassing human review.

## Milestones

### M0 - A1 MVP Foundation

**Status:** Complete

- One official v3 CSV builds 8 units, 32 lessons, and 145 word occurrences.
- Word/token, chunk, sentence-pattern, lesson, and passage layers remain separate.
- Course map, recall, detail, sentence rebuild, reviewed reading exercises, review scheduling, assessment, local progress, and content QA are connected.
- Desktop and mobile browser flows have automated coverage.

### M1 - Reviewed A1 Practice Expansion

**Status:** Paused after two reviewed batches

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

### M3 - A2 Pilot Foundation

**Status:** Complete

- Added a level catalog and reusable A1/A2 loading, validation, storage, and progress boundaries.
- Preserved the complete A1 v3 contract while adding one versioned A2 pilot unit.
- Added four reviewed-flow lessons covering past activity, past movement, future intention, and invitation.
- Added A2 passage rebuild, three comprehension questions, formal unlock rules, and a non-mutating QA preview switch.

### M4 - A2 Pilot Review and Controlled Expansion

**Status:** Current

- Keep A2 unit 1 unchanged while trialing unit 2 「購物與比較」 as the second controlled batch.
- Manually review all A2 Chinese prompts, contextual parts of speech, chunks, distractors, transfer sentences, phonetics, and the shopping passage.
- Confirm both units on Windows Chrome and a 375-pixel mobile viewport.
- Promote pilot content only after review; do not add A2 unit 3 until unit 2 trial findings are accepted.

### M5 - Related Vocabulary Reference Tool

**Status:** Complete

- Added a primary-navigation reference tool without changing the course hierarchy.
- Added two versioned topics only: days of the week and times of day.
- Reused official A1 lexemes where available and isolated missing words as reference-only content.
- Added search, learning-state filters, pronunciation fallback, course-detail shortcuts, and exact-stage return.
- Protected learner scores, attempts, completion, and review intervals from reference-page viewing.

### M6 - Related Vocabulary User Review

**Status:** Paused while A2 unit 2 is trialed

- Try all four topics in current Windows Chrome and at mobile width.
- Manually review the 27 reference-only KK/IPA entries, chunks, and Taiwan Traditional Chinese wording.
- Review months and family members together as the second content batch.
- Decide the next single topic only after this combined review is complete.
- Keep all 27 reference-only entries review-required while A2 unit 2 is trialed.

### M7 - Learning Depth and Release Readiness

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
