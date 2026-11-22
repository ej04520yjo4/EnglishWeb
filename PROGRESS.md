# Project Progress

## Snapshot

- Updated: 2026-11-22
- Integration: review fixes from PR #19 (`f10bf59`) already include main `4f977e5` (PR #20, A2 Units 8–9). The combined candidate also contains both pinned GitHub Actions updates (PRs #11 and #12); GitHub records the required checks and merge status. No curriculum changes are included beyond the already merged Units 8–9.
- Integration is isolated from the original `D:\Codex\Tools\EnglishWeb\english-learning-app` checkout and its uncommitted local-only work. It does not deploy the site.
- Preservation copies (`EnglishWeb-preserved-20261016`, `backups*`, `a2-unit8-development`, named stashes) are unchanged. Earlier history lives in `docs/archive/progress-history.md`.
- Active milestone: M7 - Learning Depth and Release Readiness (resilience, performance, and structure work). M13–M15 learner/device, language, and phonetic trials remain open.
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A1 practice: 20 CSV patterns, 8 enabled/covered, 0 uncovered, 12 deliberately deferred; third-batch additions remain `pilot_review_required`.
- A2 on main: 9 units, 36 lessons, 225 occurrences. Units 7–9 remain `pilot_review_required`; Unit 7 details in `docs/a2-unit7-pilot-qa.md`.
- Progress schema: v6 with top-level global `vocabularyProgress`

## Vocabulary Baseline

- A1: 145 occurrences, 69 word forms, 75 senses, 15 chunks, 68 canonical lexemes.
- A2: 225 occurrences, 100 word forms, 158 senses, 56 chunks, 95 canonical lexemes.
- A1＋A2 union: 134 canonical lexemes (132 excluding proper names); overlap: 29. Unit 9 reuses existing 3000-target identities; no new target entry is needed. `have dinner` and `would love to` are taught as whole meanings while every answer stays one word.
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
- Pending-PR consolidation (2026-11-20): updated `actions/setup-node` to 7.1.0 and `actions/upload-artifact` to 7.0.2, verifying the full commit pins against upstream release tags. Review fixes already contain newer versions than PRs #5 (React Server DOM), #6 (Next), #7 (Vinext), #8 (Wrangler), and #9 (Tailwind); do not reapply their older lockfiles. PR #4 proposes Node 26 declarations, but CI and the supported minimum runtime stay on Node 22. Keep the Node 22 declarations until there is a separate runtime-support decision.
- Node types follow-up (2026-11-22): choose `@types/node` 22.20.5 as the compatible alternative to PR #4, keep the runtime floor at 22.13.0, and add a test checking the declarations' major and locked version. The npm Dependabot rule excludes only `@types/node` 23+; other packages and 22.x updates remain eligible.

## Known Limits

- `npm audit` on this branch reports 12 moderate advisories and no high/critical ones: the ESLint/typescript-eslint `minimatch` chain (dev tooling) and Vinext → `@vercel/og` → `satori` → `fflate` (social-image generation, unused here). npm offers only downgrades for them. This is not a claim of a security-clean deployment.
- Two remote feature branches are not completely merged and must remain pending manual review: `feat/a2-shopping-comparison` and `feat/daily-learning-weakness-center`. Seven merged `feat/*` branches plus the merged PR1 fix branch are deletion candidates only; no branch was deleted.
- The target catalog and applications each contain 3000 words, but neither full collection has received human semantic/phonetic/CEFR approval. Guided applications compare one reference sentence, not all valid translations or free writing. A candidate's other words/grammar are not certified as previously taught formal prerequisites.
- KK/IPA conversion is not an authoritative dictionary transcription. 559 words retain multiple unselected pronunciations; syllabification/stress are candidates. Original related-word phonetics and symbol audio still need separate review.
- The original 126-entry content-metadata pass is complete, but the six new unit 5 targets still need equivalent review. All 108 curriculum targets need license evidence; 24 reference-only entries still need an external lexical source and user language/phonetic review. The progress-page note correctly keeps the baseline待審.
- A2 units 1–9 remain pilot content; unit 10 is blueprint-only. Unit 9 English, Taiwan Chinese, KK/IPA, scaffolding and CEFR placement remain pending manual QA, as do prior units. New phonetics use pinned CMUdict candidates and audio remains pending; this is not human phonetic approval.
- Original A1 and protected A2 unit 1 passage data retain a legacy exception for absent option/prerequisite metadata. Their unannotated options do not receive the newer complete prerequisite check; this is not a claim of automatic language approval.
- All 27 related-vocabulary reference records still need phonetic/content review. Current A1/A2 deduplication leaves 23 reference-only lexemes after Saturday enters unit 6; protected target-source metadata remains unchanged.
- B1/B2 remain disabled: known machine-detectable defects were repaired, but English/Taiwan Chinese naturalness, passage coherence, phonetics, distractor quality, and CEFR placement still require human review. The repair does not certify all content as error-free.
- Most word/sentence audio still uses browser speech fallback.
- Native screen-reader testing and a complete contrast audit remain open. Home actions and core lesson input/detail/rebuild/recognition states now have scoped contrast checks; gradients, map-specific accent colors, phonetic-specific colors, and forced-colors mode need further review. Daily/weakness transitions and the existing assessment path join skip navigation, screen headings, counts, and reading/response/passage choices in scoped automated keyboard coverage. These checks do not establish full accessibility compliance.

