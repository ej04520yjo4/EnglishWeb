# Project Progress

## Snapshot

- Updated: 2026-07-27
- Branch: `main`
- Active milestone: M1 — Reviewed A1 Practice Expansion
- Production level: A1
- Official curriculum: `public/data/a1-course-v3.csv`
- Curriculum totals: 8 units, 32 lessons, 145 word occurrences

## Working Features

- Traditional Chinese course map with sequential unlocking.
- A–Z basics and a separate 41-symbol KK phonetic practice area.
- Per-word recall, layered hints, word details, chunk explanations, and sentence rebuild.
- Reviewed reading recognition, pattern transfer, text response, passage rebuild, and comprehension where lesson data enables them.
- Progress for lexeme, sense, sentence pattern, token, sentence, and passage stored in `localStorage`.
- Versioned curriculum overrides with validation and “restore official data.”
- Excel/CSV/JSON content-management export and validated import.
- Unit/level assessment, per-token review scheduling, and desktop/mobile Playwright coverage.
- GitHub Actions for build, unit tests, lint, types, and browser tests.

## Latest Completed Work

- Added the eight-file Context Engineering knowledge system and linked it from the README.
- Added and verified Windows one-click start/update launchers without changing Vinext or npm workflows.
- Verified fresh/existing dependency states, missing Node, failed install, occupied port, dirty Git, and Chinese/spaced paths.
- Confirmed the real launcher reached `http://localhost:3000` and returned a successful response.

## Known Limits

- A2–C2 have roadmap structure but no production curriculum yet.
- Most word and sentence audio still use browser speech fallback; only KK symbol sources have open-license attribution data.
- Account login, cloud sync, microphone input, speech recognition, and pronunciation scoring are intentionally absent.
- `app/page.tsx` still owns substantial UI orchestration and should be decomposed only after behavior is protected by tests.

## Next Concrete Step

Finish M1’s third reviewed exercise batch from `docs/a1-pattern-expansion-plan.md`, one pattern family at a time.

## Verification

- `npm run build`: passed.
- `npm run test:unit`: 33 passed, 0 failed.
- `npm run lint`: passed.
- `npx tsc --noEmit --incremental false`: passed.
- `npm run test:e2e`: 16 passed across desktop and mobile, 0 failed.
- Windows launcher scenarios: 7 passed, 0 failed.
