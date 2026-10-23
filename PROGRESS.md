# Project Progress

## Snapshot

- Updated: 2026-10-23
- Branch: `codex/conversation-review-loop`, based on main merge `6f6eddf` (PR #16).
- PR #16 published optional speech input and both daily-use checkouts were synchronized to main in the preceding task. The user authorized publishing focused review on 2026-10-23. Local release checks passed; the normal protected PR and merge checks are next (no bypass).
- PR #14 merged the sentence applications and KK candidates normally on 2026-10-16 after both protected checks passed (run `38767664811`) and an independent scoped review found no blocker. No bypass or deployment was used.
- Active checkout: `D:\Codex\Tools\EnglishWeb\english-learning-app`; this task began clean on main `6f6eddf` and uses the feature branch above.
- The C-drive checkout remains at the preceding published main. This follow-up does not overwrite another checkout or the saved D-drive working copy.
- The original D-drive branch and all 20 unstaged tracked files are preserved in `D:\Codex\Tools\EnglishWeb\EnglishWeb-preserved-20261016`, still uncommitted on `codex/a1-pattern-batch-3` at `816c2cf`. All 20 file hashes match the pre-sync byte copies in `backups\pre-speech-sync-20261016`; a binary patch and retained stash `8b1e56de8d799dda92f1c332a5a64b3d149e1aef` provide additional recovery. These older alternatives must not overwrite the newer integrated main wholesale.
- Integration: [PR #13](https://github.com/ej04520yjo4/EnglishWeb/pull/13) merged on 2026-10-15 at `7bf6e03`, including the earlier contrast and recognition changes. No administrator bypass, forced push, branch deletion or deployment was used.
- Active milestone: M13 - Focused Conversation Review (implementation/automated QA complete; learner trial next)
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A1 practice: 20 CSV patterns, 8 enabled/covered, 0 uncovered, 12 deliberately deferred; third-batch additions remain `pilot_review_required`.
- A2: 6 units, 24 lessons, 146 occurrences
- Protected source status: A1 remains unchanged; A2 units 1–5 retain row and exercise-object hash locks. Unit 6 adds 24 occurrences and remains `pilot_review_required`.
- Progress schema: v6 with top-level global `vocabularyProgress`

## Vocabulary Baseline

- A1: 145 occurrences, 69 word forms, 75 senses, 15 chunks, 68 canonical lexemes.
- A2: 146 occurrences, 82 word forms, 112 senses, 44 chunks, 78 canonical lexemes.
- A1＋A2 union: 119 canonical lexemes (117 excluding proper names); overlap: 27.
- Reference-only unique lexemes relative to current formal rows: 23. Protected target metadata still records the original 24 reference targets, not an automatic source reclassification.
- Protected v1 baseline: 132 entries; 108 active candidates and 24 receptive candidates, unchanged.
- Runtime v2 catalog: 3000 canonical entries, 1500 active / 1500 receptive candidates. A1-stage 1200 (700/500), A2-stage 1800 (800/1000), 60 pages of 50.
- Target status: `count_complete_review_required`; all entries remain `pilot_review_required`. These stage allocations are planning candidates, not official CEFR ratings or proof of learner mastery.
- New 2868 headwords use pinned NGSL 1.2 frequency data, matched WordNet 3.0/COW meanings or original editorial corrections. Hashes, transformation snapshots and complete notices are retained with the source package; no protected dictionary scrape or invented phonetics.
- The original 126 entries received an item-by-item identity, normalization, CEFR, mastery-target, topic, and curriculum/reference classification pass. The six targets introduced by unit 5 remain pending the same human review.
- Provenance is still open: 108 curriculum targets have `license: pending`; all 24 reference-only targets need an external lexical/content source and license review. Their Taiwan Chinese and KK/IPA values remain for user review. A fresh field audit found no blank KK/IPA among the 27 reference records; earlier "blank" wording was stale, not evidence of phonetic approval.
- Durable findings are recorded in `docs/vocabulary-baseline-review-2026-08-19.md`; the reviewed target SHA-256 is `c1342d65a8aa6f39cf5efa6e40ca5fc68cabf536e92af46dcd1ff122b6d4afc1`.
- Source report records one A2 source-ID/lemma projection, `me -> I`; target aliases map both to canonical `i`, with no target ID or lemma conflict.
- Lesson-specific proper names Amy and Ben remain in A1 course practice but are excluded from the 3000 general-vocabulary target.

## Working Features

- Existing A1/A2 recall, detail, chunk, sentence rebuild, recognition, transfer, response, passage, review, assessment, import/export, and responsive flows remain available.
- B1/B2 are absent from selectors, cannot be opened by advanced preview, are not fetched at startup, and are rejected by direct runtime loader calls.
- The old `showA2Pilot` setting is readable; new storage/export uses `showAdvancedPilots` and currently exposes A2 QA only.
- Runtime targets load only `public/data/vocabulary-targets-v2.json`; v1 remains a protected baseline. The independent `vocabulary-library-v1.json` supplies 3000 meanings without creating formal course occurrences.
- The 3000-word screen supports bilingual search, candidate-stage/goal filters, 50-item pages, recognition, spelling and 3000 independent whole-sentence applications. Source-revision-bound questions use one first attempt per word/date/mode; card navigation and search never write evidence.
- Each target has a CMUdict-derived KK/US IPA candidate: 3000 entries, 3627 variants, 559 multivariant words, zero missing headwords. All remain pending review; syllable boundaries and stress placement are heuristic, contextual variants are unselected, and no audio status changes.
- Exposure, recognition, spelling, and application evidence is deduplicated by stable ID and shared by canonical lexeme across A1/A2.
- Receptive mastery requires two correct recognition records on different dates. Active also requires two clean spelling records on different dates and one clean application.
- Revealed or pasted spelling never creates clean spelling evidence; revealed or pasted free-text application can complete an exercise but never creates `applicationCorrect`.
- Related-vocabulary search/render/audio remains neutral; an explicit detail open records exposure only and leaves completion, accuracy, review intervals, and passed IDs unchanged.
- The progress page separates the 3000 goal, current target coverage, personal evidence-based mastery, senses, chunks, and due reviews.
- The home page now shows a deterministic daily learning plan: due review first, then the current recommended lesson, then up to three evidence-backed weak lexemes.
- The weakness center ranks only target lexemes with actual incorrect recognition, clean-spelling, or application attempts; passive exposure never creates a weakness.
- Daily Learning v3 uses a deterministic queue of at most five due formal occurrences. Each item requires spelling, recognition, or safe formal-sentence application; stable completed IDs and per-item reveal/paste state resume the first unfinished item after F5 without duplicate clean evidence.
- `yingju-daily-session-v3` remains separate from progress schema v6. It binds the exact CEFR/lesson and local date, revalidates before every Daily action, discards stale v1/v2/current-day-invalid state without learning side effects, and resumes unfinished weakness IDs after the active review and lesson.
- 「今日時間」 now accumulates only visible Daily review, exact Daily lesson, and Daily weakness activity. Lifecycle flushes exclude reload/offline gaps, a 15-second interaction checkpoint supports longer study, and each uninterrupted idle segment is capped at five minutes.
- Home and top-bar weekly study counts use the selected level's unique local study dates inside the learner's current Monday-to-Sunday week; older dates and future-week dates are excluded.
- Study dates now use one shared device-local `YYYY-MM-DD` helper. New vocabulary evidence stores the local date when it is created, so backup/import or later timezone changes do not reinterpret mastery dates.
- Weakness rows can launch direct focus practice for spelling, recognition, or sentence application without changing lesson completion or CEFR unlocks.
- Lesson input UX now ignores held Enter repeats across recall, detail, transfer, passage, weakness, and assessment paths; shared boundary logic supports left/right navigation and empty-box Backspace.
- Recall now always advances through the same three hints: letter count, first letter plus audio replay, then full-answer reveal and required retyping. Near-miss text may accompany but never replace the fixed hint level; revealed or pasted input still cannot create clean spelling evidence.
- `npm run verify` is the shared local and GitHub quality gate for context, project/vocabulary audits and report, curriculum validation, build, unit, lint, and TypeScript. `npm test` adds the full Playwright matrix.
- Recall keeps the prompt and input visually primary, while post-answer detail shows the selected phonetic system and contextual part of speech before collapsed secondary metadata.
- A1 32 lessons/145 occurrences and the first 16 A2 lessons/95 occurrences were re-audited on 2026-08-19. A2 unit 5 adds four structurally verified lessons and remains pending manual English, Traditional Chinese, phonetic, and difficulty review.
- Schema v3/v4/v5 imports migrate to v6 without inventing legacy vocabulary mastery; v6 backup export/import preserves global evidence.

## Latest Completed Work

- Added a bounded conversation weak-turn review: latest same-source history selects incorrect, hinted, revealed, pasted or speech-assisted turns; repair requests alone are not weaknesses. Due scenarios sort first, while authored turn order stays stable.
- Focused review uses the existing taught responses, normal/slow partner playback, optional listen-first behavior, Enter/focus handling and third-error reveal/retype. It saves its own same-day session and result without changing full-conversation first attempts, due dates, formal course progress or vocabulary evidence.
- Isolated `yingju-conversation-review-v1` storage rejects malformed/source-mismatched records and concurrent stale writes. Recovery offers a separate backup and confirmed review-only reset; no raw learner response is stored. Formal CSV/JSON, schema v6, A1/A2 sources and preserved user changes remain untouched.

- Added user-authorized, optional en-US browser transcription to conversation answers only. Consent and an explicit start precede every capture; interim/final preview cannot auto-submit. Insertion remains explicit and the existing input is editable afterwards.
- Browser/provider failures preserve typing and do not count as wrong answers. Capture has bounded lifetime, stop/cancel, hidden-page/unmount cleanup and stale-callback guards. Speech-synthesis playback stops before capture; no recorded file, transcript persistence, paid API or pronunciation score is added.
- Added backward-compatible `usedSpeech` and `speechTurns` records; speech-assisted turns cannot become independent typed recall via retry or reload. Formal curriculum, schema v6, course completion, vocabulary mastery, source JSON/CSV and unlock rules are unchanged.

- Added household routines, obligations, help requests and shared chores as the next four A2 pilot lessons. New canonical lexemes per lesson: 3/2/2/2, all already in the 3000-word library. Added eight transfers, four recognition/four response exercises, five passage sentences and four comprehension questions.
- Added a separate prepared conversation bridge: four scenarios and 12 learner turns covering introductions/follow-up, shopping, meeting arrangements and household cooperation. All partner/accepted phrases receive bilingual preparation. New conversational phrases are supplemental teaching, not formal occurrences; curated alternatives are not unrestricted dialogue grading.
- Conversation recall is stored separately from schema v6, with source/date-bound activity and first-answer/support history. Assisted recall is due the following local date; independent recall three dates later. Conversation never writes course completion, CEFR passes or vocabulary mastery.

- Added 60 editable original bilingual application batches, strict target/form/ID/reproducibility validation, isolated lazy loading, full-sentence keyboard practice and schema-v6 application evidence. Extra words fail; wrong-first, pasted or revealed answers cannot be repaired into clean same-day credit. Added source revision checks and held-Enter guards. Independent machine-assisted samples prompted US `fill out` and Taiwan Chinese/sense corrections, not human approval.
- Added a licensed, hash-pinned CMUdict subset with independent KK/IPA conversion and all pronunciation variants. Source/variant/status tests and offline generator checks protect provenance without claiming complete phonetic accuracy. See `docs/vocabulary-application-kk-2026-10-15.md`.

- Built the full 3000-word candidate target/library, keeping the original 132 target objects unchanged. Added a lazy-loaded searchable library with recognition/spelling practice, source-checked global progress, deterministic generation, complete source notices, and focused plus full browser regression coverage. See `docs/vocabulary-3000-delivery-2026-10-15.md` for limits and actual results; this is not human language approval or complete sentence-application coverage.
- Added explicit related-topic recognition practice for all 24 existing reference-only target words. Batches have at most five words, four distinct same-topic choices, answer confirmation/feedback, keyboard focus, and visible cross-date status. Only the first submitted answer per canonical word/local day can create recognition evidence; wrong-first answers cannot become correct by reloading, and expired-day submissions are rejected.
- Kept recognition separate from course completion, review scheduling, CEFR passing, and active spelling/application. No formal CSV/JSON or target records changed. Familiar words remain available on later dates after unfinished words; reloading rebuilds remaining work from saved evidence rather than persisting copied answers.
- At the earlier 132-target checkpoint, corrected baseline counts to 108 curriculum / 24 reference with 2868 then unbuilt. That incremental import plan is superseded by the user-requested full candidate catalog above; human review and existing provenance are still open.
- Improved scoped learning contrast: shared secondary text, primary actions, placeholders, input/choice boundaries, and correct/wrong/revealed states retain the existing layout and warm decoration. Action focus outlines appear immediately instead of fading in. The new browser suite measures real computed styles and preserves explicit text feedback.
- Completed the scoped Daily/weakness keyboard follow-up: stable item keys reapply input/choice autofocus, checked weakness actions receive focus, and the Daily summary is keyboard-completable. Repeated Enter now cancels native button activation instead of silently falling through to a browser click.
- Added six desktop/mobile keyboard scenarios covering consecutive recognition items, same-type weakness queues, three-error application reveal without mastery, selection-focus stability, summary completion, and the existing full unit-assessment/reload flow. No curriculum, scoring, storage, schedule, or unlock contract changed.
- Added skip navigation, content-heading focus, pending-count descriptions, and explicit choice/result focus for reading, text-response, and passage-comprehension stages. Existing home/course autofocus, related-word shortcut focus, and all learning/data contracts are preserved.
- Fixed desktop content-management overflow exposed by the new browser tests; the editable table scrolls inside its own container instead of widening the page. Final verification passed 183 unit tests and 114 desktop/mobile browser cases.
- Selectively integrated the D-drive third A1 batch: seven transfers, four reading-recognition exercises, and four text responses at `a1-u1-l2`, `a1-u2-l3`, `a1-u3-l3`, and `a1-u7-l4`. No CSV, stable course ID, A2 unit, vocabulary target, alias implementation, or progress schema changed.
- Removed synonymous identity distractors from the early name lesson: it has one legitimate transfer and two distinct-name options, not untaught names or artificial wrong answers. The place response uses `I am at home.` instead of an overlapping school-by-bus distractor.
- Added ordered slots and pending-review metadata to the new exercises, recognition-option prerequisite rejection, and explicit previous-source/pattern review context. A1 trial stages visibly state that human review is still pending.
- Preserved the first two A1 exercise batches and original Unit 8 passage with independent digest checks; retained all existing advanced/alias safeguards. The D-drive alternative alias code and older A2/target/context snapshots were not copied.
- Published consistency commits `20a563d`, `bb9439f`, `25d3954`, and search-alias commit `82046f6` on the feature branch at the user's request, without changing `main`.
- Fixed course-to-related-vocabulary navigation retaining an unrelated search/filter and hiding the current course word. The shortcut now clears those constraints, focuses the matching card after rendering, honors reduced motion, and returns to the exact course stage without adding learning evidence.
- Added named keyboard-operated word disclosures, linked hidden regions, selected-topic/main-navigation semantics, polite result-count/no-result announcements, and stronger focus indicators. Related-page secondary text is darker; the layout and course data are unchanged. This is a scoped improvement, not a completed accessibility/conformance audit.
- Prevented ESLint from scanning generated worker, build, coverage, and browser-report files, with a regression test proving maintained application/test sources remain linted.
- Inventoried the D-drive patch without altering either copy. Its A1 batch adds seven transfers plus four recognition/four response exercises; the A1 CSV is byte-identical here. Its alternative alias implementation and older A2/target metadata must not be copied wholesale over the newer active branch.
- Added normalized occurrence/chunk search aliases plus generic curated Chinese aliases. `brothers`, `my brother`, `我的哥哥`, and `我的弟弟` find the canonical `brother`; ready A2 aliases make `last night`/`昨晚` find `night`. Canonical/source fields, reference QA, and local progress remain unchanged; A2 failure leaves base A1 search working.
- Completed a machine-assisted curriculum-consistency repair without adding units, changing A1 data, or enabling B1/B2. A2 article/chunk explanations and one ambiguous shopping distractor were corrected in both generators and generated sources.
- Corrected 24 B1/B2 be/have lexeme references, contextual POS, proper lemma casing, punctuation, and mismatched transfer constructions. Replaced all 64 generic passage questions with content-specific wording while preserving their question IDs.
- A final independent read-through prompted another small editorial pass: clarified question/answer alignment and negative travel experience, and replaced an ambiguous passive comparison with `The report was completed earlier than the manager expected.` This is machine-assisted review, not human approval.
- Added 20 regression tests overall (150 to 170), including complete rebuild-array validation, punctuation-safe grading, formal-passage prerequisite boundaries, text-response source IDs, actual chunk usage, optional stable-ID formats, and distinct deferred/uncovered pattern counts.
- Kept all 814 occurrence answers and structural IDs/order unchanged. B1/B2 token/sense IDs changed for 23/20 rows as part of the lexical repair; those disabled levels need a legacy-statistics compatibility review before re-enablement.
- Replayed all three A2/B1/B2 generators and confirmed all 17 CSV/JSON data files remained byte-identical. Full quality checks, 88 desktop/mobile browser cases, and seven Windows launcher scenarios passed.
- Added A2 unit 5「工作與約會安排」as four lessons and 27 one-word occurrences without changing A1 or A2 unit 1.
- Added four recognition exercises, eight sentence transfers, four text responses, and a four-sentence appointment passage with five comprehension questions.
- Extended A2 sequential unlocking, full post-unit-1 browser traversal, target-baseline projection, catalog counts, and generator reproducibility to unit 5.
- Scoped full GitHub Actions execution to pull requests targeting `main` and pushes to `main`; preserved both required-check display names and added same-change concurrency cancellation.
- Pinned checkout, Node setup, and Playwright artifact upload to the full commit SHA of their verified stable v7 releases without changing Node 22, npm cache, test scope, read-only permissions, or seven-day artifact retention.
- Added bounded weekly npm and GitHub Actions Dependabot checks with no auto-merge or automatic rebase.
- Consolidated the duplicate `app/daily-session.ts` architecture entry and recorded dependency and remote-branch reviews in `docs/dependency-review-2026-09-04.md` and `docs/remote-branch-review-2026-09-04.md`.
- Confirmed workflow concurrency against PR #3: run `33838507891` was cancelled after commit `1707046` started replacement run `33838975879`; no unrelated PR or `main` run shared that concurrency key.
- Centralized clean application eligibility and applied it to sentence rebuild, pattern transfer, Daily Review application, and weakness application without changing recognition, course completion, CEFR unlock, or protected curriculum data.
- Split recall, rebuild, and pattern-transfer paste state so one exercise cannot contaminate the next; Daily Review continues to persist its per-item paste state across F5.
- Added desktop/mobile storage-level browser coverage for manual application, pasted application with F5, weakness practice, pattern-example isolation, rebuild completion, and duplicate evidence IDs.
- Returned active development to A1/A2 and paused B1/B2 manual review.
- Added target generation, validation, per-level indexes, alias resolution, audit, and coverage reporting.
- Added schema v6 global evidence wiring to course detail, word recall, reading recognition, sentence rebuild, pattern transfer, and explicit related-word details.
- Added protected-file hashes, disabled-runtime checks, canonical counting tests, mastery tests, backup/reload tests, and desktop/mobile browser coverage.
- Fixed an A2 Playwright hydration race by seeding storage before navigation and waiting for observable A2/map readiness.
- Added executable regression coverage for third-attempt near-miss reveal, cross-input boundary movement, empty-box Backspace, and Windows CRLF-safe protected-source checks.
- Added Taiwan UTC+8 local-date regressions, fixed near-miss/unrelated spelling hint progression, same-day daily-session restore/expiry checks, source-reference validation, and desktop/mobile F5 session flows.
- Hardened Daily Learning restore so an A1/A2 session always reopens its exact recorded level and lesson, missing lessons fail safely without fallback, and resume never creates completion or evidence.
- Persisted completed weakness lexeme IDs so repeated F5 resumes at the first unfinished item and an already-finished weakness queue proceeds to summary.
- Replaced the rolling last-seven-date display with a deduplicated device-local Monday-to-Sunday count shared by the home card and top bar.
- Replaced passive Daily review completion with an evidence-backed, occurrence-resolved active queue and deterministic recognition choices; zero due items skip directly to the lesson.
- Added live-page midnight expiry and active-time lifecycle handling so yesterday's session cannot create evidence or completion after the local date changes.
- Reviewed all 126 baseline entries without changing the target file; documented unresolved provenance rather than inventing source or license claims.
- Removed all temporary sentence-audit workflows and UX patch helpers from the final feature tree; permanent audit scripts and CI remain.
- Updated the roadmap, architecture, decisions, task priorities, memory, README, changelog, and B1/B2 status documentation.
- Replaced the CI system-package installation step with an explicit check of the GitHub runner's preinstalled Chrome and bounded the Playwright job at 30 minutes after the Ubuntu package mirror stalled before tests could start.

## Known Limits

- Fresh2026-10-15 `npm audit --json` exited1:29 affected package names (24high/2moderate/2low/1critical). The critical package is existing `next@16.2.6`; actual Vinext reachability was not assessed. Added dev-only `opencc-js@1.3.1` has no reported advisory. No untested framework upgrade or security-clean deployment is claimed.
- Two remote feature branches are not completely merged and must remain pending manual review: `feat/a2-shopping-comparison` and `feat/daily-learning-weakness-center`. Seven merged `feat/*` branches plus the merged PR1 fix branch are deletion candidates only; no branch was deleted.
- The target catalog and applications each contain 3000 words, but neither full collection has received human semantic/phonetic/CEFR approval. Guided applications compare one reference sentence, not all valid translations or free writing. A candidate's other words/grammar are not certified as previously taught formal prerequisites.
- KK/IPA conversion is not an authoritative dictionary transcription. 559 words retain multiple unselected pronunciations; syllabification/stress are candidates. Original related-word phonetics and symbol audio still need separate review.
- The original 126-entry content-metadata pass is complete, but the six new unit 5 targets still need equivalent review. All 108 curriculum targets need license evidence; 24 reference-only entries still need an external lexical source and user language/phonetic review. The progress-page note correctly keeps the baseline待審.
- A2 units 1–6 remain pilot content; units 7–10 are blueprint-only. The user's continuation authorizes a bounded unit 6 trial, not retrospective human approval.
- Original A1 and protected A2 unit 1 passage data retain a legacy exception for absent option/prerequisite metadata. Their unannotated options do not receive the newer complete prerequisite check; this is not a claim of automatic language approval.
- All 27 related-vocabulary reference records still need phonetic/content review. Current A1/A2 deduplication leaves 23 reference-only lexemes after Saturday enters unit 6; protected target-source metadata remains unchanged.
- B1/B2 remain disabled: known machine-detectable defects were repaired, but English/Taiwan Chinese naturalness, passage coherence, phonetics, distractor quality, and CEFR placement still require human review. The repair does not certify all content as error-free.
- Most word/sentence audio still uses browser speech fallback.
- Native screen-reader testing and a complete contrast audit remain open. Home actions and core lesson input/detail/rebuild/recognition states now have scoped contrast checks; gradients, map-specific accent colors, phonetic-specific colors, and forced-colors mode need further review. Daily/weakness transitions and the existing assessment path join skip navigation, screen headings, counts, and reading/response/passage choices in scoped automated keyboard coverage. These checks do not establish full accessibility compliance.

## Next Concrete Step

Try the focused conversation review on a real Windows/mobile device, then revisit a full scenario on a later date to check independent recall. Also try optional speech input with a real microphone over localhost/HTTPS: permissions, recognition quality, cancellation and network failure. Automated checks do not certify learning gains or speech accuracy. Review the four scenarios and A2 unit 6 before expanding; B1/B2 remain disabled. Publishing this follow-up requires a new user request. Keep the preserved D-drive worktree, backup and stash unchanged.

## Verification

### Focused review release recheck (2026-10-23)

- `npm run verify`: exit 0; all 12 gates completed, including build, curriculum/source checks, 281 unit tests (0 failed/skipped), lint and TypeScript.
- `npm run test:e2e -- tests/e2e/conversation-review.spec.ts`: exit 0; 14 passed (7 desktop / 7 mobile), 0 failed/skipped, 28.0 seconds. The first sandboxed attempt exited 1 before running tests because Vinext could not connect to localhost (`EACCES`); the authorized unrestricted rerun passed.
- Read-only independent scope review found no blocking P1/P2 issue. All 15 changed/new files belong to focused review; protected data and formal progress remain unchanged. The original 20 tracked edits remain uncommitted in the preservation worktree.
- Full PR CI is still required before merge. The earlier 246-case full browser run below is historical, not a new local full-suite run. Human learner/device and language QA remain open.

### Focused conversation review (2026-10-16)

- Pre-change `npm run verify`: exit 0, all 12 gates, 274 unit tests / 0 failed. Log: `tmp/conversation-review-baseline.log`.
- Focused `npm run test:e2e -- tests/e2e/conversation-review.spec.ts`: exit 0, 14 passed / 0 failed (7 desktop 1440×900, 7 mobile-width 375×812). Covers actual UI, Enter/focus, third-error retype, same-day reload, midnight rejection, invalid/quota storage, cross-tab protection and prerequisites. Overview/active/summary screenshots were generated and inspected on both viewport sizes.
- Independent scoped code review found no P1/P2 blocker. New source guards and seven unit cases preserve old conversation/formal records; real-device usability and learning outcomes still need user review.
- Final `npm run verify`: exit 0, all 12 gates completed; 281 unit tests passed / 0 failed / 0 skipped. Context, project/data audits, three reproducible vocabulary builds, curriculum validation, production build, ESLint and TypeScript all passed. Log: `tmp/conversation-review-verify-final.log`.
- Full `npm run test:e2e`: exit 0, 246 passed / 0 failed / 0 skipped in 12.4 minutes; 123 desktop and 123 mobile-width cases. Log: `tmp/conversation-review-e2e.log`. Earlier focused quota coverage exposed an ambiguous alert locator in the test, corrected to the actual storage-failure message without weakening data-preservation assertions.
- `git diff --check`: exit 0. Protected-path diff: empty for all `public/data`, `app/page.tsx`, formal learning/vocabulary progress modules and `package-lock.json`. No dependency install, Windows launcher behavior change, real microphone/provider test, commit, remote push or merge was performed in this follow-up.
- Added: `app/conversation-review.ts`, `app/conversation-review-panel.tsx`, `tests/conversation-review.test.mjs`, `tests/e2e/conversation-review.spec.ts`. Updated: conversation panel integration, scoped CSS, unit-test command and the eight context/readme documents listed by Git status.

### Optional conversation speech input (2026-10-16)

- Pre-change `npm run verify`: exit 0, all 12 gates, 252 unit tests / 0 failed. Active C-drive checkout clean at main `32337bf`; separate D-drive checkout still contains its 20 preserved unstaged tracked files.
- New focused injected-recognition Playwright: exit 0, 22 passed / 0 failed (11 desktop, 11 mobile-width). An initial sandbox server bind failed with EACCES; the authorized local-server rerun completed. No real microphone or external recognition request was used.
- Initial lint exposed synchronous capability state inside an effect and a test `this` alias; fixed with a hydration-safe external-capability snapshot and the actual fixture cleanup. A later TypeScript check identified getter narrowing after cancel; fixed by re-reading the controller reference. No rule was disabled.
- Final `npm run verify`: exit 0, all 12 gates; 274 unit tests / 0 failed / 0 skipped, production build, lint and TypeScript passed. Logs: `tmp/speech-verified-final.log`.
- Full `npm run test:e2e`: exit 0, 228 passed / 0 failed / 0 skipped in 11.2 minutes, 114 desktop and 114 mobile-width cases. Final scoped speech rerun covers the later cleanup hardening and two added failure cases. Real microphone/provider/device QA remains unperformed.
- Final scoped speech Playwright: 26 passed / 0 failed / 0 skipped in 34.7 seconds (13 per viewport). The preceding expanded run had 24 pass / 2 fail because the new storage test expected the overview recovery heading rather than the active-flow recovery heading; exact-title correction preserved all data-safety assertions. Desktop/mobile preview screenshots were inspected without horizontal clipping. See `docs/conversation-speech-input-2026-10-16.md` for usage and evidence.

### Everyday conversation and household pilot (2026-10-16)

- Baseline `npm run verify`: exit 0, all 12 gates, 234 unit tests, 0 failures. PR #14's protected quality/browser jobs were confirmed successful before normal merge.
- First integration unit run: 232 pass / 5 fail. Three failures exposed missing unit presentation, one was a dependent runtime-loader failure and one an outdated A2 baseline hash. Added the actual unit presentation and updated extended-source hashes while preserving per-unit 1–5 object hashes; no validator was removed.
- Pre-browser `npm run verify`: exit 0, all 12 gates; 251 unit tests, 0 failed/skipped, build, lint and TypeScript passed. Independent review strengthened SHA-256 revision binding, same-date/source-specific results, unknown-result rejection and midnight recovery.
- First full `npm run test:e2e`: exit 1, 204 passed / 2 failed in 10.4 minutes. Both failures were the new household passage on desktop/mobile: display-only fifth-sentence IDs were incorrectly treated as unfinished lesson prerequisites. Repaired against formal lesson IDs with fail-closed custom prerequisites; no passage sentence, assertion or scoring requirement was removed.
- Post-fix household Playwright: exit 0, 6 passed / 0 failed, including all four lessons, five-sentence rebuild, four comprehension questions and reload persistence in both viewports. Post-fix `npm run verify`: exit 0, all 12 gates, 252 unit tests / 0 failed / 0 skipped.
- Final full `npm run test:e2e`: exit 0, 206 passed / 0 failed / 0 skipped in 10.2 minutes: 103 desktop (1440×900) and 103 mobile-width (375×812) Chrome cases. No runtime/data changes followed this run. See `docs/everyday-conversation-2026-10-16.md` for content, commits, actual commands and remaining human-review boundaries.
- Windows launcher scenarios: exit 0, 7 passed / 0 failed; missing-Node/install-failure paths use isolated command fixtures. Desktop/mobile conversation screenshots were inspected without horizontal clipping.
- The separate D-drive checkout was inventoried read-only: its original 20 unstaged files remain; no files there were changed.

### Sentence applications and KK candidates (2026-10-15–16)

- Pre-edit `npm run verify`: exit 0, 215 unit tests. PR #13 separately passed both protected GitHub CI jobs before merging to main `7bf6e03`.
- Final runtime `npm run verify`: exit 0, all 12 gates including both new offline generation checks, production build, 234 unit tests (0 failed/skipped), lint and TypeScript. After the test-only clock fix, lint and `tsc --noEmit --incremental false` were rerun: exit 0.
- Focused supplemental E2E: exit 0, 14 passed (7 desktop/7 mobile). Initial attempt was 5 passed/7 failed because the new test clicked navigation before homepage readiness; observable readiness waits fixed the test without dropping assertions.
- First full E2E: exit 1, 179 passed/1 failed. A pure keyboard fixture began at Taiwan 23:59:59.297 and legitimately expired during hydration after midnight. Fixed only that fixture's clock to noon; preserved all product rules and the dedicated midnight tests.
- Final full `npm run test:e2e`: exit 0, 180 passed (90 desktop 1440×900/90 mobile 375×812), 0 failed/skipped, 9.2 minutes. Screenshots of new desktop/mobile application and KK sections were inspected.
- Windows launcher suite: exit 0, 7 passed; dependency-install error paths use isolated command fixtures. Offline phonetic-source verification: exit 0. No fresh `npm ci`, new dependency version, deployment or security-clean claim.
- A1/A2 formal source files, original v1/v2 targets and original library JSON are unchanged. D-drive's separate 20 unstaged tracked files remain untouched. Full source/QA/verification detail: `docs/vocabulary-application-kk-2026-10-15.md`.

### Full 3000-word candidate library (2026-10-15)

- Final `npm run verify`: exit 0; all ten gates passed, including reproducible vocabulary generation, source/catalog audits, curriculum validation, build, 215 unit tests (0 failed/skipped), lint and TypeScript. Protected A1/A2 course files and the original v1 targets remain unchanged.
- Focused vocabulary browser tests: exit 0, 20 passed (10 desktop / 10 mobile). The initial restricted Workers runtime startup failed before tests; after approved local execution, two test-only first-page navigation assumptions were corrected without removing assertions.
- First full browser run: exit 1, 164 passed / 2 failed because an older backup test expected the former partial-catalog caption. Updated only the caption/coverage expectations while retaining all export/import evidence assertions.
- Final complete `npm run test:e2e`: exit 0, 166 passed (83 desktop 1440×900 / 83 mobile 375×812), 0 failed/skipped, 8.1 minutes. Desktop/mobile screenshots were also inspected. All existing learning, unlock, Daily, review, backup and progress-reload cases remain covered.
- Windows launcher scenario suite: exit 0, seven scenarios passed. Dependency-install branches use isolated command doubles; this is not a fresh network installation on another device. No full `npm ci` was run this turn.
- Fresh `npm audit --json`: exit 1, 29 affected packages (1 critical / 24 high / 2 moderate / 2 low), including the existing Next dependency. The added dev-only OpenCC package has no advisory. Compatibility/security upgrade work remains separate; no security-clean deployment claim.
- Read-only independent review found no remaining blocking code/provenance-publication issue. Final whitespace-only cleanup leaves both runtime JSON files unchanged; the snapshot manifest is rebuilt after trimming an extra baseline EOF line. Full details and limitations: `docs/vocabulary-3000-delivery-2026-10-15.md`.
- This turn did not rerun a complete pre-edit baseline. The earlier 196-unit / 146-browser results below are historical, not the new 3000-word verification.

### Reference recognition and feature publication (2026-10-15)

- Fresh baseline `npm run verify`: exit 0, all nine gates and 183 unit tests passed.
- Initial restricted-environment browser attempt exited 1 before any test because Workers runtime startup failed. Repeating the scoped contrast suite in the local test environment passed: exit 0, 6 tests (3 desktop / 3 mobile), 0 failed/skipped, 20.6 seconds. Commit `2c08eae` was then pushed normally and its remote hash read back.
- First reference browser run: exit 1, 8 passed / 2 failed. The cross-date scenario exposed unseen words outranking yesterday's partially learned word. Queue ordering now treats unseen/exposed words as the same unfinished priority before mastered words; curriculum priority remains stable within each group.
- Initial focused pure-function checks: exit 0, 9 passed / 0 failed/skipped. The final suite adds four regressions for overlapping meaning choices, unfinished-word priority, impossible calendar dates, and source/answer tampering, for 13 new tests. All 24 reference targets retain four valid options without shortening their correct translations.
- Final `npm run verify`: exit 0; all nine shared gates passed, including build, 196 unit tests (0 failed/cancelled/skipped), lint, and TypeScript. No protected course/target data or dependency lockfile changed.
- An earlier full-browser attempt was interrupted (exit 1) after a test-server hot-reload failure in Vinext's `RemoveDuplicateServerCss` (`useEffect` on null); it is not counted as a passing run. The source was then frozen and the server/test process restarted for a complete clean run.
- Clean full `npm run test:e2e`: exit 0, 146 passed (73 desktop 1440×900 / 73 mobile 375×812), 0 failed/skipped, 7.4 minutes. All existing A1/A2, Daily, review, import/export, unlock, and reload cases remain covered; the 14 new browser cases verify reference practice, cross-date credit, wrong-first persistence, midnight expiry, failed target loading, keyboard controls, and viewport width.
- Visually inspected both practice and summary screenshots at desktop and mobile widths. Read-only independent implementation review found no blocking issue. Final context and whitespace checks passed; no dependency upgrade, source import, human-language approval, Windows launcher scenario rerun, main merge, or deployment is included in this round.

### Scoped learning contrast (2026-10-04)

- Started from clean, freshly synchronized main `28b41d0` on `codex/learning-contrast`. Read-only D-drive verification still reports the original 20 unstaged files. PR #10's merged commit and timestamp were confirmed from GitHub.
- Baseline `npm run verify`: exit 0, all nine gates and 183 unit tests passed. Baseline navigation/related-vocabulary browser suite: exit 0, 28 passed (14 per viewport), 0 failed/skipped, 48.4 seconds.
- First new focused run: exit 1, 4 passed / 2 failed because the intro translation selector also matched the source-note paragraph. Narrowed the selector; no product content was changed.
- Second focused run: exit 1, 4 passed / 2 failed. Measuring immediate keyboard focus exposed an actual fading outline from `transition: all`; action buttons now animate only hover-related properties, not outlines.
- Corrected focused `npm run test:e2e -- tests/e2e/learning-contrast.spec.ts`: exit 0, 6 passed (3 desktop 1440×900 / 3 mobile 375×812), 0 failed/skipped, 19.7 seconds. Coverage includes actual lesson entry, placeholder, focus, detail Enter badge, mixed correct/wrong rebuild, third-attempt reveal, result, and recognition states.
- Final `npm run verify`: exit 0; context, project/vocabulary audits/report, curriculum validation, build, 183 unit tests (0 failed/skipped), lint, and TypeScript passed. Protected `public/data`, `app/page.tsx`, dependencies, and progress contracts are unchanged; `git diff --check` exited 0.
- Full `npm run test:e2e`: exit 0, 132 passed (66 desktop / 66 mobile), 0 failed/skipped, 6.7 minutes. This includes all existing A1/A2 learning, passage, keyboard, import/export, progress/reload, Daily, and related-vocabulary regressions. Desktop and mobile recall/detail/rebuild screenshots were also visually inspected.
- Final test-only refinement waits for hover animations to finish before sampling, then moves the pointer away for focused-text checks; immediate outline assertions remain unwaited. Repeated focused suite: exit 0, 6 passed / 0 failed/skipped, 20.7 seconds. Independent scoped review found no blocking contrast or calculation issue.
- No dependency install/audit, Windows launcher scenario rerun, generator replay, native screen-reader session, GitHub publication, or deployment is claimed for this CSS/test-only follow-up.

### Main integration and Daily keyboard follow-up (2026-10-04)

- Refreshed `origin/main` and confirmed the original integration candidate `1f98e7f` was 13 commits ahead with no main-only commits. Created PR #10 rather than bypassing main's two required checks; no admin override, force push, protection change, or D-drive write.
- Baseline `npm run verify`: exit 0, all nine gates and 183 unit tests passed. Baseline full `npm run test:e2e`: exit 0, 114 passed (57 desktop / 57 mobile) in 6.6 minutes. Independent scoped code review found no blocking regression in the existing integration candidate.
- New desktop keyboard draft baseline: exit 1, six failures. Five exposed absent Daily/weakness focus behavior or selectors; the assessment case made an incorrect reload-page assumption. The assessment implementation was not changed. The fixture was corrected to seed once and preserve earned state on reload.
- Initial source typecheck: exit 1 because an item key was briefly attached to the unrelated recall section; corrected to the Daily section, then typecheck exited 0. No such intermediate state was committed.
- First corrected desktop/mobile focused run: exit 1, 10 passed / 2 failed because an exact accessible-button-name assertion omitted the existing `前往` prefix. Corrected the assertion, not the product label.
- Final focused `npm run test:e2e -- tests/e2e/daily-keyboard.spec.ts`: exit 0, 12 passed (6 desktop 1440×900 / 6 mobile 375×812), 0 failed/skipped, 14.5 seconds. Real repeated keydown events are tested across the answer/result/next-item boundary, not just synthetic source checks.
- Final local `npm run verify`: exit 0; all nine gates completed, 183 unit tests passed / 0 failed / 0 skipped, build/lint/typecheck passed. The full browser matrix now contains 126 cases; its final local and protected CI outcomes are linked from PR #10 before merge.
- Protected comparison against `1f98e7f`: no changes in `public/data`, `package.json`, or `package-lock.json`; progress remains v6. `git diff --check` exited 0. Final whole-project local/CI gates are recorded in the PR verification receipt before merge.
- No new dependency audit/install, Windows launcher scenario run, generator replay, deployment, or native screen-reader review is claimed for this keyboard-only follow-up.

### Navigation and choice-focus verification (2026-10-04)

- Baseline at `15de3ad`: `npm run verify` exit 0, 182 unit tests before edits. The active checkout was clean.
- First new browser suite: exit 1, 7 passed/3 failed. Two test-only lesson-title assumptions were corrected against the existing source; the remaining failure exposed actual desktop content-management overflow. A `minmax(0, 1fr)` grid track now keeps the wide table inside its existing scroll container without hiding table columns or changing data.
- Focused suite after correction: exit 0, 10 passed (5 per viewport). The final matrix additionally checks delayed vocabulary readiness and strengthens selection, input autofocus, accessible-description, table-scroll, and progress-neutrality assertions.
- Final `npm run verify`: exit 0, all nine gates completed. Unit tests: 183 passed, 0 failed, 0 skipped. Context, project/vocabulary audits/report, curriculum validation, build, lint, and TypeScript all exited 0.
- Final `npm run test:e2e`: exit 0, 114 passed in 6.7 minutes, 0 failed, 0 skipped: 57 desktop (1440×900), 57 mobile (375×812). All 12 new navigation/choice-focus checks passed alongside the existing 102 learning/vocabulary cases, including exact related-card focus, reload persistence, and level isolation.
- Protected source comparison: `git diff --exit-code -- public/data package.json package-lock.json` exit 0. No course/reference/target data, dependencies, progress contract, or unlock rule changed.
- `git diff --check`: exit 0. The D-drive checkout still has its original 20 unstaged tracked files; this cycle did not write or stage that copy.
- Push/readback: normal authenticated Git confirmed code commit `87249fd` on `codex/curriculum-consistency`; `main` remained `3402e4b`. The initial restricted push of the A1 batch failed with Schannel `SEC_E_NO_CREDENTIALS`; the approved normal-environment retry succeeded without weakening transport security.

Browser coverage uses isolated test storage, not the learner's real profile. Native screen-reader review, dependency/launcher checks, generator replay, main integration, and deployment are outside this follow-up. Feature publication is checked by Git remote readback, not inferred from local test results.

### A1 third-batch integration verification (2026-10-04)

- Baseline at `dc032f2`: `npm run verify` exit 0, 175 unit tests. The active checkout was clean; D had 20 unstaged tracked files. Post-integration SHA-256 comparison of all 20 D files matched the initial inventory exactly; none were staged, rewritten, or deleted.
- First focused browser run: exit 1, 6 passed/2 failed because the new test expected the old `go-to-place` label on the transport lesson's introduction. Corrected the assertion to the actual unchanged CSV grammar (`go to + 地點 + by + 交通工具`), not the product data.
- First combined unit run: exit 1, 181 passed/1 failed because a deferred-coverage regression fixture retained the old numeric count. It now verifies the exact remaining deferred IDs; the separate 20/8/8/0/12 coverage assertion remains strict.
- Final focused third-batch browser run: exit 0, 8 passed (4 desktop, 4 mobile). Each completes recall/rebuild/recognition/transfer/response and reloads preserved completion/pattern statistics. The be-review test deliberately gets one transfer wrong and verifies the actual review-pattern label plus 3 attempts/2 correct, not the original lesson's have-pattern.

| Executed final check | Exit | Result |
|---|---:|---|
| `npm run verify` | 0 | All nine gates completed |
| `npm run check:context` | 0 | 10 required context files; rerun after documentation changes |
| `npm run audit:project` | 0 | 4 levels, 814 occurrences, 12 sources; no orphan/duplicate files |
| `npm run audit:vocabulary` / `report:vocabulary` | 0 / 0 | 132 targets; 110 A1/A2 union lexemes; no invalid IDs/lemma conflicts |
| `npm run validate:curriculum` | 0 | A1 8/32/145; A2 5/20/122; retained B1 8/32/249 and B2 8/32/298 |
| `npm run build` | 0 | Production build succeeded |
| `npm run test:unit` | 0 | 182 passed, 0 failed, 0 skipped; rerun after the final test-label edit |
| `npm run lint` / `npm run typecheck` | 0 / 0 | No lint errors/warnings or TypeScript errors |
| Focused third-batch Playwright | 0 | 8 passed, 0 failed |
| `npm run test:e2e` | 0 | 102 passed in 5.8 minutes: 51 desktop (1440×900), 51 mobile (375×812); 0 failed, 0 skipped |
| `git diff --check` | 0 | No whitespace errors |

Only the two A1 exercise JSON files changed in `public/data`; all formal CSVs, A2/B1/B2 JSON, target/reference/topic data, and original A1 exercise records remain protected. The added trials reuse existing schema fields, and no learner-progress migration is involved. Independent machine-assisted content/code reviews found no remaining actionable issue in this batch; human language/difficulty approval remains pending. No dependency update, `npm ci`, launcher scenario rerun, generator replay, GitHub Actions run, push, main merge, or deployment was performed in this follow-up.

### Keyboard and publication follow-up verification (2026-10-04)

- Baseline `npm run verify`: exit 0, 174 unit tests before changes.
- Regression-first desktop shortcut test: exit 1, one failure before the fix because the prior `December` search hid the course's `Monday` card. The strengthened test passes after the search/filter reset.
- The first parallel verification attempt exited 1 during lint, reporting 248 errors/2773 warnings with minified hook names. Isolated lint then passed at the same source state; the exact transient generated-file path was not retained. Known generated paths are now explicitly excluded, and a direct ESLint API test proves maintained app/script/test paths remain included. Final verification ran serially after the browser runner stopped.

| Executed final check | Exit | Result |
|---|---:|---|
| `npm run verify` | 0 | All nine gates completed after the final style changes |
| `npm run check:context` | 0 | 10 required context files |
| `npm run audit:project` | 0 | 4 levels, 814 occurrences, 12 sources; no orphan/duplicate files |
| `npm run audit:vocabulary` / `report:vocabulary` | 0 / 0 | 132 targets; 110 A1/A2 union lexemes; no invalid IDs/lemma conflicts |
| `npm run validate:curriculum` | 0 | A1 8/32/145; A2 5/20/122; retained B1 8/32/249 and B2 8/32/298 |
| `npm run build` | 0 | Production build succeeded |
| `npm run test:unit` | 0 | 175 passed, 0 failed, 0 skipped |
| `npm run lint` / `npm run typecheck` | 0 / 0 | No lint errors/warnings or TypeScript errors |
| Full `npm run test:e2e` | 0 | 94 passed, 0 failed; 47 desktop and 47 mobile, 5.4 minutes |
| Final focused related-vocabulary E2E | 0 | 16 passed, 0 failed; 8 per viewport, including computed focus/selected text contrast |
| `git diff --check` | 0 | No whitespace errors |

The full 94-case run preceded a final related-page color/search-outline correction; all 16 affected browser cases and `verify` were rerun afterward. Browser assertions cover disclosure behavior, scoped contrast samples, normal/reduced-motion shortcut focus, stored-progress neutrality, reload and return behavior, and no horizontal overflow. They do not replace native screen-reader or full contrast review. Formal data files have no changes in this follow-up.

Git push and remote readback succeeded using normal authenticated Git after a restricted-environment Schannel failure. No insecure transport flags were used. No new PR, main merge, deployment, dependency audit, or GitHub Actions execution is claimed: this branch-only push does not trigger the main/PR workflow. Windows launcher implementation/scenarios were unchanged and not rerun in this follow-up; the prior seven-scenario result remains historical.

### Search alias follow-up verification (2026-10-04)

- `npm run verify`: exit 0; all nine gates completed, including 174 unit tests (0 failed, 0 skipped), build, lint, and TypeScript.
- Focused related-vocabulary Playwright: exit 0; 14 passed (7 desktop, 7 mobile), covering canonical labels, Chinese/English aliases, exact progress-storage neutrality, no-result state, no horizontal overflow, and A2 source failure isolation.
- Full `npm run test:e2e`: exit 0; 92 passed (46 desktop, 46 mobile), 0 failed, in 6.1 minutes. Final strengthened unit assertions were rerun: 174 passed, 0 failed.
- Independent read-only review found no actionable source-priority, progress-mutation, A2 isolation, or alias-validation regression. Context and whitespace checks passed; no dependency, launcher, or deployment code changed in this follow-up.
- Formal curriculum/reference data and the 132-entry target file are unchanged from the committed consistency baseline; only the existing topic definition gains two explicit Chinese search aliases.

### Curriculum consistency verification (2026-10-04)

Baseline `npm run verify` passed before changes (150 unit tests). During development, the stronger validators exposed retained B1/B2 metadata defects; old punctuation-sensitive test expectations and one new optional-field fixture were corrected without removing the checks. The final results are:

| Executed check | Exit | Result |
|---|---:|---|
| `npm run verify` | 0 | All nine constituent gates completed |
| `npm run check:context` | 0 | 10 required context files |
| `npm run audit:project` | 0 | 4 levels, 814 occurrences, 12 sources; 0 orphan/duplicate files |
| `npm run audit:vocabulary` | 0 | 132 targets: 108 active, 24 receptive |
| `npm run report:vocabulary` | 0 | 110 A1/A2 union lexemes; 0 invalid target IDs or lemma conflicts |
| `npm run validate:curriculum` | 0 | A1 8/32/145; A2 5/20/122; B1 8/32/249; B2 8/32/298 |
| `npm run build` | 0 | Vinext production build succeeded |
| `npm run test:unit` | 0 | 170 passed, 0 failed, 0 skipped |
| `npm run lint` | 0 | 0 errors, 0 warnings |
| `npm run typecheck` | 0 | `tsc --noEmit --incremental false` |
| `npm run test:e2e` | 0 | 88 passed, 0 failed: 44 desktop 1440×900 and 44 mobile 375×812 |
| Windows launcher scenario script | 0 | 7 passed, 0 failed; missing Node/install failure cases use isolated command fixtures |
| A2/B1/B2 generator replay | 0 | 17 data files remained byte-identical |
| `git diff --check` | 0 | No whitespace errors |

`npm test` was not invoked as a wrapper; both of its commands (`verify` and `test:e2e`) ran. No fresh `npm ci`, dependency audit, GitHub Actions run, or publication is claimed. Browser runs use isolated Playwright storage, not the user's learning profile.

The final wording-only changes affect disabled B1/B2 sources and their generator/regression assertions; `verify` and generator reproducibility were rerun afterward. The 88-case browser run covers the unchanged runtime A1/A2 state, not browser access to disabled B1/B2.

### Previous verification (2026-09-12)

- `npm ci`: exit 0; 494 packages installed and 495 audited; 54 dependency vulnerabilities reported, with no automatic fixes applied.
- `npm audit --json`: exit 1 because 54 affected package names remain (0 critical, 44 high, 8 moderate, 2 low); 11 are direct and 43 transitive. This maintenance PR did not change packages or use a force fix.
- `npm outdated --json`: final exit 1 because 19 direct packages have newer registry versions; the first sandboxed attempt hit npm-cache `EPERM`, and the authorized retry completed successfully. No update was applied.
- `npm run verify`: exit 0; the shared local/CI gate completed every command below after the A2 unit 5 addition.
- `npm test`: not run as a wrapper in this cycle; its two constituent commands, `npm run verify` and `npm run test:e2e`, both ran successfully.
- `npm run check:context`: exit 0; 10 required context files passed UTF-8 and structure checks.
- `npm run audit:project`: exit 0; 4 levels, 814 occurrences, 12 sources, 0 orphan/duplicate data files.
- `npm run audit:vocabulary`: exit 0; 132 unique targets, 108 active, 24 receptive.
- `npm run report:vocabulary`: exit 0; 110 A1/A2 union lexemes, 24 reference-only, 0 invalid target IDs, 0 target lemma conflicts.
- `npm run validate:curriculum`: exit 0; A1 8/32/145, A2 5/20/122, retained B1 8/32/249, retained B2 8/32/298.
- `npm run build`: exit 0; Vinext production build completed.
- `npm run test:unit`: exit 0; 150 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npm run typecheck` (`tsc --noEmit --incremental false`): exit 0.
- `npm run test:e2e`: exit 0; 88 passed across desktop and mobile in 5.8 minutes, 0 failed.
- GitHub Actions YAML parse and contract check: exit 0; triggers are `main` push and target-`main` pull request only, both required-check names are exact, `contents: read` remains, and both Dependabot ecosystems parse.
- Daily Session and active-review browser coverage now includes live midnight expiry with a progress snapshot, active-time reload/offline exclusion, a five-item queue resuming at item three, spelling reveal/retype evidence safety, recognition/application evidence, zero-review skip, leave-without-completion, cross-level exact-lesson restore, and first-unfinished weakness resume.
- Focused clean-application E2E: exit 0; 5 desktop and 5 mobile cases passed, including Daily F5 paste persistence and item-scoped paste isolation.
- Focused related-vocabulary evidence/backup E2E: exit 0; 10 passed.
- Focused A2 hydration/unlock E2E: exit 0; 2 passed.
- Focused A2 unit 5 full-flow E2E: exit 0; desktop and mobile both completed all 16 post-unit-1 lessons and four passages.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
