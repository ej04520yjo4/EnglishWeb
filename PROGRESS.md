# Project Progress

## Snapshot

- Updated: 2026-07-31
- Branch: `main`
- Active milestone: M9 - B1 and B2 Manual Content Review
- Production level: A1
- Official curriculum: `public/data/a1-course-v3.csv`
- Curriculum totals: 8 units, 32 lessons, 145 word occurrences
- Pilot level: A2
- Pilot curriculum: `public/data/a2-course-v1.csv`
- Pilot totals: 4 units, 16 lessons, 95 word occurrences
- Pilot unit counts: unit 1 = 25, unit 2 = 25, unit 3 = 24, unit 4 = 21 occurrences
- B1 pilot: `public/data/b1-course-v1.csv`, 8 units, 32 lessons, 249 occurrences
- B2 pilot: `public/data/b2-course-v1.csv`, 8 units, 32 lessons, 298 occurrences
- All advanced rows and exercises: `pilot_review_required`

## Working Features

- Traditional Chinese course map with sequential unlocking.
- A-Z basics and a separate 41-symbol KK phonetic practice area.
- Per-word recall, layered hints, word details, chunk explanations, and sentence rebuild.
- Reviewed reading recognition, pattern transfer, text response, passage rebuild, and comprehension where lesson data enables them.
- Progress for lexeme, sense, sentence pattern, token, sentence, and passage stored in `localStorage`.
- Versioned curriculum overrides with validation and a restore-official-data action.
- Excel/CSV/JSON content-management export and validated import.
- Unit/level assessment, per-token review scheduling, and desktop/mobile Playwright coverage.
- GitHub Actions for context checks, build, unit tests, lint, types, and browser tests.
- A shared course catalog with independent A1/A2/B1/B2 loading and Traditional Chinese level errors.
- Advanced QA preview that does not falsely change passed levels or formal unlocks.
- Progress schema v5 with exact v3/v4 migration and isolated per-level records.
- A2 word recall, details, chunks, sentence rebuild, recognition, two transfer questions, text response, passage rebuild, and comprehension.
- A2 units 2–4 cover travel and transportation, shopping and comparison, and health and advice.
- QA preview can inspect all A2 pilot units without adding passed unit or level IDs.
- A2 has a ten-unit blueprint; units 5–10 do not exist in formal CSV/JSON.
- A main-navigation related-vocabulary reference page with keyboard activation, search, status filters, topic cards, word details, pronunciation, chunks, and usage reminders.
- Course-detail shortcuts for validated A1 topic lexemes, with current-word highlighting and exact detail-stage return.
- Complete executable B1 and B2 pilot routes with recall, details, chunks, rebuild, recognition, two transfers, response, passages, comprehension, and reload persistence.
- Project-data audit covering catalog sources, duplicate data, structural ID collisions, intentional review repetition, generator keys, and tracked artifacts.

## Latest Completed Work

