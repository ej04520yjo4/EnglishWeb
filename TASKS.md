# Prioritized Tasks

Keep tasks small enough to verify in one work cycle. Move durable outcomes to `PROGRESS.md`; do not use this file as a historical log.

## Now - P0

- [x] **CONVERSATION-REVIEW-001:** Add a same-source, latest-history weak-turn queue with due labels, explicit typed recall and separate reload-safe storage; do not alter original scores, review dates or formal mastery.
- [ ] **CONVERSATION-REVIEW-DEVICE-QA:** Try the focused queue, same-day resume, hint/reveal flow and next-day full-scenario retry on Windows Chrome and a real phone. Confirm that the distinction between practice results and original scores is understandable.

- [x] **CONVERSATION-SPEECH-001:** Add user-authorized optional browser transcription to conversation responses only; require consent/click, support graceful fallback, separate speech-assisted evidence, and verify cleanup plus desktop/mobile UI with injected recognition events.
- [ ] **CONVERSATION-SPEECH-DEVICE-QA:** Try a real microphone in Windows Chrome over localhost/HTTPS; check permission denial, network/service errors, background cancellation, Taiwan-accented English recognition, and phone support. Mock recognition tests cannot certify speech accuracy or actual provider behavior.
- [x] **WORKTREE-RECONCILE-001:** Preserve the D-drive `codex/a1-pattern-batch-3` working copy separately from integrated main; the original path is now a clean main checkout for fast-forward synchronization.
  - [x] Merge protected PR #10 normally; refresh the active checkout to verified main `28b41d0` after both CI jobs pass.
  - [x] Read-only inventory: 20 unstaged files, unchanged A1 CSV, seven new transfers, four recognition/four response exercises, and an overlapping alternative alias implementation.
  - [x] Reconcile the A1 exercise/validator/test changes selectively; keep active A2 unit 5, 132 targets, deferred-pattern semantics, and alias failure isolation. Do not copy older context or target snapshots wholesale.
  - [x] User authorized D-drive synchronization. Preserve all 20 pending files, still uncommitted, in `EnglishWeb-preserved-20261016`; verify original bytes against the external backup and keep the binary patch plus stash. The original `english-learning-app` path is the D-drive main checkout. Do not delete the preservation copies without separate authorization.
- [ ] **A1-EX-003-QA:** Try the third A1 practice batch and review its English, Taiwan Chinese, difficulty, two-choice name lesson, and explicit source-pattern review context before authorizing the fourth batch.
- [ ] **VOCAB-3000-QA-001:** Close source/license and user-review follow-up for the 132-entry A1/A2 baseline.
  - [x] Reviewed the original 126 IDs, lemmas, aliases, normalization, A1/A2 placement, active/receptive target, topic, and curriculum/reference identity.
  - [ ] Review the six new A2 unit 5 targets: `manager`, `ten`, `we`, `meeting`, `three`, and `move`.
  - [ ] Resolve `license: pending` for 108 curriculum targets.
  - [ ] Record an external lexical/content source and license for 24 reference-only targets.
  - [ ] Have the user review the 24 reference-only Taiwan Chinese and existing KK/IPA values; the current 27 reference records have no blank phonetic fields, but their correctness remains unverified.
- [x] **VOCAB-3000-SOURCE-001:** Pin NGSL 1.2, WordNet 3.0 and Chinese Open WordNet inputs, license notices and hashes; retain an offline source snapshot.
  - [x] Inspect official WordNet 3.0 and wordfreq notices; document source restrictions and a preferred WordNet lemma cross-check in `docs/vocabulary-source-review-2026-10-15.md`.
  - [x] Add a deterministic 3000-target/library build, preserving the original132 objects and rejecting count/alias/source mismatches.
