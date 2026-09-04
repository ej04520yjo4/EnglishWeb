# Prioritized Tasks

Keep tasks small enough to verify in one work cycle. Move durable outcomes to `PROGRESS.md`; do not use this file as a historical log.

## Now - P0

- [ ] **VOCAB-3000-QA-001:** Close source/license and user-review follow-up for the 126-entry A1/A2 baseline.
  - [x] Reviewed all 126 IDs, lemmas, aliases, normalization, A1/A2 placement, active/receptive target, topic, and curriculum/reference identity; no count change was needed.
  - [ ] Resolve `license: pending` for 100 curriculum targets.
  - [ ] Record an external lexical/content source and license for 26 reference-only targets.
  - [ ] Have the user review the 26 reference-only Taiwan Chinese and blank KK/IPA fields.
- [ ] **VOCAB-3000-SOURCE-001:** Select the next legally reusable external frequency/reference source and record its exact license before importing any new batch.
- [ ] **VOCAB-3000-BATCH-001:** Prepare one small deduplicated candidate batch; reject chunks, proper duplicates, unsourced entries, and silently copied protected lists.
- [ ] **VOCAB-QA-001:** Try and manually review all four related-vocabulary topics.
  - Check all 27 reference-only KK/IPA values, Taiwan Traditional Chinese, normal/slow fallback speech, mobile layout, and course return behavior.
  - Browsing/searching remains neutral; explicitly opening a detail may add exposure only and must not change course completion, accuracy, or review intervals.
- [ ] **A2-QA-001:** Manually review all 16 A2 pilot lessons.
  - Preserve unit 1 and check units 2–4 for natural Taiwan Chinese, prompts, contextual parts of speech, chunks, phonetics, transfer sentences, distractors, passages, and comprehension evidence.
  - Accept only after findings and corrections are recorded.
- [ ] **A2-QA-003:** Try the 12 new lesson flows on current Windows Chrome and at mobile width.
- [ ] **A2-QA-004:** Check that every unit 2–4 new lexeme is appropriate for A2 and repeated naturally.
- [ ] **A2-QA-005:** Review comparative, transportation, and health hints for sufficient clarity.
- [ ] **A2-QA-006:** Review all three new passages for natural continuity and supported answers.
- [ ] **A2-QA-007:** Adjust sentence length and hint strength from actual learner trial results.

## Next - P1

- [x] **LEARNING-LOOP-001:** Add a deterministic daily learning plan and evidence-backed weakness center without changing schema v6 or CEFR unlock rules.
- [x] **LEARNING-LOOP-002:** Turn the daily plan into a resumable review → lesson → weakness → summary session and add direct evidence-backed weakness practice.
- [x] **UX-INPUT-001:** Prevent Enter key skip-through across all learning inputs, enforce third-attempt reveal, add boundary arrow/empty-Backspace navigation, and simplify recall/detail visual hierarchy.
- [x] **LEARNING-DATE-001:** Replace UTC-derived study-day keys with stable device-local calendar dates without changing schema v6.
- [x] **UX-HINT-001:** Enforce letter count → first letter/audio → full reveal for both near-miss and unrelated recall errors.
- [x] **CI-VERIFY-001:** Use `npm run verify` as the single local and GitHub quality gate; keep Playwright as the independent second CI job.
- [x] **DAILY-SESSION-PERSIST-001:** Restore same-day Daily Learning state across F5/close, expire old-day state, and clear it after summary completion.
- [x] **DAILY-SESSION-LEVEL-001:** Bind each temporary Daily Learning session to its originating CEFR level and exact lesson; reject missing or inaccessible context without cross-level fallback.
- [x] **DAILY-WEAKNESS-RESUME-001:** Persist completed weakness lexeme IDs and resume the first unfinished item after reload without inventing evidence.
- [x] **STUDY-WEEK-001:** Count unique selected-level study dates in the learner's device-local Monday-to-Sunday week on both home and top bar.
- [x] **DAILY-MIDNIGHT-001:** Revalidate the device-local date before every Daily Learning resume, answer, and continue action; discard stale temporary state without progress or evidence mutations.
- [x] **DAILY-ACTIVE-TIME-001:** Persist visible active study seconds with a five-minute idle cap, lifecycle flushes, and reload-safe segment restart in Daily Session v3.
- [x] **ACTIVE-REVIEW-001:** Replace passive Daily Learning review completion with a deterministic five-item evidence-backed spelling, recognition, and formal-sentence application queue that resumes by stable ID.
- [x] **APPLICATION-EVIDENCE-001:** Require every free-text `applicationCorrect` record to be correct, unrevealed, and unpasted while allowing assisted answers to complete the exercise and retain `applicationAttempt`.
- [ ] **DEPENDENCY-QA-001:** Review compatible upgrades for Next, Vite, Vinext, React Server DOM, Wrangler, and the Cloudflare Vite plugin; rerun the complete matrix without using forced audit fixes.
- [x] **CI-E2E-001:** GitHub Actions passes browser tests and exposes the retained Playwright artifact.
- [ ] **VOCAB-PLAN-003:** After the combined review, choose one next topic such as seasons, colors, or numbers.
- [ ] **VOCAB-A2-001:** Connect validated topic shortcuts to A2 only after A2 content review.
- [ ] **VOCAB-REVIEW-001:** Evaluate a future topic-based review exercise without turning reference viewing into course completion.
- [ ] **A2-QA-002:** Verify the pilot manually in current Windows Chrome and at 375 x 812.
- [ ] **A2-PLAN-002:** After units 1–4 are accepted, decide whether blueprint unit 5 should receive formal data.
- [ ] **A2-PLAN-003:** Build A2 unit 5 only after units 1–4 manual review.
- [ ] **A2-PLAN-004:** Complete units 5–10 in separate reviewed batches.
- [ ] **A2-ASSESS-001:** Add a formal A2 level assessment only after the full A2 route exists.
- [ ] **A2-RELEASE-001:** Evaluate A2 for production only after complete curriculum and language QA.
- [ ] **A1-EX-003:** Add the third reviewed pattern batch.
  - Patterns: `name-identification`, `demonstrative-identification`, review-mode `be-identification`, and `go-to-place`.
  - Accept when prerequisites, slot allowlists, natural Taiwan Chinese, non-source variations, unit tests, and Playwright flows pass.