## Next Concrete Step

Try the review fixes on a real phone and Windows Chrome: the one-row navigation, home landing position, hidden Enter badges, and the storage warning (for example with site data blocked). Set `NEXT_PUBLIC_SITE_URL` for any deployment. The A2 Unit 7/8/9, conversation, and vocabulary human-QA tasks in `TASKS.md` remain open.

Try Unit 9's four lessons, six-sentence invitation/rescheduling exchange, and four comprehension questions on Windows/mobile. Review `would love to`, polite refusal, `instead`, Taiwan Chinese, difficulty, and KK/IPA before deciding on Unit 10. Earlier unit and real-microphone trials remain open; automated checks certify neither learning gains nor speech accuracy. B1/B2 remain disabled.

## Verification

### Node types follow-up (2026-11-22)

- Fresh `npm ci` and `npm run verify` passed on Windows: 306 unit tests with no failures or skips, production build, lint, and TypeScript. The lockfile diff is limited to `@types/node`; the npm Dependabot block was parsed to confirm that only its 23+ versions are excluded. Required GitHub checks run the candidate on Node 22.

### Review fixes (2026-11-09)

All runs below are local automated checks on `codex/review-fixes` in Windows (Node 24.18, npm 11.16). They are not a real-phone trial or human review.

- `npm run verify`: exit 0, all 13 gates (including the new `check:packed-vocabulary`), production build, 296 unit tests (0 failed/skipped; main had 284), lint and TypeScript.
- `npm run test:e2e` (full matrix, unchanged 4173 wrapper): exit 0, 260 passed, 2 skipped, 0 failed, 11.9 minutes. The two skips are the intentionally device-specific halves of `mobile-layout.spec.ts`.
- New regression coverage: storage quota and blocked-storage specs (both failed against the unfixed page, then passed), phone layout spec, packed-JSON round-trip and loader tests, failure-safe storage helper tests, and an SSR check that `og:image` ignores a spoofed `X-Forwarded-Host`.
- `scripts/test-windows-launcher.ps1`: exit 0, 7 of 7 launcher scenarios passed.
- `npm audit`: 12 moderate, 0 high, 0 critical (was 33 with 1 critical and 18 high).
- Payload: packed vocabulary copies total 5.1 MB instead of 14.2 MB; `og.jpg` is 64 KB. The eager production client bundle is 850 KB raw / 246 KB gzip, about 60 KB gzip larger than before because of the Vinext 1.x/React 19.3 runtime.
- Manual browser check in the in-app browser (desktop and 375×812): compact navigation row, page stays at the top on load, favicon and `og.jpg` metadata present, packed targets revalidated with a 0-byte cached response on reload.

### A2 unit 9 continuation (2026-11-20)

- Before changes: `npm run verify` exited 0; all 12 gates, 288 unit tests, 0 failed/skipped. Log: `tmp/unit9-baseline-verify-20261120.log`.
- Both generators and `npm run validate:curriculum` exited 0. Focused A2 unit tests: 42 passed, 0 failed/skipped; protect all old units and new prerequisites, slots, IDs, one-word answers, dialogue evidence, and pending audio.
- Final `npm run verify`: exit 0; all 12 gates, 293 unit tests passed, 0 failed/skipped; build, lint and `tsc --noEmit --incremental false` passed. Log: `tmp/unit9-final-verify.log`. No dependency changes or `npm ci` this turn.
- Generator replay: exit 0, all three output hashes identical. Final focused data/protection rerun: exit 0, 61 passed, 0 failed/skipped.
- Unit 9 focused browser run: exit 0, 8 passed (4 desktop / 4 mobile), 29.3 seconds. The initial sandbox attempt exited 1 on localhost EACCES before tests; authorized standard-wrapper execution succeeded without a temporary port override.
- Windows launcher checks: exit 0, all seven scenarios passed. Independent test-browser screenshots confirmed the new map/detail copy and KK fit the existing desktop/mobile layouts; no real-phone or human phonetic approval is claimed.
- The first full browser run reported 270 passed (135 per viewport), 8.4 minutes, in `tmp/unit9-full-e2e.log`; its completed tool session was no longer available to retrieve the process exit code. Final repeat `npm run test:e2e -- --workers=4`: verified exit 0, 270 passed (135 desktop 1440×900 / 135 mobile 375×812), 0 failed/skipped, 6.4 minutes. Log: `tmp/unit9-final-e2e.log`; standard wrapper, no alternate config/port. Final lint rerun also exited 0.
- All 24 changed/new files are scoped to Unit 9 data, generators, regression counts/tests, and context. A1, dependencies, `app/page.tsx`, schemas, the 3000-target collection and original 30 dirty files remain unchanged. The subsequent user request authorizes committing and pushing this isolated branch only. Trial launcher and complete handoff: `docs/a2-unit9-pilot-qa.md`.
- Before feature-branch publication, `npm run verify` was rerun: exit 0, all 12 gates, 293 unit tests passed, 0 failed/skipped (`tmp/unit9-push-verify.log`). The prior 270-case browser result applies to the same code/data; the publication follow-up changes documentation only.

