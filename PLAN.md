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

**Status:** Third batch integrated for trial; human review pending

- Expand transfer practice in small, manually reviewed batches.
- Third batch: `name-identification`, `demonstrative-identification`, review-mode `be-identification`, and `go-to-place`; seven transfers plus four recognition/four response exercises remain `pilot_review_required`.
- The early name lesson intentionally has one transfer and two distinct-name choices; no untaught name or synonymous distractor is added to meet an arbitrary count.
- Next: trial and review this batch before enabling the fourth batch; 8 of 20 patterns are enabled and 12 remain deliberately deferred.
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

**Status:** Parallel manual QA track

- Preserve units 1–7 and review the bounded experiences and problem/solution pilots together with the existing travel, shopping, health, appointment, and household units.
- Verify all 32 lessons, eight unit passages, and prerequisite/slot constraints.
- Confirm the A2 pilot on Windows Chrome and a 375-pixel mobile viewport.
- The user's 2026-10-27 continuation authorizes bounded pilots through unit 8 only. Keep units 9–10 blueprint-only; all A2 content remains `pilot_review_required` until learner and language QA is recorded.
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

- The 2026-10-04 machine-assisted consistency repairs address known lemma/POS, punctuation, transfer, and reading-question defects; they do not complete this manual review or enable either level.

- Try B1 and B2 in current Windows Chrome and at mobile width.
- Review every English sentence, Taiwan Traditional Chinese prompt, chunk, grammar label, distractor, and passage.
- Supply or verify KK／IPA and licensed audio before changing any audio state to `ready`.
- Keep both levels `pilot_review_required` until review findings are recorded and corrected.

### M10 - A1/A2 Vocabulary 3000 Foundation

**Status:** 3000-word candidate catalog implemented; learner trial and human QA remain current

- Define cumulative targets: A1 1200 canonical lexemes (700 active, 500 receptive); A2 3000 cumulative (1500 active, 1500 receptive).
- Preserve the original 132 targets and add 2868 sourced canonical headwords following the user's explicit 3000-word request. Keep the full candidate catalog separate from formal courses.
- Track exposure, recognition, clean spelling, and sentence application globally by canonical `lexemeId` in progress schema v6.
- Require repeated evidence across different study dates before receptive or active mastery.
- Let the 24 existing reference-only targets earn recognition evidence through explicit, small topic-practice batches; do not infer it from card viewing or generate formal lesson progress.
- Interpret a study date as the learner device's local calendar day and preserve that day beside each new timestamp.
- The first 126 entries completed identity, CEFR, mastery-target, topic, and source-classification review. Curriculum targets introduced through the A2 pilot expansion, including units 5 and 6, still require that review, and all source/license work remains open.
- Keep CEFR completion independent from vocabulary counts and learner mastery. A1/A2 target-stage allocations are candidates, not externally certified CEFR labels.
- Provide searchable 50-word pages, explicit recognition, spelling and source-validated whole-sentence applications, without manufacturing application credit from passive browsing.
- Supply one original bilingual application and sourced KK/IPA candidates for each of 3000 targets. Keep contextual pronunciation selection, heuristic stress placement and language quality pending human review; do not replace formal curricula or symbol audio.
- Review the 60 candidate batches incrementally while A2 units 1–6 continue language QA; do not mark the milestone human-approved merely because the count is complete.

### M11 - Bounded Conversation Trial

**Status:** Pilot integrated with automated desktop/mobile verification; learner/language QA pending

- Add the isolated `public/data/conversation-practice-v1.json` supplement with four everyday scenarios, 12 learner turns, and 32 preparation phrases.
- Treat partner replies and accepted variants as explicitly taught preparation content, not formal course lessons, vocabulary credit, or CEFR evidence.
- Keep the conversation session date- and source-revision-bound under `yingju-conversation-practice-v1`; record first attempts, reveal/paste/hint assistance, and prevent same-day restart laundering.
- Use the bounded review rule of due date `+1` for assisted completion and `+3` for a clean completion. Optional conversation transcription is now scoped separately in M12; oral grading and pronunciation scoring remain excluded.
- Complete a Windows/mobile learner trial and language QA for the four scenarios, translations, prerequisites, and supplemental phrase boundary. The separately authorized unit 7 pilot does not close this manual gate; automated browser tests do not replace these checks.

