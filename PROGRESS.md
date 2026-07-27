# Project Progress

## Snapshot

- Updated: 2026-07-27
- Branch: `feat/related-vocabulary`
- Active milestone: M6 - Related Vocabulary User Review
- Production level: A1
- Official curriculum: `public/data/a1-course-v3.csv`
- Curriculum totals: 8 units, 32 lessons, 145 word occurrences
- Pilot level: A2
- Pilot curriculum: `public/data/a2-course-v1.csv`
- Pilot totals: 1 unit, 4 lessons, 25 word occurrences

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
- Added `reference-vocabulary-v1.json` only for the nine words missing from formal A1.
- Reused formal A1 data for Monday, Friday, night, and the existing `at-night` chunk.
- Added the days-of-week and times-of-day screens without adding any other topic or A2 lesson.
- Added failure isolation so invalid related-vocabulary data does not block A1.

## Known Limits

- A2 remains a pilot and requires manual language/content QA before promotion.
- No A2 unit 2 or later content exists yet.
- Related vocabulary currently contains only two topics.
- Tuesday, Wednesday, Thursday, Saturday, Sunday, morning, noon, afternoon, and evening remain reference-only and require manual phonetic/content QA.
- Most word and sentence audio still use browser speech fallback; only KK symbol sources have open-license attribution data.
- Account login, cloud sync, microphone input, speech recognition, and pronunciation scoring are intentionally absent.
- `app/page.tsx` still owns substantial UI orchestration and should be decomposed only after behavior is protected by tests.

## Next Concrete Step

Try the related-vocabulary page and manually review its nine reference-only entries before selecting one next topic.

## Verification

- `npm run check:context`: exit 0; 10 required files passed.
- `npm run build`: exit 0; Vinext production build passed.
- `npm run test:unit`: exit 0; 63 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run test:e2e`: exit 0; 32 passed across desktop and mobile, 0 failed.
- Related-vocabulary Playwright coverage: 6 passed across desktop and mobile, 0 failed.
- `npm run validate:curriculum`: exit 0; A1 145 and A2 25 occurrences.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
- EnglishWeb first-level start BAT: passed `ENGLISHWEB_CHECK_ONLY=1` execution through `cmd.exe`; no server or browser was started.