- [x] **VOCAB-3000-BATCH-001:** Build the user-requested full 3000-word candidate library in 60 pages; no new formal course unit or related-vocabulary topic.
- [ ] **VOCAB-3000-LIBRARY-QA:** Review each of the60 candidate batches for common sense selection, Taiwan Chinese, definition clarity, spelling prompts, distractor ambiguity and stage allocation. Machine checks are not human approval.
- [x] **VOCAB-3000-APPLICATION:** Add 3000 original guided sentence applications with source validation, first-answer-per-local-day evidence and paste/reveal safeguards; recognition/spelling alone never awards application credit.
- [x] **VOCAB-3000-KK-CANDIDATES:** Pin free CMUdict source, preserve all 3627 variants and derive 3000 KK/US IPA candidate entries without changing audio-ready state.
- [ ] **VOCAB-3000-APPLICATION-QA:** Try full-sentence input and review all 60 batches for translation, selected word sense, naturalness, difficulty and valid alternative answers. Exact-reference practice is not free-writing grading.
- [ ] **VOCAB-3000-KK-QA:** Review all derived candidates, especially 559 multivariant words and heuristic syllable/stress boundaries. Keep source/QA statuses pending until actual review is recorded.
- [ ] **DEPENDENCY-SECURITY-20261015:** Compatibility-test a separate dependency update. Fresh npm audit reports29 affected packages (1critical,24high,2moderate,2low); added opencc-js has no advisory. Do not deploy this feature as a security-clean release.
- [ ] **VOCAB-QA-001:** Try and manually review all four related-vocabulary topics.
  - Check all 27 reference records' KK/IPA values, Taiwan Traditional Chinese, normal/slow fallback speech, mobile layout, and course return behavior; 24 remain reference-only targets after formal-source deduplication.
  - Browsing/searching remains neutral; explicitly opening a detail may add exposure only and must not change course completion, accuracy, or review intervals.
- [ ] **A2-QA-001:** Manually review all 24 A2 pilot lessons.
  - Preserve units 1–5 and check the bounded household unit 6 together with them for natural Taiwan Chinese, prompts, contextual parts of speech, chunks, phonetics, transfer sentences, distractors, passages, and comprehension evidence.
  - Accept only after findings and corrections are recorded.
- [ ] **A2-QA-003:** Try the 20 post-unit-1 lesson flows on current Windows Chrome and at mobile width.
- [ ] **A2-QA-004:** Check that every unit 2–6 new lexeme is appropriate for A2 and repeated naturally.
- [ ] **A2-QA-005:** Review comparative, transportation, health, appointment, and household hints for sufficient clarity.
- [ ] **A2-QA-006:** Review all five post-unit-1 passages for natural continuity and supported answers.
- [ ] **A2-QA-007:** Adjust sentence length and hint strength from actual learner trial results.
- [ ] **M11-CONVERSATION-TRIAL-001:** Try the bounded everyday conversation supplement before any A2 unit 7 work.
  - [ ] Complete a Windows Chrome desktop and 375-pixel mobile trial of all four scenarios and record navigation, focus, reload, and date-boundary findings.
  - [ ] Manually review every partner reply, accepted answer, Traditional Chinese translation, prerequisite, and preparation phrase; correct the shopping price response and household wording if needed.
  - [ ] Confirm conversation completion never writes formal course, vocabulary, CEFR, or review evidence; inspect the optional conversation backup panel as a separate download from course/progress backup.
  - [ ] Keep typed practice available; optional transcription follows ADR-050. No oral grading, pronunciation score, or same-day restart laundering.

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
- [x] **CI-REPOSITORY-001:** Scope full CI to pull requests and `main`, add same-change concurrency, pin verified stable Actions releases, configure bounded weekly Dependabot updates, and document dependency and remote-branch maintenance findings.
- [ ] **DEPENDENCY-QA-001:** Review compatible upgrades for Next, Vite, Vinext, React Server DOM, Wrangler, and the Cloudflare Vite plugin; rerun the complete matrix without using forced audit fixes.
- [x] **CI-E2E-001:** GitHub Actions passes browser tests and exposes the retained Playwright artifact.
- [ ] **VOCAB-PLAN-003:** After the combined review, choose one next topic such as seasons, colors, or numbers.
- [ ] **VOCAB-A2-001:** Connect validated topic shortcuts to A2 only after A2 content review.
- [x] **VOCAB-REVIEW-001:** Add explicit recognition-only batches for the existing 24 reference targets, with first-submission-per-day evidence and no course/review/unlock mutations.
- [ ] **VOCAB-REVIEW-QA-001:** Try the four-topic recognition flow, same-topic distractors, first-answer-per-day rule, and cross-date status; human content/phonetic review remains separate from automated tests.
- [ ] **A2-QA-002:** Verify the pilot manually in current Windows Chrome and at 375 x 812.
- [x] **A2-PLAN-002:** The user authorized blueprint unit 5 as the next A2 pilot addition.
- [x] **A2-PLAN-003:** Build A2 unit 5 as four lessons with full practice, passage, validation, and browser coverage.
- [x] **A2-PLAN-004:** Add the bounded unit 6 household pilot after the unit 5 review track; keep it `pilot_review_required` and separate from production approval.
- [ ] **A2-PLAN-005:** After unit 6 learner and language QA, decide whether to authorize unit 7; keep units 7–10 blueprint-only until separately reviewed.
- [ ] **A2-ASSESS-001:** Add a formal A2 level assessment only after the full A2 route exists.
- [ ] **A2-RELEASE-001:** Evaluate A2 for production only after complete curriculum and language QA.
- [x] **A1-EX-003:** Integrate the third pattern batch for explicitly pending-review trial.
  - Patterns: `name-identification`, `demonstrative-identification`, review-mode `be-identification`, and `go-to-place`.
  - Seven transfers use ordered slots; four recognition/four response exercises enforce prerequisites. Automated acceptance is separate from **A1-EX-003-QA** human review.
