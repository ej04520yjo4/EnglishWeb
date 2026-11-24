# Project Progress

## Snapshot

- Updated: 2026-11-24
- Integration: review fixes from PR #19 (`f10bf59`) already include main `4f977e5` (PR #20, A2 Units 8–9). The combined candidate also contains both pinned GitHub Actions updates (PRs #11 and #12); GitHub records the required checks and merge status. No curriculum changes are included beyond the already merged Units 8–9.
- Integration is isolated from the original `D:\Codex\Tools\EnglishWeb\english-learning-app` checkout and its uncommitted local-only work. It does not deploy the site.
- Preservation copies (`EnglishWeb-preserved-20261016`, `backups*`, `a2-unit8-development`, named stashes) are unchanged. Earlier history lives in `docs/archive/progress-history.md`.
- M20 continues the applied course route after M19. M21 adds the guided 3000-word path. M4 learner/device, language, and phonetic trials remain open.
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A1 practice: 20 CSV patterns, 8 enabled/covered, 0 uncovered, 12 deliberately deferred; third-batch additions remain `pilot_review_required`.
- A2 at the main baseline (`d87d1cc`): 9 units, 36 lessons, 225 occurrences. The local `codex/a2-capstone-unit10` worktree includes the capstone and applied units through Unit 190: 760 lessons, 4362 occurrences. This continuation is not pushed or deployed.
- Progress schema: v6 with top-level global `vocabularyProgress`
- 3000-word guided path (local worktree, not pushed or deployed): 5 stages, 300 lessons, 10 words per lesson, every one of the 3000 targets exactly once. The formal A1+A2 course alone covers 554 of them.

## Vocabulary Baseline

