# Project Progress

## Snapshot

- Updated: 2026-11-09
- Branch: `codex/review-fixes`, created from main `8556936` (PR #18, Unit 7) in the separate worktree `D:CodexToolsEnglishWebeview-fixes-20261109`. It holds the review fixes below and no curriculum change.
- The Unit 8 pilot and local-only review-backup recovery remain uncommitted in `D:CodexToolsEnglishWebenglish-learning-app` on `codex/a2-unit8-continuation`; this branch did not touch that checkout. Merging both later needs a manual merge of the context documents, `app/globals.css`, `package.json`, and the e2e specs both branches edit.
- Preservation copies (`EnglishWeb-preserved-20261016`, `backups*`, `a2-unit8-development`, named stashes) are unchanged. Earlier history lives in `docs/archive/progress-history.md`.
- Active milestone: M7 - Learning Depth and Release Readiness (resilience, performance, and structure work). M13–M15 learner/device, language, and phonetic trials remain open.
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A1 practice: 20 CSV patterns, 8 enabled/covered, 0 uncovered, 12 deliberately deferred; third-batch additions remain `pilot_review_required`.
- A2 on main: 7 units, 28 lessons, 168 occurrences. Unit 7 remains `pilot_review_required`; details in `docs/a2-unit7-pilot-qa.md`.
- Progress schema: v6 with top-level global `vocabularyProgress`

## Vocabulary Baseline

- A1: 145 occurrences, 69 word forms, 75 senses, 15 chunks, 68 canonical lexemes.
- A2: 168 occurrences, 90 word forms, 129 senses, 48 chunks, 85 canonical lexemes.
- A1＋A2 union: 125 canonical lexemes (123 excluding proper names); overlap: 28. The six new union lexemes are before/life/different/now/new/job; Taiwan was already taught in A1.
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

Review fixes (2026-11-09), no curriculum, schema, scoring, or unlock change:

- Storage resilience: every main-shell localStorage access goes through `app/browser-storage.ts`. A full quota or blocked site data no longer unmounts the app; the learner keeps in-memory state, sees one explicit warning, and the top bar shows 「本機進度未能儲存」 until a later write succeeds. `app/error.tsx` is a last-resort recoverable error screen. Previously both failures produced a blank page.
- Dependencies: upgraded Next 16.4.5, React/React DOM/React Server DOM 19.3.1, Vinext 1.4.4 (major), Vite 8.3.6, Cloudflare Vite plugin 1.67.0, Wrangler 4.158.0, Tailwind 4.3.5, Playwright 1.65.0 and related plugins, then applied non-breaking `npm audit fix`. Audit went from 33 (1 critical, 18 high) to 12 moderate. The SSR render test stubs `cloudflare:workers`, which the new Worker bundle imports for optional tracing.
- Vocabulary payload: the browser now loads lossless packed copies from `public/data/packed/` (targets 4.9 MB → 1.2 MB, library 5.4 → 2.1 MB, phonetics 2.6 → 1.0 MB, applications 1.3 → 0.75 MB). Canonical files stay the audited source; `npm run check:packed-vocabulary` fails on stale or non-identical copies. These four requests now revalidate with `cache: "no-cache"` instead of `no-store`.
- Assets and metadata: `og.png` (1.8 MB, 1734×907) became `og.jpg` (64 KB, 1200×628); a brand favicon replaced the unused template icon; template `file.svg`/`globe.svg`/`window.svg` were removed. Social-preview URLs use `NEXT_PUBLIC_SITE_URL` or the routed Host, never `X-Forwarded-Host`.
- Phone layout: the 11-item navigation is one horizontally scrollable row (about 50 px instead of about 390 px) that keeps the current page in view; the home primary action is focused without scrolling past the hero/daily plan; `Enter` badges are hidden on touch-only devices. The lesson intro no longer shows the internal CSV file name.
- Structure: `app/page.tsx` went from 7,473 to about 4,500 lines. Shared types/helpers moved to `app/home-model.ts`/`app/home-widgets.tsx`; every screen renders through a component in `app/screens/`. State, effects, and handlers stay in `page.tsx`; source-level tests read the shell through `tests/helpers/app-source.mjs`.
- Context: completed-work and verification history moved to `docs/archive/`; completed tasks moved to `docs/archive/completed-tasks.md`.

## Known Limits

- `npm audit` on this branch reports 12 moderate advisories and no high/critical ones: the ESLint/typescript-eslint `minimatch` chain (dev tooling) and Vinext → `@vercel/og` → `satori` → `fflate` (social-image generation, unused here). npm offers only downgrades for them. This is not a claim of a security-clean deployment.
- Two remote feature branches are not completely merged and must remain pending manual review: `feat/a2-shopping-comparison` and `feat/daily-learning-weakness-center`. Seven merged `feat/*` branches plus the merged PR1 fix branch are deletion candidates only; no branch was deleted.
- The target catalog and applications each contain 3000 words, but neither full collection has received human semantic/phonetic/CEFR approval. Guided applications compare one reference sentence, not all valid translations or free writing. A candidate's other words/grammar are not certified as previously taught formal prerequisites.
- KK/IPA conversion is not an authoritative dictionary transcription. 559 words retain multiple unselected pronunciations; syllabification/stress are candidates. Original related-word phonetics and symbol audio still need separate review.
- The original 126-entry content-metadata pass is complete, but the six new unit 5 targets still need equivalent review. All 108 curriculum targets need license evidence; 24 reference-only entries still need an external lexical source and user language/phonetic review. The progress-page note correctly keeps the baseline待審.
- A2 units 1–7 remain pilot content; units 8–10 are blueprint-only. The user's 2026-10-27 continuation authorizes a bounded unit 7 trial, not retrospective human approval. Unit 7 English, Taiwan Chinese, KK/IPA, scaffolding and CEFR placement remain pending manual QA.
- Original A1 and protected A2 unit 1 passage data retain a legacy exception for absent option/prerequisite metadata. Their unannotated options do not receive the newer complete prerequisite check; this is not a claim of automatic language approval.
- All 27 related-vocabulary reference records still need phonetic/content review. Current A1/A2 deduplication leaves 23 reference-only lexemes after Saturday enters unit 6; protected target-source metadata remains unchanged.
- B1/B2 remain disabled: known machine-detectable defects were repaired, but English/Taiwan Chinese naturalness, passage coherence, phonetics, distractor quality, and CEFR placement still require human review. The repair does not certify all content as error-free.
- Most word/sentence audio still uses browser speech fallback.
- Native screen-reader testing and a complete contrast audit remain open. Home actions and core lesson input/detail/rebuild/recognition states now have scoped contrast checks; gradients, map-specific accent colors, phonetic-specific colors, and forced-colors mode need further review. Daily/weakness transitions and the existing assessment path join skip navigation, screen headings, counts, and reading/response/passage choices in scoped automated keyboard coverage. These checks do not establish full accessibility compliance.

## Next Concrete Step

Try the review fixes on a real phone and Windows Chrome: the one-row navigation, home landing position, hidden Enter badges, and the storage warning (for example with site data blocked). Then merge `codex/review-fixes` and reconcile the uncommitted Unit 8 checkout with it. Set `NEXT_PUBLIC_SITE_URL` for any deployment. The A2 Unit 7/8, conversation, and vocabulary human-QA tasks in `TASKS.md` remain open.

## Verification

### Review fixes (2026-11-09)

All runs below are local automated checks on `codex/review-fixes` in Windows (Node 24.18, npm 11.16). They are not a real-phone trial or human review.

- `npm run verify`: exit 0, all 13 gates (including the new `check:packed-vocabulary`), production build, 296 unit tests (0 failed/skipped; main had 284), lint and TypeScript.
- `npm run test:e2e` (full matrix, unchanged 4173 wrapper): exit 0, 260 passed, 2 skipped, 0 failed, 11.9 minutes. The two skips are the intentionally device-specific halves of `mobile-layout.spec.ts`.
- New regression coverage: storage quota and blocked-storage specs (both failed against the unfixed page, then passed), phone layout spec, packed-JSON round-trip and loader tests, failure-safe storage helper tests, and an SSR check that `og:image` ignores a spoofed `X-Forwarded-Host`.
- `scripts/test-windows-launcher.ps1`: exit 0, 7 of 7 launcher scenarios passed.
- `npm audit`: 12 moderate, 0 high, 0 critical (was 33 with 1 critical and 18 high).
- Payload: packed vocabulary copies total 5.1 MB instead of 14.2 MB; `og.jpg` is 64 KB. The eager production client bundle is 850 KB raw / 246 KB gzip, about 60 KB gzip larger than before because of the Vinext 1.x/React 19.3 runtime.
- Manual browser check in the in-app browser (desktop and 375×812): compact navigation row, page stays at the top on load, favicon and `og.jpg` metadata present, packed targets revalidated with a 0-byte cached response on reload.

Earlier verification runs are archived in `docs/archive/progress-history.md`.
