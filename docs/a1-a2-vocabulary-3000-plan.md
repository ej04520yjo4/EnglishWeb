# A1＋A2 3000 Canonical Lexeme Plan

## Goal and Boundary

The long-term cumulative target through A2 is 3000 canonical single-word lexemes: 1500 active and 1500 receptive. The A1 cumulative checkpoint is 1200: 700 active and 500 receptive.

The user explicitly requested the full3000 catalog on2026-10-15. The product now contains3000 candidate headwords, but CEFR course completion, vocabulary coverage, human review and learner mastery remain separate. Target A1/A2 stage labels are not officialCEFR certification.

## Counting Rules

- Count one canonical `lexemeId` once across A1 and A2.
- Inflections such as `go/went`, `buy/bought`, `cheap/cheaper`, and `leave/leaves` share one lexeme.
- Different `sense_id` values for the same word, such as uses of `take`, do not create another lexeme.
- Occurrences, displayed word forms, senses, and chunks are reported separately.
- Multiword items such as `take the bus`, `have to`, and `How much` are chunks and never enter the 3000 count.
- Lesson-specific names and other proper nouns, such as Amy and Ben, remain valid course tokens but do not count toward the 3000 general-vocabulary target.

## Protected Baseline and Current Catalog

`public/data/vocabulary-targets-v1.json` is generated from existing A1, A2, and reference-only sources. The 2026-10-15 audit confirms 132 unique entries:

- 108 curriculum-covered active candidates.
- 24 reference-only receptive candidates.
- 90 entries assigned to the A1 target stage and 42 to A2.
- This v1 file remains a protected fixture, not the runtime source.

Runtime `vocabulary-targets-v2.json` copies those132 objects unchanged and adds2868 sourced canonical headwords. Total3000, active1500/receptive1500; A1-stage1200 and A2-stage1800. `vocabulary-library-v1.json` supplies meanings and explicit recognition/spelling across60 pages. Status is `count_complete_review_required`, not `complete`.

Every entry records its canonical ID, lemma, source aliases, target level, mastery target, priority, topics, source/version/reference/license, and QA status. All entries remain `pilot_review_required` until manually checked.

## Evidence and Mastery

Progress schema v6 stores global evidence by canonical lexeme across A1/A2:

- `exposed`: at least one course detail or explicitly opened reference detail.
- `receptive`: at least two correct recognition records on two different study dates.
- `active`: receptive, plus at least two clean spelling records on two dates and one correct sentence application.

Every answer attempt may record an attempt ID. A correct spelling counts as clean only when the answer was neither revealed nor pasted. Search, scrolling, audio playback, and merely rendering a card create no evidence. Opening a reference detail adds exposure only and never changes course completion, accuracy, review intervals, or passed IDs.

The existing 24 reference-only targets now have an explicit recognition trial from the related-vocabulary topic page. Each batch contains at most five words and uses existing same-topic translations. Only the first submitted answer for a canonical word on a local study date is recorded. Wrong answers show the meaning but cannot become correct evidence by reloading that day. Two correct dates can establish receptive mastery, never active mastery. Previously mastered words remain available on later dates, after unfinished words. This does not promote reference content into formal courses or approve its language/licensing.

## Source and Review Workflow

1. Select a legally reusable frequency or curriculum source.
2. Record source name, exact version, reference URL or file, and license before importing.
3. Prepare sourced candidates; the user-authorized full list is reviewed in60 small batches. Do not copy protected dictionaries or generate filler.
4. Canonicalize and deduplicate against current targets and every source alias.
5. Reject multiword lemmas and keep them in chunk data instead.
6. Assign A1/A2, active/receptive, topic, priority, and `pilot_review_required`.
7. Review English lemma, Taiwan Traditional Chinese meaning, CEFR suitability, source evidence, and license.
8. Run `npm run audit:vocabulary`, `npm run report:vocabulary`, and the full curriculum gates before merging.

The file may change to `complete` only when it contains exactly 3000 reviewed entries with exactly 1500 active and 1500 receptive targets. The A1 subset must be exactly 1200 entries（700 active、500 receptive）, every entry must have a completed human-QA status, every source license must be resolved, aliases must be unique, and priorities must be continuous.

## Commands

```powershell
node scripts/create-vocabulary-target-baseline.mjs
npm run build:vocabulary
npm run check:vocabulary-build
npm run audit:vocabulary
npm run report:vocabulary
```

The baseline generator is a projection tool, not a second runtime source. B1/B2 data must not contribute to the A1/A2 target while those levels remain disabled.

## Next Review Batch

See [the pinned source package](../data-sources/vocabulary-3000/README.md). Review the first50-word page with the learner, then proceed through the remaining59. Check chosen meanings, Taiwan wording, stage allocation, spelling prompts and ambiguous distractors. The3000 goal is a project learning target, not an officialCEFR word-count requirement. Word-library practice does not create sentence-application evidence; new active targets need reviewed application exercises later.