- A1: 145 occurrences, 69 word forms, 75 senses, 15 chunks, 68 canonical lexemes.
- A2 in this worktree: 4362 occurrences, 637 word forms, 1639 senses, 672 chunks, 552 canonical lexemes.
- A1＋A2 union: 557 canonical lexemes (555 excluding personal names); overlap: 63. Units 188–190 introduce 0 new canonical course lexemes already in the target catalog, reusing forms and senses of earlier words where appropriate. The target catalog and learner mastery evidence are unchanged.
- Reference-only unique lexemes relative to current formal rows: 23. Protected target metadata still records the original 24 reference targets, not an automatic source reclassification.
- Protected v1 baseline: 132 entries; 108 active candidates and 24 receptive candidates, unchanged.
- Runtime v2 catalog: 3000 canonical entries, 1500 active / 1500 receptive candidates. A1-stage 1200 (700/500), A2-stage 1800 (800/1000), 60 pages of 50.
- Target status: `count_complete_review_required`; all entries remain `pilot_review_required`. These stage allocations are planning candidates, not official CEFR ratings or proof of learner mastery.
- New 2868 headwords use pinned NGSL 1.2 frequency data, matched WordNet 3.0/COW meanings or original editorial corrections. Hashes, transformation snapshots and complete notices are retained with the source package; no protected dictionary scrape or invented phonetics.
- 758 generated meanings whose WordNet sense did not fit everyday use or the example sentence now come from `data-sources/vocabulary-3000/course-meaning-revisions.json` (machine-assisted, pending review), and three example sentences were rewritten (`negotiate`, `embarrass`, `rail`). Those entries no longer claim a WordNet sense. The other 1382 WordNet-derived meanings are unchanged.
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
- The 3000-word screen opens with the guided path: study cards, then recognition with number keys and Enter, spelling for active targets, and later sentence application. Words return on later dates until they meet their goal and then come back after 3, 7, 21 and 45 days. Status is derived from global evidence; only words whose path study card was confirmed enter its review queue. The home page links to it.
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
- Unit 10 capstone (2026-11-22): four lessons and 28 one-word answers for thanking someone in email, reading a schedule, confirming a meeting place, and relating a trip change. Eight transfer questions, four reading recognitions, four contextual responses, a six-sentence reading sequence, four comprehension questions, and a four-item unit assessment reuse the existing course flow. See `docs/a2-unit10-pilot-qa.md`.
- Applied A2 units 11–13 (2026-11-23): twelve lessons, 70 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three dialogues totaling 16 sentences and 12 comprehension questions. Each unit includes a four-question assessment. See `docs/a2-applied-units-qa.md`.
- Applied A2 units 14–31 (2026-11-23): 72 lessons, 396 one-word answers, 144 transfers, 72 recognitions, 72 responses, and 18 short texts with 72 comprehension questions. See `docs/a2-situational-qa.md`.
- Applied A2 units 32–37 (2026-11-23): 24 lessons, 128 one-word answers, 48 transfers, 24 recognitions, 24 responses, and six short texts with 24 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 38–40 (2026-11-23): 12 lessons, 64 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three short dialogues with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 41–43 (2026-11-23): 12 lessons, 74 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three dialogues with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 44–46 (2026-11-23): 12 lessons, 77 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three dialogues with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 47–49 (2026-11-23): 12 lessons, 74 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 50–52 (2026-11-23): 12 lessons, 84 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three dialogues with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 53–55 (2026-11-23): 12 lessons, 68 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three dialogues with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 56–58 (2026-11-23): 12 lessons, 78 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 59–61 (2026-11-23): 12 lessons, 77 one-word answers, 24 transfers, 12 recognitions, 12 responses, and three short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 62–64 (2026-11-23): 12 lessons, 75 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 65–67 (2026-11-23): 12 lessons, 72 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 68–70 (2026-11-23): 12 lessons, 71 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 71–73 (2026-11-23): 12 lessons, 71 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 74–76 (2026-11-23): 12 lessons, 73 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 77–79 (2026-11-23): 12 lessons, 71 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 80–82 (2026-11-23): 12 lessons, 70 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 83–85 (2026-11-23): 12 lessons, 63 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 86–88 (2026-11-23): 12 lessons, 66 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 89–91 (2026-11-23): 12 lessons, 69 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 92–94 (2026-11-23): 12 lessons, 73 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 95–97 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 98–100 (2026-11-23): 12 lessons, 70 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 101–103 (2026-11-23): 12 lessons, 67 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 104–106 (2026-11-23): 12 lessons, 72 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 107–109 (2026-11-23): 12 lessons, 67 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 110–112 (2026-11-23): 12 lessons, 70 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 113–115 (2026-11-23): 12 lessons, 62 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 116–118 (2026-11-23): 12 lessons, 61 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 119–121 (2026-11-23): 12 lessons, 67 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 122–124 (2026-11-23): 12 lessons, 68 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 125–127 (2026-11-23): 12 lessons, 77 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 128–130 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 131–133 (2026-11-23): 12 lessons, 73 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 134–136 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 137–139 (2026-11-23): 12 lessons, 73 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 140–142 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 143–145 (2026-11-23): 12 lessons, 77 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 146–148 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 149–151 (2026-11-23): 12 lessons, 67 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 152–154 (2026-11-23): 12 lessons, 69 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 155–157 (2026-11-23): 12 lessons, 71 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 158–160 (2026-11-23): 12 lessons, 69 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 161–163 (2026-11-23): 12 lessons, 62 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 164–166 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 167–169 (2026-11-23): 12 lessons, 66 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 170–172 (2026-11-23): 12 lessons, 66 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 173–175 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 176–178 (2026-11-23): 12 lessons, 61 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 179–181 (2026-11-23): 12 lessons, 67 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 182–184 (2026-11-23): 12 lessons, 61 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 185–187 (2026-11-23): 12 lessons, 62 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- Applied A2 units 188–190 (2026-11-23): 12 lessons, 65 one-word answers, 24 transfers, 12 recognitions, 12 responses, and 3 short readings with 12 comprehension questions. See `docs/a2-continuation-qa.md`.
- 3000-word guided path (2026-11-24): the user asked for a course reaching at least 3000 words, built and integrated in one pass. New `public/data/vocabulary-path-v1.json` (generated by `scripts/build-vocabulary-path.mjs` from `path-themes.json`), `app/vocabulary-path.ts`, `app/vocabulary-path-panel.tsx`, 10 unit tests and 4 browser cases per viewport. Library practice components gained optional labels and number-key selection; distractor sorting now hashes each option once with identical output. No formal lesson, schema, CEFR or B1/B2 change. See `docs/vocabulary-3000-path.md` and ADR-062.

## Known Limits