### A2 unit 8 continuation (2026-10-27)

- Unit 8 data and exercise generation is bounded to `a2-u08`; A1 and A2 units 1–7 remain protected. The four core sentences are `I have a problem at work.`, `I am tired because I work at night.`, `You should take a break.`, and `I am tired, so I take a break.`
- The unit adds 27 word occurrences (6/8/5/8), eight ordered-slot transfers, four recognitions, four text responses, a five-sentence passage, and four evidence-backed comprehension questions. All generated content remains `pilot_review_required` and audio remains `pending`.
- The final lesson-4 text-response distractors were corrected to three distinct taught sentences: `I am tired because I work at night.`, `You should take a break.`, and `I have a problem at work.` The previous location/time-only variants are not used as distractors.
- On 2026-10-27 the final combined D-drive checkout passed `npm run verify` (295 unit tests, including seven local-only backup tests), the full 272-case browser matrix (136 per viewport, including ten backup cases), and seven launcher scenarios. Those are historical integrated results, not this clean branch's test totals. The exact unit 8 files and final A1/A2-scoped `1/32 課` locator are copied into this branch; backup code is not.
- The standard browser wrapper previously exited 1 because it waited on 4173 while Vinext used 4174. The successful historical matrix used an ignored temporary actual-port config. This existing harness issue remains open; no passing standard-wrapper result is claimed.
- Clean-branch recheck on 2026-10-29: `npm run verify` exited 0 with all 12 gates, 288 unit tests passed, zero failed/skipped, successful production build, lint and TypeScript. Focused browser command `node node_modules/@playwright/test/cli.js test tests/e2e/a2-problems.spec.ts tests/e2e/learning-flow.spec.ts --config tmp/unit8-playwright.config.ts --grep 'unit eight|first A2 lesson'` exited 0 with 10 passed (five desktop / five mobile), zero failed/skipped. Logs: `tmp/unit8-push-verify-20261029.log` and `tmp/unit8-push-focused-e2e-20261029.log`. The full 262-case clean-branch matrix was not rerun this push-only turn; historical integrated results remain separate.
- Independent read-only scope review found no blocker: 15 unit8-only files and eight isolated context files, no backup implementation, no A1 changes, no unit 9/10, and disabled B levels. GitHub Actions runs only for main pushes and pull requests, so a feature-branch-only push does not trigger CI by itself. No main merge, force push, deployment or new curriculum is included.
- The `tired` answer is stored with `lemma`/`lexeme_id` `tire`, `context_pos` adjective, and a fatigue sense distinct from the noun `tire`. CMUdict's pinned `T AY1 ER0 D` is a candidate only; English, Taiwan Traditional Chinese, CEFR, phonetics, and audio still require human QA.

### Main merge into review fixes (2026-11-20)

Automated local checks after merging main `4f977e5` (PR #20, Units 8–9) into `codex/review-fixes`; conflicts were limited to CHANGELOG, DECISIONS, PROGRESS and TASKS. This branch's ADRs were renumbered 056–058 because main used 054–055. Not a real-phone trial or human review.

- `npm run verify`: exit 0, all gates including `check:packed-vocabulary`, 305 unit tests passed, 0 failed/skipped.
- Focused Playwright (`learning-flow`, `a2-problems`, `a2-social`, `mobile-layout`, `storage-resilience`): exit 0, 108 passed, 2 skipped (device-specific halves of `mobile-layout`), 8.5 minutes. The full matrix was not rerun.

Earlier verification runs are archived in `docs/archive/progress-history.md`.