- [ ] **AUDIO-001:** Audit all 41 KK recordings against displayed symbols and attribution.
- [ ] **AUDIO-002:** Define a reproducible open-license word/sentence audio manifest.
- [ ] **QA-001:** Split high-risk orchestration from `app/page.tsx` only where existing tests protect behavior.

## Later - P2

- [ ] **B1B2-QA-001 (paused):** Manually review all 64 retained B1/B2 lessons before either level can return to runtime.
- [ ] **B1B2-QA-002 (paused):** After review resumes, try the first and last lesson of every B1/B2 unit in desktop/mobile Chrome.
- [ ] **B1B2-QA-003 (paused):** Verify KK/IPA and free/open audio attribution; keep `audio_status=pending` until playable.
- [ ] **REVIEW-002:** Validate mastery after delayed review across word, sense, pattern, and passage.
- [ ] **ACCESS-001:** Complete keyboard, focus, screen-reader label, contrast, desktop, and mobile audits.

## Completed

- [x] Eight root project-context files with a required read/update workflow.
- [x] New-conversation handoff template and milestone boundary rules.
- [x] Automated UTF-8 and required-section checks for project-context files.
- [x] Windows one-click startup and update with seven verified exception scenarios.
- [x] Full build, 33 unit/data checks, lint, types, and 16 desktop/mobile browser flows.
- [x] A1 v3 single-source loading for 8 units, 32 lessons, and 145 word occurrences.
- [x] Word/token, chunk, lexeme/sense, pattern, and passage layering.
- [x] Reviewed first and second pattern-practice batches.
- [x] Versioned local curriculum storage and validated content import/export.
- [x] GitHub Actions quality and browser jobs.
- [x] Level catalog and isolated A1/A2 curriculum loading.
- [x] A2 v1 pilot source with 1 unit, 4 lessons, and 25 one-word occurrences.
- [x] A2 reviewed-flow exercises, four-sentence passage, and three comprehension questions.
- [x] Progress schema v4 migration with exact A1 preservation and isolated A2 progress.
- [x] Formal A2 unlock plus a non-mutating QA preview.
- [x] Desktop/mobile A2 completion, passage, migration, reload, and error-isolation tests.
- [x] Versioned related-vocabulary and reference-only data boundaries.
- [x] Days-of-week and times-of-day topic pages with search, filters, audio fallback, chunks, and usage notes.
- [x] Correct-answer-only course shortcut, current-word highlight, exact-stage return, and progress-neutral viewing.
- [x] Related-vocabulary unit validation and desktop/mobile browser coverage.
- [x] **VOCAB-PLAN-002:** Added months and family members together for one combined user review.
- [x] Canonical lemma display, group-level Traditional Chinese overrides, cross-topic search selection, and global no-result handling.
- [x] A2 pilot units 2–4 with 12 lessons, 70 new occurrences, per-lesson recognition/transfers/response, and three unit passages.
- [x] Slot-position validation, passage prerequisite metadata, and cross-sentence evidence validation.
- [x] A2 units 2–4 passage-option prerequisite metadata, future-content rejection, and final reading wording QA.
- [x] Ten-unit A2 blueprint with units 5–10 kept out of formal data.
- [x] Deterministic pre-hydration A2 Playwright fixtures, explicit UI readiness waits, and CI failure-artifact retention.
- [x] B1 v1 pilot with 8 units, 32 lessons, 249 one-word occurrences, 64 transfers, and 8 passages.
- [x] B2 v1 pilot with 8 units, 32 lessons, 298 one-word occurrences, 64 transfers, and 8 passages.
- [x] Four-level catalog loading, progress schema v5 migration, isolated storage, content management, and QA preview.
- [x] Project-data audit for orphan/duplicate sources, structural ID collisions, intentional review repetition, generator-key collisions, and tracked artifacts.
- [x] Desktop/mobile first-lesson browser coverage for B1 and B2 without formal level unlock mutation.
- [x] Disabled B1/B2 runtime loading and selectors while preserving their direct data audit coverage.
- [x] Added the partial A1/A2 canonical target baseline, target audit, and coverage report.
- [x] Added global vocabulary evidence and schema v6 migration without inventing legacy mastery.
- [x] Added progress UI, explicit-detail exposure rules, clean spelling safeguards, backup persistence, and desktop/mobile coverage.
- [x] Completed the 2026-08-19 A1/A2 language audit, corrected the shared A1 `a` note, and added deterministic input-flow regressions.