- `npm audit` on this branch reports 12 moderate advisories and no high/critical ones: the ESLint/typescript-eslint `minimatch` chain (dev tooling) and Vinext → `@vercel/og` → `satori` → `fflate` (social-image generation, unused here). npm offers only downgrades for them. This is not a claim of a security-clean deployment.
- Two remote feature branches are not completely merged and must remain pending manual review: `feat/a2-shopping-comparison` and `feat/daily-learning-weakness-center`. Seven merged `feat/*` branches plus the merged PR1 fix branch are deletion candidates only; no branch was deleted.
- The target catalog and applications each contain 3000 words, but neither full collection has received human semantic/phonetic/CEFR approval. Guided applications compare one reference sentence, not all valid translations or free writing. A candidate's other words/grammar are not certified as previously taught formal prerequisites.
- KK/IPA conversion is not an authoritative dictionary transcription. 559 words retain multiple unselected pronunciations; syllabification/stress are candidates. Original related-word phonetics and symbol audio still need separate review.
- The original 126-entry content-metadata pass is complete, but the six new unit 5 targets still need equivalent review. All 108 curriculum targets need license evidence; 24 reference-only entries still need an external lexical source and user language/phonetic review. The progress-page note correctly keeps the baseline待審.
- All 190 A2 units remain pilot content. English, Taiwan Chinese, KK/IPA, scaffolding and CEFR placement remain pending manual QA. Audio remains pending. A completed pilot route is not a formal A2 pass and does not unlock B1.
- Original A1 and protected A2 unit 1 passage data retain a legacy exception for absent option/prerequisite metadata. Their unannotated options do not receive the newer complete prerequisite check; this is not a claim of automatic language approval.
- All 27 related-vocabulary reference records still need phonetic/content review. Current A1/A2 deduplication leaves 22 reference-only lexemes after Saturday enters Unit 6 and Sunday enters Unit 50; protected target-source metadata remains unchanged.
- B1/B2 remain disabled: known machine-detectable defects were repaired, but English/Taiwan Chinese naturalness, passage coherence, phonetics, distractor quality, and CEFR placement still require human review. The repair does not certify all content as error-free.
- Most word/sentence audio still uses browser speech fallback.
- The 3000-word path is pending review: about 87% of example-sentence words are taught by that lesson, but only 44% of sentences avoid every later word; 1382 WordNet meanings were not revised; practical words outside the list, such as `typhoon` and `dentist`, are absent; phone load and answer speed are unmeasured.
- Native screen-reader testing and a complete contrast audit remain open. Home actions and core lesson input/detail/rebuild/recognition states now have scoped contrast checks; gradients, map-specific accent colors, phonetic-specific colors, and forced-colors mode need further review. Daily/weakness transitions and the existing assessment path join skip navigation, screen headings, counts, and reading/response/passage choices in scoped automated keyboard coverage. These checks do not establish full accessibility compliance.

## Next Concrete Step

Try the review fixes on a real phone and Windows Chrome: the one-row navigation, home landing position, hidden Enter badges, and the storage warning (for example with site data blocked). Set `NEXT_PUBLIC_SITE_URL` for any deployment. The A2 Unit 7/8/9, conversation, and vocabulary human-QA tasks in `TASKS.md` remain open.

Try the 3000-word path for several study days on Windows Chrome and a real phone (`VOCAB-PATH-QA` in `TASKS.md`): lesson order, the revised meanings, and example sentences that use later words. Formal A2 units can still continue from Unit 191, but the 3000-word goal is now covered by the path. B1/B2 remain disabled. Nothing in this worktree is committed, pushed or deployed.

Run the focused browser cases separately from `npm run verify` on this workstation. At the 220-lesson checkpoint, concurrent build/unit tests and four browser workers timed out at the initial home heading; the trace showed the heading after the check timed out. Keep the assertions intact.

## Verification

### 3000-word guided path (2026-11-24)

- Before integration, the full Playwright matrix at Unit 190 (three workers, 1.3 hours) exited 0: 640 passed, 2 skipped, 0 failed. Log: `tmp/a2-u190-full-browser.log`.
- After integration, `npm run verify` exited 0: 380 unit tests passed (10 new path tests), with context, project/vocabulary audits, vocabulary build/application/phonetic/packed/path checks, curriculum validation, build, lint and TypeScript. Log: `tmp/path-final-verify.log`.
- The full Playwright matrix after integration (three workers, 1.3 hours) exited 0: 648 passed, 2 skipped, 0 failed, including the 8 new path cases. The skips are the device-specific halves of `mobile-layout.spec.ts`. Log: `tmp/path-full-browser.log`.
- Data checks: all 3000 path words built recognition and spelling questions and had an application sentence and KK candidate, with 0 failures. Recognition options for 300 sampled words were identical before and after the sorting change, which cut question building from about 70 ms to 42 ms in Node.
- Desktop and phone screenshots of the overview, lesson list, study card and recognition step showed no overflow. Pre-change copies are archived in `tmp/backup-before-3000-path.tgz`.
- The original checkout still reports its 30 independent changes. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 190 (2026-11-23)

- `npm run verify` exited 0: 370 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 188–190 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 4297 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 188, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u190-verify.log` and `tmp/a2-u190-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 187 (2026-11-23)

- `npm run verify` exited 0: 369 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 185–187 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 4235 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 185, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u187-verify.log` and `tmp/a2-u187-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 184 (2026-11-23)