- Preserved the A1 source byte-for-byte in behavior: 8 units, 32 lessons, 145 occurrences, stable IDs, and existing completion records.
- Added `course-catalog.json` plus shared curriculum types, loaders, validators, source storage, and progress helpers.
- Added the A2 unit 1 pilot with the four approved core sentences and exact four-sentence passage.
- Added reviewed A2 recognition, transfer, text-response, and comprehension data without introducing A2 unit 2.
- Added schema v3-to-v4 migration, formal A2 unlock, QA preview, per-level switching, failure isolation, and reload persistence.
- Added unit/data tests and real desktop/mobile Playwright coverage for both levels.
- Added `vocabulary-groups-v1.json` for stable topic and chunk relationships.
- Added `reference-vocabulary-v1.json` only for words missing from formal A1.
- Reused formal A1 data for Monday, Friday, night, and the existing `at-night` chunk.
- Added the days-of-week, times-of-day, months-of-year, and family-members screens without adding an A2 lesson.
- Reused formal A1 data for May, mother, brother, wife, and the existing `in-may` chunk.
- Kept the 18 newly added month and family gaps reference-only for combined user review.
- Added failure isolation so invalid related-vocabulary data does not block A1.
- Related-vocabulary cards now display canonical lemmas while formal course answers remain unchanged.
- Cross-topic search now selects the first matching topic and hides stale topic details when no result exists.
- Preserved A2 unit 1 at 4 lessons and 25 occurrences, then added 12 pilot lessons across units 2–4.
- Added one recognition, two slot-validated transfers, and one text response to every new lesson.
- Added three four-sentence passages with 14 directly supported comprehension questions, including cross-sentence questions.
- Prevented the current A2 pilot from creating an A2 level pass or exposing a B1 unlock.
- Completed the final reading-content QA for A2 units 2–4: direct transport answers, natural health questions, and distractors limited to content learned by each passage.
- Added backward-compatible per-option lexeme/chunk metadata and validation for the new A2 passage questions while preserving the legacy A1 string-option format.
- Stabilized A2 mobile Playwright setup by preloading progress and settings before React hydration, preserving test-created progress across reloads, and waiting for real A2 UI readiness.
- Added CI retention for Playwright HTML reports, screenshots, error context, and traces; GitHub Actions status remains to be confirmed after this commit is pushed.
- Added B1 with 8 units, 32 lessons, 249 occurrences, 32 recognition exercises, 64 transfers, 32 text responses, 8 passages, and 32 comprehension questions.
- Added B2 with 8 units, 32 lessons, 298 occurrences, 32 recognition exercises, 64 transfers, 32 text responses, 8 passages, and 32 comprehension questions.
- Preserved A1 at 8/32/145 and A2 at 4/16/95 with no source-row changes.
- Added schema v5 migration, B1/B2 source overrides, generic advanced loading, formal prerequisite checks, and non-mutating QA access.
- Removed the unused A1-only exercise loader after all levels adopted the shared catalog loader.
- Removed duplicate prompt/lemma dictionary keys from the B1/B2 generator and made reading distractors use previously taught sentences.
- Fixed the Windows Playwright wrapper so command-line filters are forwarded rather than silently ignored.

## Known Limits

- A2 remains a pilot and requires manual language/content QA before promotion.
- A2 units 2–4 remain `pilot_review_required` and need manual English, Taiwan Traditional Chinese, phonetic, and difficulty review.
- A2 units 5–10 are blueprint-only and have no formal course data.
- B1 and B2 require complete human English, Taiwan Traditional Chinese, phonetic, chunk, distractor, passage, and CEFR review before promotion.
- B1/B2 KK/IPA and recorded audio are not yet supplied; rows remain `audio_status=pending` and use browser fallback only.
- Related vocabulary currently contains four topics and intentionally excludes other categories.
- All 27 reference-only entries require manual phonetic/content QA before their status changes.
- Most word and sentence audio still use browser speech fallback; only KK symbol sources have open-license attribution data.
- Account login, cloud sync, microphone input, speech recognition, and pronunciation scoring are intentionally absent.
- `app/page.tsx` still owns substantial UI orchestration and should be decomposed only after behavior is protected by tests.

## Next Concrete Step

Try B1 and B2 in current Windows Chrome, then record and correct the first manual language/phonetic QA batch before promoting any content.

## Verification

- `npm run check:context`: exit 0; 10 required files passed.
- B1/B2 generator reproducibility: exit 0; 6/6 output files unchanged on a second run.
- `npm run audit:project`: exit 0; 4 levels, 787 occurrences, 12 catalog sources, 0 orphan or duplicate data files.
- `npm run validate:curriculum`: exit 0; A1 8/32/145, A2 4/16/95, B1 8/32/249, B2 8/32/298.
- `npm run build`: exit 0; Vinext production build passed.
- `npm run test:unit`: exit 0; 96 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run test:e2e`: exit 0; 46 passed across desktop and mobile, 0 failed.
- B1/B2 targeted first-lesson Playwright: exit 0; 4 passed, 0 failed.
- B1 passage and four-answer comprehension Playwright: exit 0; 2 passed, 0 failed.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
