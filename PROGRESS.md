# Project Progress

## Snapshot

- Updated: 2026-08-19
- Branch: `main`
- Active milestone: M10 - A1/A2 Vocabulary 3000 Foundation
- Runtime levels: A1 production and A2 pilot
- Disabled runtime data: B1/B2 retained for direct generator, audit, and structural tests
- A1: 8 units, 32 lessons, 145 occurrences
- A2: 4 units, 16 lessons, 95 occurrences
- Protected source status: one A1 article note corrected; all other A1/A2 CSV and exercise JSON content unchanged
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
- The home page now shows a deterministic daily learning plan: due review first, then the current recommended lesson, then up to three evidence-backed weak lexemes.
- The weakness center ranks only target lexemes with actual incorrect recognition, clean-spelling, or application attempts; passive exposure never creates a weakness.
- Daily learning 2.0 now runs as a resumable in-memory session: due review → one current lesson → up to three focused weakness drills → an evidence-based daily summary.
- Weakness rows can launch direct focus practice for spelling, recognition, or sentence application without changing lesson completion or CEFR unlocks.
- Lesson input UX now ignores held Enter repeats across recall, detail, transfer, passage, weakness, and assessment paths; shared boundary logic supports left/right navigation and empty-box Backspace.
- A third incorrect recall always reveals the target before the learner must retype it, including a near-miss such as `becaus` for `because`; revealed or pasted input still cannot create clean spelling evidence.
- Recall keeps the prompt and input visually primary, while post-answer detail shows the selected phonetic system and contextual part of speech before collapsed secondary metadata.
- A1 32 lessons/145 occurrences and A2 16 lessons/95 occurrences were re-audited with their transfer, recognition, response, passage, and comprehension content on 2026-08-19. Core sentences required no correction; the generic A1 `a` note was corrected so the pen occurrence no longer refers to “一本書”.
- Schema v3/v4/v5 imports migrate to v6 without inventing legacy vocabulary mastery; v6 backup export/import preserves global evidence.

## Latest Completed Work

- Returned active development to A1/A2 and paused B1/B2 manual review.
- Added target generation, validation, per-level indexes, alias resolution, audit, and coverage reporting.
- Added schema v6 global evidence wiring to course detail, word recall, reading recognition, sentence rebuild, pattern transfer, and explicit related-word details.
- Added protected-file hashes, disabled-runtime checks, canonical counting tests, mastery tests, backup/reload tests, and desktop/mobile browser coverage.
- Fixed an A2 Playwright hydration race by seeding storage before navigation and waiting for observable A2/map readiness.
- Added executable regression coverage for third-attempt near-miss reveal, cross-input boundary movement, empty-box Backspace, and Windows CRLF-safe protected-source checks.
- Removed all temporary sentence-audit workflows and UX patch helpers from the final feature tree; permanent audit scripts and CI remain.
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

- `npm ci`: exit 0; 494 packages installed and 495 audited; 18 dependency vulnerabilities reported (2 low, 16 high), with no automatic fixes applied.
- `npm audit --json`: exit 1 because the same 18 known vulnerabilities remain; 0 critical. Direct affected tools include Next, Vite, Vinext, React Server DOM, Wrangler, and the Cloudflare Vite plugin; upgrades are deferred to a dedicated compatibility pass.
- `npm run check:context`: exit 0; 10 required context files passed UTF-8 and structure checks.
- `npm run audit:project`: exit 0; 4 levels, 787 occurrences, 12 sources, 0 orphan/duplicate data files.
- `npm run audit:vocabulary`: exit 0; 126 unique targets, 100 active, 26 receptive.
- `npm run report:vocabulary`: exit 0; 102 A1/A2 union lexemes, 26 reference-only, 0 invalid target IDs, 0 target lemma conflicts.
- `npm run validate:curriculum`: exit 0; A1 8/32/145, A2 4/16/95, retained B1 8/32/249, retained B2 8/32/298.
- `npm run build`: exit 0; Vinext production build completed.
- `npm run test:unit`: exit 0; 116 passed, 0 failed.
- `npm run lint`: exit 0; 0 errors and 0 warnings.
- `npx tsc --noEmit --incremental false`: exit 0.
- `npm run test:e2e`: exit 0; 52 passed across desktop and mobile, 0 failed.
- Focused related-vocabulary evidence/backup E2E: exit 0; 10 passed.
- Focused A2 hydration/unlock E2E: exit 0; 2 passed.
- Windows launcher scenarios: exit 0; 7 passed, 0 failed.