- `npm run verify` exited 0: 368 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 182–184 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 4174 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 182, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u184-verify.log` and `tmp/a2-u184-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 181 (2026-11-23)

- `npm run verify` exited 0: 367 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 179–181 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 4107 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 179, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u181-verify.log` and `tmp/a2-u181-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 178 (2026-11-23)

- `npm run verify` exited 0: 366 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 176–178 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 4046 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 176, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u178-verify.log` and `tmp/a2-u178-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 175 (2026-11-23)

- `npm run verify` exited 0: 365 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 173–175 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3981 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 173, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u175-verify.log` and `tmp/a2-u175-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 172 (2026-11-23)

- `npm run verify` exited 0: 364 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 170–172 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3915 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 170, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u172-verify.log` and `tmp/a2-u172-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 169 (2026-11-23)

- `npm run verify` exited 0: 363 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 167–169 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3849 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 167, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u169-verify.log` and `tmp/a2-u169-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 166 (2026-11-23)

- `npm run verify` exited 0: 362 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 164–166 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3784 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 164, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u166-verify.log` and `tmp/a2-u166-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 163 (2026-11-23)

- `npm run verify` exited 0: 361 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 161–163 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3722 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 161, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u163-verify.log` and `tmp/a2-u163-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 160 (2026-11-23)

- `npm run verify` exited 0: 360 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 158–160 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3653 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 158, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u160-verify.log` and `tmp/a2-u160-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 157 (2026-11-23)

- `npm run verify` exited 0: 359 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 155–157 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3582 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 155, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u157-verify.log` and `tmp/a2-u157-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 154 (2026-11-23)

- `npm run verify` exited 0: 358 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 152–154 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3513 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 152, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u154-verify.log` and `tmp/a2-u154-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 151 (2026-11-23)

- `npm run verify` exited 0: 356 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 149–151 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3446 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 149, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Browser-storage fix found by the full matrix: the app kept a full JSON copy of the A2 rows in localStorage. At 151 units that copy was about 4.94 million characters, close to the usual 5 MB quota, and a browser run showed 「本機進度未能儲存」. `app/curriculum/storage.ts` now stores only rows a learner edited (a reordered import still uses the old full format), reads older saved copies, and replaces them on the next save. Unedited A2 now takes under 1,000 characters. Regression tests cover unchanged rows, edits, legacy copies, stale revisions, unknown IDs and reordering; the failed flow and storage browser cases passed (6 cases, `tmp/a2-u151-storage-browser.log`). The interrupted full run is kept at `tmp/a2-u151-full-browser-interrupted.log`.
- After the storage fix, `npm run verify` exited 0 with 357 unit tests, and the full Playwright matrix at Unit 151 (three workers, 54.4 minutes) exited 0: 562 passed, 2 skipped, 0 failed across desktop and mobile viewports. The two skips are the device-specific halves of `mobile-layout.spec.ts`. Log: `tmp/a2-u151-full-browser.log`. This is the latest fully verified checkpoint. It is uncommitted and unpushed on `codex/a2-capstone-unit10`; no real-phone trial, human language review, phonetic confirmation or audio production has been done for the added units.
- Logs: `tmp/a2-u151-verify.log` and `tmp/a2-u151-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 148 (2026-11-23)

- `npm run verify` exited 0: 355 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 146–148 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3381 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 146, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u148-verify.log` and `tmp/a2-u148-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 145 (2026-11-23)

- `npm run verify` exited 0: 354 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 143–145 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3304 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 143, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u145-verify.log` and `tmp/a2-u145-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 142 (2026-11-23)

- `npm run verify` exited 0: 353 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 140–142 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3239 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 140, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u142-verify.log` and `tmp/a2-u142-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 139 (2026-11-23)

- `npm run verify` exited 0: 352 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 137–139 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3166 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 137, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u139-verify.log` and `tmp/a2-u139-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 136 (2026-11-23)

- `npm run verify` exited 0: 351 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 134–136 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3101 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 134, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Second startup performance fix: a first scoped run failed one case on the 5-second home heading because exercise validation had grown back to about 4 seconds at 136 units in Node. `app/a1-exercises.ts` now builds one learned-content index per validation run, reducing it to about 0.5 seconds. Validation results were byte-identical before and after for A1, A2, and 14 deliberately broken A2 inputs. Real-browser and phone load times were not measured.
- Logs: `tmp/a2-u136-verify.log` and `tmp/a2-u136-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 133 (2026-11-23)

- `npm run verify` exited 0: 350 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 131–133 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 3028 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 131, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u133-verify.log` and `tmp/a2-u133-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 130 (2026-11-23)

- `npm run verify` exited 0: 349 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 128–130 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2963 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 128, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u130-verify.log` and `tmp/a2-u130-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 127 (2026-11-23)

