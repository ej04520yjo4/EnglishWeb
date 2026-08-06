# Project Progress

## Snapshot

- Updated: 2026-07-31
- Branch: `feat/a1-a2-vocabulary-3000-foundation`
- Active milestone: M10 - A1/A2 Vocabulary 3000 Foundation
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A2: 4 units, 16 lessons, 95 occurrences
- Protected A1/A2 CSV and exercise JSON hashes: unchanged
- Progress schema: v6 with top-level global `vocabularyProgress`

## Vocabulary Baseline

- A1: 145 occurrences, 69 word forms, 75 senses, 15 chunks, 68 canonical lexemes.
- A2: 95 occurrences, 61 word forms, 77 senses, 30 chunks, 57 canonical lexemes.
- A1＋A2 union: 102 canonical lexemes; overlap: 23.
- Reference-only unique lexemes: 26.
- Target baseline: 126 entries; 100 active candidates and 26 receptive candidates.
- Target stage counts: A1 92, A2 34; 2874 entries remain unbuilt.
- Target status: `partial_review_required`; all entries remain `pilot_review_required`.
- Source report records one A2 source-ID/lemma projection, `me -> I`; target aliases map both to canonical `i`, with no target ID or lemma conflict.
- Lesson-specific proper names Amy and Ben remain in A1 course practice but are excluded from the 3000 general-vocabulary target.

## Working Features

- Existing A1/A2 recall, detail, chunk, sentence rebuild, recognition, transfer, response, passage, review, assessment, import/export, and responsive flows remain available.
- B1/B2 are absent from selectors, cannot be opened by advanced preview, are not fetched at startup, and are rejected by direct runtime loader calls.
- The old `showA2Pilot` setting is readable; new storage/export uses `showAdvancedPilots` and currently exposes A2 QA only.
- The partial target contract loads from `public/data/vocabulary-targets-v1.json`; target logic is isolated in `app/vocabulary-targets.ts`.
- Exposure, recognition, spelling, and application evidence is deduplicated by stable ID and shared by canonical lexeme across A1/A2.
- Receptive mastery requires two correct recognition records on different dates. Active also requires two clean spelling records on different dates and one correct application.
- Revealed or pasted spelling never creates clean spelling evidence.
- Related-vocabulary search/render/audio remains neutral; an explicit detail open records exposure only and leaves completion, accuracy, review intervals, and passed IDs unchanged.
- The progress page separates the 3000 goal, current target coverage, personal evidence-based mastery, senses, chunks, and due reviews.
- Schema v3/v4/v5 imports migrate to v6 without inventing legacy vocabulary mastery; v6 backup export/import preserves global evidence.

## Latest Completed Work

- Returned active development to A1/A2 and paused B1/B2 manual review.
- Added target generation, validation, per-level indexes, alias resolution, audit, and coverage reporting.
- Added schema v6 global evidence wiring to course detail, word recall, reading recognition, sentence rebuild, pattern transfer, and explicit related-word details.
- Added protected-file hashes, disabled-runtime checks, canonical counting tests, mastery tests, backup/reload tests, and desktop/mobile browser coverage.
- Fixed an A2 Playwright hydration race by seeding storage before navigation and waiting for observable A2/map readiness.
- Updated the roadmap, architecture, decisions, task priorities, memory, README, changelog, and B1/B2 status documentation.

## Known Limits

- The target contract is not a complete 3000-word list and must not be presented as one.
- The 126 baseline entries need manual source, license, target-level, mastery-target, and language review; the progress-page note identifies them as a待審 baseline rather than reviewed vocabulary.
- A2 units 1–4 remain pilot content; units 5–10 are blueprint-only.
- All 27 related-vocabulary reference records still need phonetic/content review; deduplication produces 26 unique reference-only target lexemes.
- B1/B2 language, phonetics, distractors, passages, and CEFR placement remain unreviewed and disabled.
- Most word/sentence audio still uses browser speech fallback.

## Next Concrete Step

Manually review the 126-entry baseline, choose one legally reusable frequency/reference source, and prepare one small deduplicated candidate batch before adding any new target entries.

## Verification

- `npm ci`: exit 0; 494 packages audited; existing report lists 15 dependency vulnerabilities (2 low, 13 high), with no forced upgrades applied.
- `npm run check:context`: exit 0; 10 required context files passed UTF-8 and structure checks.
- `npm run audit:project`: exit 0; 4 levels, 787 occurrences, 12 sources, 0 orphan/duplicate data files.
- `npm run audit:vocabulary`: exit 0; 126 unique targets, 100 active, 26 receptive.
- `npm run report:vocabulary`: exit 0; 102 A1/A2 union lexemes, 26 reference-only, 0 invalid target IDs, 0 target lemma conflicts.
- `npm run validate:curriculum`: exit 0; A1 8/32/145, A2 4/16/95, retained B1 8/32/249, retained B2 8/32/298.
- `npm run build`: exit 0; Vinext production build completed.
- `npm run test:unit`: exit 0; 108 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run test:e2e`: exit 0; 42 passed across desktop and mobile, 0 failed.
- Focused related-vocabulary evidence/backup E2E: exit 0; 10 passed.
- Focused A2 hydration/unlock E2E: exit 0; 2 passed.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