### M12 - Optional Conversation Speech Input

**Status:** Published through PR #16; automated verification complete, real microphone trial pending

- Add explicit opt-in American-English browser transcription to conversation responses only, preserving typed practice and all formal learning contracts.
- Show privacy/online-service limits, support and permission errors, interim/final text, explicit apply, stop and cancel controls. Never auto-start a microphone.
- Keep speech-assisted records distinct from independent typed recall without storing transcripts or recordings.
- Verify the controller with injected unit fixtures and real desktop/mobile UI tests; report these separately from actual microphone/service accuracy.
- Stop after this scoped integration; do not add a speech backend, paid API, pronunciation scoring, or new curriculum.

### M13 - Focused Conversation Review

**Status:** Implementation and automated verification complete locally; learner/device trial pending

- Turn existing wrong/assisted response history into a focused, due-prioritized typed-recall queue.
- Reuse existing preparation, prompts and accepted variants rather than adding unreviewed conversation content.
- Preserve original first-attempt scores and review dates; save focused practice separately without formal mastery evidence.
- Verify keyboard use, same-day reload, assistance retention, storage failure and desktop/mobile widths.
- The bounded loop remains ready for real learner/device trial and the existing language review. The user's later curriculum request is tracked separately in M14, not as completion of this manual QA.

### M14 - A2 Experiences and Life Changes Pilot

**Status:** Published through PR #18 at main `8556936`; learner/language/phonetic QA pending

- Add only A2 unit 7: four lessons, 22 word occurrences, eight transfers, four recognition/four response exercises, and a six-sentence passage with four comprehension questions.
- Introduce experience statements/questions with `have been to`, then current changes with `different now` and `new job`. New lexeme counts are 0/1/3/2; `been` is a new form of the existing `be` lexeme.
- Preserve A1, A2 units 1–6, progress schema/storage, unlock rules, and the separate uncommitted backup-recovery implementation.
- Keep A2 pilot and B1/B2 disabled. Unit 7 remains pending learner, language, difficulty, and phonetic review; the later unit 8 authorization is tracked separately below.

### M15 - A2 Problems and Simple Solutions Pilot

**Status:** Bounded implementation prepared for the user-requested feature-branch push; learner/language/phonetic QA pending

- Add only A2 unit 8: four lessons, 27 word occurrences, eight transfers, four recognitions/four responses, and a five-sentence passage with four comprehension questions.
- Teach a narrow sequence of describing a problem, giving a reason, suggesting a break, and connecting a result with `so`. New lexeme counts are 1/2/1/1; the answer form `tired` uses canonical `tire` with adjective context rather than creating a duplicate target.
- Preserve A1, A2 units 1–7, stable IDs, progress schema/storage, unlock rules, and all existing 3000-target/reference contracts. Keep every new row and exercise `pilot_review_required` and audio `pending`.
- Correct the Unit 8 lesson-4 response distractors so each is a distinct taught sentence, not a transfer that only adds a location/time detail. Do not generate unit 9 or 10 automatically.
- Historical integrated verification passed 295 unit tests and 272 browser cases, including the unrelated local backup feature. Clean publication checks are recorded separately in `PROGRESS.md`; the feature-branch push does not authorize merging main or expanding unit 9.

## Milestone Completion Rule

A milestone closes only when:

1. Its acceptance tests pass.
2. `PROGRESS.md` records the verified outcome.
3. `CHANGELOG.md` records user-visible or contributor-visible effects.
4. `DECISIONS.md` records any durable choice made during the milestone.
5. This file marks the milestone complete and names the next active milestone.
6. A handoff summary is available for a fresh conversation.

Do not combine unrelated milestones merely to keep one conversation going.
