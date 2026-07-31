# Product Plan

## Product Direction

英句練習 is a Traditional Chinese, keyboard-first English learning site. It builds sentence production from individual word recall to chunks, sentence patterns, complete sentences, and short passages.

A1 is the current production level and A2 is the only runtime pilot. B1/B2 data remains available for direct audit but is disabled in the product. Current development returns to A1/A2 quality, global vocabulary evidence, and a sourced 3000-canonical-lexeme foundation.

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

- Preserve unit 1 and review the new travel, shopping, and health pilot units.
- Verify all 16 lessons, four unit passages, and prerequisite/slot constraints.
- Confirm the A2 pilot on Windows Chrome and a 375-pixel mobile viewport.
- Keep units 5–10 as blueprint-only planning until units 1–4 are accepted.
- Completing available content must not mark full A2 completion or unlock B1.

### M5 - Related Vocabulary Reference Tool

**Status:** Complete

- Added a primary-navigation reference tool without changing the course hierarchy.
- Added two versioned topics only: days of the week and times of day.
- Reused official A1 lexemes where available and isolated missing words as reference-only content.
- Added search, learning-state filters, pronunciation fallback, course-detail shortcuts, and exact-stage return.
- Protected learner scores, attempts, completion, and review intervals from reference-page viewing.

### M6 - Related Vocabulary User Review

**Status:** Paused during A2 pilot review

- Try all four topics in current Windows Chrome and at mobile width.
- Manually review the 27 reference-only KK/IPA entries, chunks, and Taiwan Traditional Chinese wording.
- Review months and family members together as the second content batch.
- Decide the next single topic only after this combined review is complete.
- Resume A2 pilot review only after this scoped user-review cycle.

### M7 - Learning Depth and Release Readiness

**Status:** Planned

- Improve delayed review and mastery evidence across lexeme, sense, pattern, and passage.
- Reduce the size of the central page component only after behavior is protected by tests.
- Complete accessibility, responsive, import/export, licensing, and recovery checks.

### M8 - B1 and B2 Pilot Curriculum Foundation

**Status:** Complete

- Added independent B1 and B2 v1 pilot sources without changing A1 or A2 rows.
- Added 8 units and 32 lessons per level, retaining one-word answers and chunk meaning.
- Added recognition, two transfers, text response, passage rebuild, and comprehension for every unit.
- Extended the shared data contracts and validation to four levels; B1/B2 are now retained as disabled data rather than runtime courses.
- Added project-data auditing for catalog sources, ID collisions, duplicate files, generator key collisions, and tracked build artifacts.

### M9 - B1 and B2 Manual Content Review

**Status:** Paused

- Try B1 and B2 in current Windows Chrome and at mobile width.
- Review every English sentence, Taiwan Traditional Chinese prompt, chunk, grammar label, distractor, and passage.
- Supply or verify KK／IPA and licensed audio before changing any audio state to `ready`.
- Keep both levels `pilot_review_required` until review findings are recorded and corrected.

### M10 - A1/A2 Vocabulary 3000 Foundation

**Status:** Current

- Define cumulative targets: A1 1200 canonical lexemes (700 active, 500 receptive); A2 3000 cumulative (1500 active, 1500 receptive).
- Build only a sourced baseline from existing A1/A2 curriculum and reference vocabulary; do not generate words merely to reach 3000.
- Track exposure, recognition, clean spelling, and sentence application globally by canonical `lexemeId` in progress schema v6.
- Require repeated evidence across different study dates before receptive or active mastery.
- Keep CEFR completion independent from the incomplete vocabulary target until both curriculum and target data pass human review.
- Expand the target list in small licensed, manually reviewed batches while A2 units 1–4 continue language QA.

## Milestone Completion Rule

A milestone closes only when:

1. Its acceptance tests pass.
2. `PROGRESS.md` records the verified outcome.
3. `CHANGELOG.md` records user-visible or contributor-visible effects.
4. `DECISIONS.md` records any durable choice made during the milestone.
5. This file marks the milestone complete and names the next active milestone.
6. A handoff summary is available for a fresh conversation.

Do not combine unrelated milestones merely to keep one conversation going.
