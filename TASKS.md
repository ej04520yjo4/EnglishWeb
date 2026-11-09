# Prioritized Tasks

Keep tasks small enough to verify in one work cycle. Move durable outcomes to `PROGRESS.md`; do not use this file as a historical log.

## Now - P0

- [ ] **REVIEW-FIXES-QA-001:** Try branch `codex/review-fixes` on a real phone and Windows Chrome: one-row navigation and current-page visibility, home landing without auto-scroll, hidden Enter badges on touch, storage warning with site data blocked or full, favicon, and the 3000-word screens on the packed data. Then merge it and reconcile the uncommitted Unit 8 checkout.
- [ ] **DEPLOY-SITE-URL-001:** Set `NEXT_PUBLIC_SITE_URL` to the deployed origin before any deployment so social previews never depend on request headers.
- [ ] **A2-U07-QA:** Try all four lessons and the passage on Windows/phone; review English/Taiwan Chinese, present-perfect scaffolding, `been` versus `be`, six new lexemes, and KK/IPA before considering unit 8.

- [ ] **CONVERSATION-REVIEW-DEVICE-QA:** Try the focused queue, same-day resume, hint/reveal flow and next-day full-scenario retry on Windows Chrome and a real phone. Confirm that the distinction between practice results and original scores is understandable.

- [ ] **CONVERSATION-SPEECH-DEVICE-QA:** Try a real microphone in Windows Chrome over localhost/HTTPS; check permission denial, network/service errors, background cancellation, Taiwan-accented English recognition, and phone support. Mock recognition tests cannot certify speech accuracy or actual provider behavior.
- [ ] **A1-EX-003-QA:** Try the third A1 practice batch and review its English, Taiwan Chinese, difficulty, two-choice name lesson, and explicit source-pattern review context before authorizing the fourth batch.
- [ ] **VOCAB-3000-QA-001:** Close source/license and user-review follow-up for the 132-entry A1/A2 baseline.
  - [x] Reviewed the original 126 IDs, lemmas, aliases, normalization, A1/A2 placement, active/receptive target, topic, and curriculum/reference identity.
  - [ ] Review the six new A2 unit 5 targets: `manager`, `ten`, `we`, `meeting`, `three`, and `move`.
  - [ ] Resolve `license: pending` for 108 curriculum targets.
  - [ ] Record an external lexical/content source and license for 24 reference-only targets.
  - [ ] Have the user review the 24 reference-only Taiwan Chinese and existing KK/IPA values; the current 27 reference records have no blank phonetic fields, but their correctness remains unverified.
- [ ] **VOCAB-3000-LIBRARY-QA:** Review each of the60 candidate batches for common sense selection, Taiwan Chinese, definition clarity, spelling prompts, distractor ambiguity and stage allocation. Machine checks are not human approval.
- [ ] **VOCAB-3000-APPLICATION-QA:** Try full-sentence input and review all 60 batches for translation, selected word sense, naturalness, difficulty and valid alternative answers. Exact-reference practice is not free-writing grading.
- [ ] **VOCAB-3000-KK-QA:** Review all derived candidates, especially 559 multivariant words and heuristic syllable/stress boundaries. Keep source/QA statuses pending until actual review is recorded.
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
- [ ] **M11-CONVERSATION-TRIAL-001:** Try the bounded everyday conversation supplement; the later user-authorized unit 7 pilot does not count as completing this learner review.
  - [ ] Complete a Windows Chrome desktop and 375-pixel mobile trial of all four scenarios and record navigation, focus, reload, and date-boundary findings.
  - [ ] Manually review every partner reply, accepted answer, Traditional Chinese translation, prerequisite, and preparation phrase; correct the shopping price response and household wording if needed.
  - [ ] Confirm conversation completion never writes formal course, vocabulary, CEFR, or review evidence; inspect the optional conversation backup panel as a separate download from course/progress backup.
  - [ ] Keep typed practice available; optional transcription follows ADR-050. No oral grading, pronunciation score, or same-day restart laundering.

## Next - P1

- [ ] **E2E-ACTUAL-PORT-001:** Make the browser harness fail clearly or use Vinext's confirmed local URL when 4173 is unavailable; this turn verified the unchanged viewport/test suite with an ignored 4174 override instead of claiming the fixed-port wrapper succeeded.

- [ ] **VOCAB-PLAN-003:** After the combined review, choose one next topic such as seasons, colors, or numbers.
- [ ] **VOCAB-A2-001:** Connect validated topic shortcuts to A2 only after A2 content review.
- [ ] **VOCAB-REVIEW-QA-001:** Try the four-topic recognition flow, same-topic distractors, first-answer-per-day rule, and cross-date status; human content/phonetic review remains separate from automated tests.
- [ ] **A2-QA-002:** Verify the pilot manually in current Windows Chrome and at 375 x 812.
- [ ] **A2-ASSESS-001:** Add a formal A2 level assessment only after the full A2 route exists.
- [ ] **A2-RELEASE-001:** Evaluate A2 for production only after complete curriculum and language QA.
- [ ] **AUDIO-001:** Audit all 41 KK recordings against displayed symbols and attribution.
- [ ] **AUDIO-002:** Define a reproducible open-license word/sentence audio manifest.
- [ ] **QA-002:** Move remaining `page.tsx` state/effect groups (daily session, weakness practice, content management, persistence) into focused hooks only where browser tests protect the behavior; screens already render through `app/screens/`.

## Later - P2

- [ ] **DEPENDENCY-MODERATE-001:** Recheck the 12 remaining moderate advisories (ESLint `minimatch` chain; Vinext `@vercel/og`/`satori`/`fflate`) when upstream releases non-downgrade fixes. High/critical advisories were cleared on 2026-11-09.
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

Completed task outcomes are archived in `docs/archive/completed-tasks.md`.