- `npm run verify` exited 0: 348 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 125–127 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2886 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 125, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u127-verify.log` and `tmp/a2-u127-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 124 (2026-11-23)

- `npm run verify` exited 0: 347 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 122–124 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2818 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 122, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u124-verify.log` and `tmp/a2-u124-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 121 (2026-11-23)

- `npm run verify` exited 0: 346 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 119–121 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2751 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 119, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u121-verify.log` and `tmp/a2-u121-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 118 (2026-11-23)

- `npm run verify` exited 0: 345 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 116–118 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2690 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 116, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u118-verify.log` and `tmp/a2-u118-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 115 (2026-11-23)

- `npm run verify` exited 0: 344 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 113–115 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2628 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 113, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u115-verify.log` and `tmp/a2-u115-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 112 (2026-11-23)

- `npm run verify` exited 0: 343 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 110–112 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2558 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 110, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Full Playwright matrix at Unit 112 (two workers, about 1.3 hours): exit 0, 484 passed, 2 skipped, 0 failed across desktop and mobile viewports. The two skips are the device-specific halves of `mobile-layout.spec.ts`. Log: `tmp/a2-u112-full-browser.log`. Local test browser only; no real-phone trial or human content review.
- Logs: `tmp/a2-u112-verify.log` and `tmp/a2-u112-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 109 (2026-11-23)

- `npm run verify` exited 0: 342 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 107–109 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2491 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 107, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u109-verify.log` and `tmp/a2-u109-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 106 (2026-11-23)

- `npm run verify` exited 0: 341 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 104–106 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2419 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 104, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u106-verify.log` and `tmp/a2-u106-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 103 (2026-11-23)

- `npm run verify` exited 0: 340 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 101–103 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2352 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 101, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u103-verify.log` and `tmp/a2-u103-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 100 (2026-11-23)

- `npm run verify` exited 0: 339 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 98–100 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2282 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 98, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Three-digit IDs: `a2-u100` sorts before `a2-u11` as text. Runtime ordering already uses numeric `lessonRank` and `idNumber`; string comparisons in `tests/a2-pilot.test.mjs` and the local authoring helpers now compare unit numbers. Existing IDs are unchanged.
- Full Playwright matrix at Unit 100 (two workers, about 1.1 hours): exit 0, 460 passed, 2 skipped, 0 failed across desktop and mobile viewports. The two skips are the device-specific halves of `mobile-layout.spec.ts`. Log: `tmp/a2-u100-full-browser.log`. Local test browser only; no real-phone trial or human content review.
- Logs: `tmp/a2-u100-verify.log` and `tmp/a2-u100-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 97 (2026-11-23)

- `npm run verify` exited 0: 338 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 95–97 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2217 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 95, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u97-verify.log` and `tmp/a2-u97-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 94 (2026-11-23)

- `npm run verify` exited 0: 337 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 92–94 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2144 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 92, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u94-verify.log` and `tmp/a2-u94-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 91 (2026-11-23)

- `npm run verify` exited 0: 336 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 89–91 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2075 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 89, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u91-verify.log` and `tmp/a2-u91-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 88 (2026-11-23)

- `npm run verify` exited 0: 335 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 86–88 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 2009 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 86, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Full Playwright matrix at Unit 88 (two workers, 54.7 minutes): exit 0, 436 passed, 2 skipped, 0 failed across desktop and mobile viewports. The two skips are the intentionally device-specific halves of `mobile-layout.spec.ts`. This run includes the whole-title helper fix from Unit 76. Log: `tmp/a2-u88-full-browser.log`. It uses the local test browser, so it is not a real-phone trial or human content review.
- Logs: `tmp/a2-u88-verify.log` and `tmp/a2-u88-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 85 (2026-11-23)

- `npm run verify` exited 0: 334 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 83–85 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1946 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 83, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u85-verify.log` and `tmp/a2-u85-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 82 (2026-11-23)

- `npm run verify` exited 0: 333 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 80–82 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- Before this batch, six `translation` values in `a2-u74-l03` changed so `Ben` and `Amy` stay in English like earlier lessons; no IDs, answers or other fields changed, and the Unit 77 hash lock was updated for this correction. The prefix check below compares against the corrected file.
- All 1876 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 80, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u82-verify.log` and `tmp/a2-u82-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 79 (2026-11-23)

- `npm run verify` exited 0: 332 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 77–79 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1805 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 77, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u79-verify.log` and `tmp/a2-u79-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 76 (2026-11-23)

- `npm run verify` exited 0: 331 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 74–76 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1732 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 74, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Full Playwright matrix at Unit 76 (two workers, 41.7 minutes): 410 passed, 2 skipped, 2 failed. Both failures were the desktop and mobile runs of `completes all 16 new A2 lessons and four new passages`: its partial title match for `搭公車` also matched the Unit 38 lesson `說明搭公車要多久`. The helper now matches whole titles, and the six runs that use it passed (`tmp/a2-u76-title-fix-browser.log`). The full matrix was not rerun after this test-only fix.
- Logs: `tmp/a2-u76-verify.log` and `tmp/a2-u76-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 73 (2026-11-23)

