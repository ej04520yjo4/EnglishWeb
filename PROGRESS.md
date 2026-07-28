# Project Progress

## Snapshot

- Updated: 2026-07-28
- Branch: `main`
- Active milestone: M4 - A2 Pilot Controlled Expansion
- Production level: A1
- Official curriculum: `public/data/a1-course-v3.csv`
- Curriculum totals: 8 units, 32 lessons, 145 word occurrences
- Pilot level: A2
- Pilot curriculum: `public/data/a2-course-v1.csv`
- Pilot totals: 4 units, 16 lessons, 95 word occurrences
- Pilot unit counts: unit 1 = 25, unit 2 = 25, unit 3 = 24, unit 4 = 21 occurrences

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
- A shared course catalog with independent A1/A2 loading and Traditional Chinese level errors.
- A2 QA preview that does not falsely mark A1 passed or formally unlock A2.
- Progress schema v4 with exact v3 A1 migration and isolated per-level records.
- A2 word recall, details, chunks, sentence rebuild, recognition, two transfer questions, text response, passage rebuild, and comprehension.
- A2 units 2–4 cover travel and transportation, shopping and comparison, and health and advice.
- QA preview can inspect all A2 pilot units without adding passed unit or level IDs.
- A2 has a ten-unit blueprint; units 5–10 do not exist in formal CSV/JSON.
- A main-navigation related-vocabulary reference page with keyboard activation, search, status filters, topic cards, word details, pronunciation, chunks, and usage reminders.
- Course-detail shortcuts for validated A1 topic lexemes, with current-word highlighting and exact detail-stage return.

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

## Known Limits

- A2 remains a pilot and requires manual language/content QA before promotion.
- A2 units 2–4 remain `pilot_review_required` and need manual English, Taiwan Traditional Chinese, phonetic, and difficulty review.
- A2 units 5–10 are blueprint-only and have no formal course data.
- Related vocabulary currently contains four topics and intentionally excludes other categories.
- All 27 reference-only entries require manual phonetic/content QA before their status changes.
- Most word and sentence audio still use browser speech fallback; only KK symbol sources have open-license attribution data.
- Account login, cloud sync, microphone input, speech recognition, and pronunciation scoring are intentionally absent.
- `app/page.tsx` still owns substantial UI orchestration and should be decomposed only after behavior is protected by tests.

## Next Concrete Step

Try all 16 A2 pilot lessons and manually review units 2–4 before deciding whether to create A2 unit 5.

## Verification

- `npm run check:context`: exit 0; 10 required files passed.
- `npm run build`: exit 0; Vinext production build passed.
- `npm run test:unit`: exit 0; 82 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run test:e2e`: exit 0; 40 passed across desktop and mobile, 0 failed.
- Related-vocabulary Playwright coverage: 8 passed across desktop and mobile, 0 failed.
- `npm run validate:curriculum`: exit 0; A1 145 and A2 95 occurrences across 4 units and 16 lessons.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
- EnglishWeb first-level start BAT: passed `ENGLISHWEB_CHECK_ONLY=1` execution through `cmd.exe`; no server or browser was started.
- Target A2 completion mobile test: exit 0; 1 passed, 0 failed.
- Target A2 completion mobile stability run: exit 0; 10 passed, 0 failed with no retries.
- All mobile tests using the A2 preload fixture: exit 0; 5 passed, 0 failed.