- [ ] **AUDIO-001:** Audit all 41 KK recordings against displayed symbols and attribution.
- [ ] **AUDIO-002:** Define a reproducible open-license word/sentence audio manifest.
- [ ] **QA-001:** Split high-risk orchestration from `app/page.tsx` only where existing tests protect behavior.

## Later - P2

- [ ] **B1B2-ID-COMPAT-001:** Before re-enabling either retained level, review old lexeme/sense statistics against the 2026-10-04 canonical/POS corrections; do not silently rewrite local learner history.
- [ ] **LEGACY-READING-QA-001:** Plan a separately approved metadata migration for protected A1/A2 unit 1 passage options, which remain explicit legacy exceptions to complete prerequisite validation.
- [ ] **B1B2-QA-001 (paused):** Manually review all 64 retained B1/B2 lessons before either level can return to runtime.
- [ ] **B1B2-QA-002 (paused):** After review resumes, try the first and last lesson of every B1/B2 unit in desktop/mobile Chrome.
- [ ] **B1B2-QA-003 (paused):** Verify KK/IPA and free/open audio attribution; keep `audio_status=pending` until playable.
- [ ] **REVIEW-002:** Validate mastery after delayed review across word, sense, pattern, and passage.
- [ ] **ACCESS-001:** Complete keyboard, focus, screen-reader label, contrast, desktop, and mobile audits.
  - [x] Related-vocabulary result announcements, unique disclosure names/states, topic selection, current navigation, shortcut focus, reduced motion, and stale search/filter recovery.
  - [x] Add skip navigation, screen-heading focus that preserves existing input/card autofocus, and pending-count descriptions.
  - [x] Focus reading/response/passage choices without selecting them; checked results focus their next action and expose option selection semantics.
  - [x] Audit Daily/weakness transitions and the existing unit-assessment flow; use actual held Enter events, initial input/choice focus, progress-neutral navigation, and reload persistence checks.
  - [x] Improve and test scoped home/lesson text, placeholder, focus, input, choice, and correct/wrong/revealed contrast while preserving layout and learning rules.
  - [ ] Audit map/phonetic-specific colors, gradients, forced-colors mode, and remaining contrast states; try a native screen reader before claiming complete accessibility.

## Completed

- [x] **ACCESS-LEARNING-CONTRAST-001:** Separate decorative coral from readable action/text tokens, strengthen input/state boundaries, prevent fading action focus rings, and verify real desktop/mobile lesson states.
- [x] **DAILY-KEYBOARD-001:** Focus each Daily/weakness item and its next action, preserve choice focus, finish the Daily summary with Enter, and suppress repeated native Enter clicks without changing evidence or grading.
- [x] **ACCESS-VOCAB-001:** Keep course shortcuts visible and keyboard-focused, announce search results, and test disclosures/search/storage neutrality on desktop and mobile without redesigning the UI.
- [x] **LINT-GENERATED-001:** Exclude generated worker/build/test artifacts while testing that application, script, and test source paths remain included.
- [x] **VOCAB-SEARCH-ALIAS-001:** Match occurrence forms, lemmas, prompts, chunk English/Chinese, and curated aliases while preserving canonical display, source fields, progress neutrality, cross-topic selection, and A2 failure isolation.
- [x] **CURRICULUM-CONSISTENCY-001:** Repair A2 hints/distractors and retained B1/B2 lexical/POS/punctuation/reading issues; add bounded validation, 20 regressions, reproducibility checks, and full runtime regression verification without changing protected content or enabling advanced levels.
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
- [x] Ten-unit A2 blueprint with units 7–10 kept out of formal data; unit 6 is now a bounded pilot.
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