- `npm run verify` exited 0: 330 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 71–73 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1661 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 71, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u73-verify.log` and `tmp/a2-u73-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 70 (2026-11-23)

- `npm run verify` exited 0: 329 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Two scoped Playwright runs with two workers exited 1 (3 of 10 and 2 of 10 passed): the home heading missed its 5-second wait although the page rendered correctly. A serial rerun exited 0: 10 cases passed across desktop and mobile viewports. Units 68–70 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1590 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 68, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Startup performance fix found by those failures: the browser validates all exercises on load, and that took about 4.7 seconds at 70 units in Node (about 1.0 at 31 units). `app/a1-exercises.ts` now caches two pure lookups, reducing it to about 1.2 seconds. Validator results for valid data and four deliberately broken inputs were identical before and after. After the fix, `npm run verify` exited 0 (329 unit tests) and the same two-worker Playwright run exited 0 with 10 cases passed in 1.7 minutes instead of failing. Real-browser and phone load times were not measured.
- Logs: `tmp/a2-u70-verify.log` and `tmp/a2-u70-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 67 (2026-11-23)

- `npm run verify` exited 0: 328 unit tests passed with no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed across desktop and mobile viewports. Units 65–67 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1518 prior CSV rows remain a byte-identical prefix of the new file, a new hash lock protects everything before Unit 65, and all three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u67-verify.log` and `tmp/a2-u67-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 64 (2026-11-23)

- Unit 59–61 checkpoint, whose log Codex finished before the handoff: `npm run verify` exited 0 with 326 unit tests, and 12 scoped Playwright cases passed (`tmp/a2-u61-verify.log`, `tmp/a2-u61-browser.log`).
- Units 62–64: `npm run verify` exited 0 with 327 unit tests passed and no failures; build, lint, type, curriculum and vocabulary checks passed.
- Separate scoped Playwright run (two workers) exited 0: 10 cases passed, five desktop and five mobile viewport. Units 62–64 complete through assessment and reload; ordering, QA preview and the pilot completion boundary are unchanged.
- All 1443 prior CSV rows remain a byte-identical prefix of the new file (`tmp/a2-244-lessons-reviewed-snapshot.csv`), and the new hash lock protects everything before Unit 62. All three generated sources reproduced exactly. The original checkout still reports its 30 independent changes.
- Logs: `tmp/a2-u64-verify.log` and `tmp/a2-u64-browser.log`. Automated checks only: no human language, phonetic, audio or real-device review.

### A2 continuation through Unit 58 (2026-11-23)

- `npm run verify` exited 0: 325 unit tests passed with no failures, and build, lint, type, curriculum and vocabulary checks passed.
- Separate Playwright run (two workers) exited 0: 12 scoped cases passed, six desktop and six mobile viewport. Units 55–58 complete through assessment and retain progress on reload; ordering, QA preview and the pilot completion boundary are unchanged.
- Workbook import matched all 1288 prior rows across 57 columns and confirmed 1366 unique occurrence IDs. All three generated sources reproduced exactly. The original checkout's 30 independent changes still match the preservation copy.
- Logs: `tmp/a2-u58-verify.log` and `tmp/a2-u58-browser.log`. Continue locally with the Unit 59–61 draft.

### A2 continuation through Unit 55 (2026-11-23)

- `npm run verify` exited 0 after the final title change: 324 unit tests passed, with build, lint, type, curriculum and vocabulary checks passing too.
- The first browser run caught a new title matching an earlier lesson. Only the new title changed, and a regression test now detects duplicate titles in added lessons. A parallel rerun hit startup-heading timeouts. The final isolated run (two workers) exited 0, with 12 scoped Playwright cases passing: six desktop and six mobile viewport, including assessment, reload and pilot completion.
- Workbook import matched all 1220 prior rows across 57 columns and confirmed 1288 unique occurrence IDs. All three generated sources reproduced exactly. The original checkout's 30 independent changes still match the preservation copy.
- Logs: `tmp/a2-u55-final-verify.log` and `tmp/a2-u55-isolated-browser.log`. Continue locally at Unit 56.

### A2 continuation through Unit 52 (2026-11-23)

- `npm run verify` exited 0: 322 unit tests, zero failures, and passing build, lint, type, curriculum and vocabulary checks.
- Scoped Playwright exited 0: 12 cases passed (six desktop, six mobile viewport). Units 49–52 were exercised through assessment and reload; ordering, QA preview, and the no-formal-pass boundary remained intact.
- Independent workbook import matched 1136 prior records across 57 columns and confirmed 1220 unique occurrence IDs. The three generators reproduced their checked outputs exactly. The original checkout's 30 independent file changes are still identical to the preservation copy.
- Logs: `tmp/a2-u52-verify.log` and `tmp/a2-u52-browser.log`. Continue locally at Unit 53.

### A2 continuation through Unit 49 (2026-11-23)

- `npm run verify` exited 0: 321 unit tests passed with no failures; build, lint, typechecking, curriculum and vocabulary checks also passed.
- Scoped Playwright exited 0: 12 cases passed (six desktop, six mobile viewport). Units 46–49 complete through assessment and retain state on reload. Unit order remains enforced; finishing the available pilot still does not award an A2 pass.
- Independent workbook import matched all 1062 earlier rows across 57 columns and found 1136 unique occurrence IDs. All three generated course sources reproduced exactly; the original checkout's 30 independent changes still match the preservation copy.
- Logs: `tmp/a2-u49-verify.log` and `tmp/a2-u49-browser.log`. Continue locally at Unit 50.

### A2 continuation through Unit 46 (2026-11-23)

- `npm run verify` exited 0: 320 unit tests passed with no failures, along with build, typechecking and the curriculum and vocabulary checks. Removed one unused authoring parameter; the focused lint rerun exited 0 with no warnings.
- Scoped Playwright exited 0: 12 cases passed, six desktop and six mobile viewport. Units 43–46 complete from recall through assessment; reload restores progress, unit order remains enforced, and finishing the pilot does not award an A2 pass.
- Independent workbook import matched all 985 earlier rows across 57 columns, and verified 1062 unique occurrence IDs. All three generated course sources reproduced exactly. The original checkout's 30 separate changes still match the preservation copy.
- Logs: `tmp/a2-u46-verify.log` and `tmp/a2-u46-browser.log`. Continue locally at Unit 47.

### A2 continuation through Unit 43 (2026-11-23)

- The first broad check caught an article prompt that no longer matched the shared `a` convention. The final lesson retains the canonical hint and teaches `a few` in its chunk and contextual note. Final `npm run verify`: exit 0, 319 unit tests passed with no failures, plus all build, lint, type and content gates.
- Final scoped Playwright: exit 0, 12 cases passed (six desktop, six mobile viewport). Tests cover Units 40–43 through lesson, passage, assessment, unlocking and reload, as well as QA preview and the absence of a formal A2 pass at the pilot boundary.
- Independent workbook import matched all 911 prior rows across 57 columns; 985 occurrence IDs are unique. The three A2 runtime files reproduced exactly, and the original checkout's 30 dirty paths still match the preserved copy. A1, B-level sources and progress code were not changed.
- Logs: `tmp/a2-u43-final-verify.log` and `tmp/a2-u43-final-browser.log`. The local continuation resumes at Unit 44.

### A2 continuation through Unit 40 (2026-11-23)

- The first broad check detected two stale post-Unit-1 lesson totals. Both checks now derive the count from the independently pinned unit list while keeping the same per-lesson prerequisites and exercise assertions. The rerun of `npm run verify` exited 0 (318 tests passed, 0 failed); a final focused lint rerun removes its one unused-binding warning.
- Scoped Playwright exited 0 (5 desktop, 5 mobile, 0 failures). It covers Units 37–40 end to end and confirms that finishing the current pilot does not set a formal A2 pass. Mobile evidence is browser emulation, not testing on physical hardware.
- An independent workbook import matched all 847 prior rows across 57 columns, leaving 911 unique occurrences. All three generators' outputs reproduced exactly. The separate original worktree's 30 dirty paths still match their preserved backup by hash.
- Logs: `tmp/a2-u40-final-verify.log`, `tmp/a2-u40-browser.log`. The continuation remains local and resumes at Unit 41.

### A2 continuation through Unit 37 (2026-11-23)

- 136-lesson checkpoint: `npm run verify` exit 0 with 316 unit tests; ten scoped desktop/mobile flows passed for Units 31–34 and the pilot completion boundary.
- Final 148-lesson checkpoint: `npm run verify` exit 0 with 317 unit tests and all build, lint, type, and content gates. Twelve scoped browser cases passed for Units 34–37, preview, and pilot completion. After contextual hints were corrected, a ten-case desktop/mobile repeat passed for the final Units 35–37, first lesson persistence, and stable progression. All browser runs exited 0 with no failures.
- Independent spreadsheet import verified all 57 columns, 847 unique IDs, and exact preservation of the 719- and 782-row checkpoints. All three generated sources reproduce byte-for-byte. The separate original checkout still has 30 dirty paths matching its preserved backup.
- Logs: `tmp/a2-u34-verify.log`, `tmp/a2-u34-browser.log`, `tmp/a2-u37-final-verify.log`, and `tmp/a2-u37-final-browser.log`. Resume the active expansion at Unit 38 without changing earlier data or requiring intermediate user review.

### A2 continuation through Unit 31 (2026-11-23)

- The 76-lesson checkpoint passed 18 desktop/mobile applied-flow tests (exit 0). At the 100-lesson checkpoint, `npm run verify` passed 314 unit tests and the full `npm run test:e2e -- --workers=4` passed 310 cases, with two device-specific skips and zero failures (exit 0).
- Final 124-lesson sources: `npm run verify` exit 0, 315 unit tests, no failures/skips, and all build, lint, typecheck, data and vocabulary gates. A1 remains 8/32/145 and A2 is 31/124/719.
- At 124 lessons, 18 focused desktop/mobile cases passed (exit 0) for Units 25–31, the first A2 lesson and pilot-completion boundaries. After the final context-hint refinements, Units 29 and 31 passed four additional desktop/mobile checks (exit 0), including the displayed price-question prompt. The full 310-case run applies to the 100-lesson checkpoint, not the final source revision.
- Independent CSV import checked all 57 columns and 719 unique occurrence IDs; the 225 published and 587 checkpoint rows were unchanged. Prior checkpoint hashes preserve the earlier reading, transfer and response JSON. All three generated outputs reproduce without a diff. The separate original checkout's 30 dirty paths still match their preserved snapshot.
- Logs: `tmp/a2-100-lessons-browser.log`, `tmp/a2-124-lessons-final-verify.log`, `tmp/a2-124-lessons-browser.log`, `tmp/a2-124-lessons-prompt-browser.log`.

### A2 applied units 11–13 (2026-11-23)

- `npm run verify`: exit 0 on Windows (Node 24.18.0, npm 11.16.0); all gates including the 3000-target audit, production build, 311 unit tests (0 failed/skipped), lint, and TypeScript. A1 stays 8/32/145; A2 validates as 13/52/323.
- The independent spreadsheet import checked all 57 columns, the 225 published A2 rows, and uniqueness of all 323 occurrences. Unit tests also hash the complete prior ten-unit CSV, recognition, response, transfer, and passage data. Replaying both generators reproduced all three current output files byte-for-byte.
- `npm run test:e2e -- --workers=4`: exit 0, 286 passed (143 on each viewport), two intentional device-specific skips, zero failures (7.3 min). Both Windows Chrome configurations (1440×900 and 375×812) passed all new lessons, comprehension, unit assessments, sequential unlocks, and local progress reload. The first run exposed stale 40-lesson assertions and a post-reload test race; two mobile cases also used fixtures from before the course word substitutions. Logs: `tmp/a2-applied-final-e2e.log` and `tmp/a2-applied-final-verify.log`.
- Focused browser repeat after final contextual prompt corrections: 3 desktop applied-unit flows passed (exit 0). It covered sequential entry, lesson practice, passage, unit assessment, and reload. The 30 pre-existing uncommitted files in the separate original checkout are still byte-identical to their backup.

### A2 Unit 10 capstone (2026-11-22)

- `npm run verify`: exit 0, all configured gates; 308 unit tests passed, none failed/skipped. The focused A2/vocabulary suites passed 63. Curriculum validator confirmed A1 8/32/145 and A2 10/40/253.
- Both content generators reproduce the three A2 files byte-for-byte. Independent spreadsheet import confirmed all 57 columns and 225 existing rows unchanged, with 28 new one-word rows and unique occurrence IDs. Unit fixture digests also keep all prior patterns, recognition, responses, and passages unchanged.
- `npm run test:e2e -- --workers=4`: exit 0, 280 passed, 2 viewport-specific skips, 0 failed (6.3 minutes). Both viewports covered the Unit 9 pass gate, all four capstone lessons, passage, unit assessment, reload persistence, and no B1 unlock. Logs: `tmp/unit10-verify.log` and `tmp/unit10-e2e.log`.
- The separate original checkout's 30 dirty-file hashes still match the preserved backup. No dependency changes, commit, push, merge, or deployment in this continuation.

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
