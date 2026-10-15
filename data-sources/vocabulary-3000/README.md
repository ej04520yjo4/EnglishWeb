# 3000-word candidate source package

## Scope

The user requested the complete 3000-word target on 2026-10-15. Runtime
`vocabulary-targets-v2.json` preserves the 132 existing v1 objects, then adds 2868
unique canonical headwords. `vocabulary-library-v1.json` supplies bilingual
meanings for all 3000. Neither file replaces the formal A1/A2 curriculum.

There are 60 batches of 50. A1-stage 1200 and A2-stage 1800 are planning allocations,
not independently verified CEFR ratings. The 1500 active / 1500 receptive split is a
learning goal, not a statement of what the learner knows. All content remains
`pilot_review_required`; KK/IPA is pending and no audio URL is invented.

## Sources and changes

`sources.json` records exact URLs, versions, SHA-256 and attribution.

1. NGSL 1.2 supplies general-frequency ordering. Its 2809 headwords are not
   themselves a CEFR list. Canonicalization combines selected inflections and
   British/American spellings and excludes already covered words.
2. WordNet 3.0 supplies selected English glosses and sense IDs. Chinese Open
   WordNet labels are joined by the same synset, not guessed from English text.
3. OpenCC-JS 1.3.1 converts cn→twp. This spelling conversion does not guarantee
   Taiwan usage, semantic correctness or naturalness.
4. `editorial-overrides.json` replaces missing or misleading primary meanings
   with short machine-assisted original glosses and Taiwan Chinese. Editorial
   replacements do not claim the old WordNet sense. Examples of repaired source
   bias include avocado as a color, pork as political spending, and noodle as
   slang for a head.
5. `supplement-lemmas.json` supplies practical additional headword candidates;
   only those with a supported source or editorial meaning enter the snapshot.
6. `baseline-meanings.json` supplies canonical meanings for the existing 132 words
   without mutating course answers, reference records or their license status.

Source selection and adapted new data are CC BY-SA 4.0, with WordNet/COW notices
retained. Original editorial additions are also CC BY-SA 4.0. Existing 132 source
objects retain their prior unresolved provenance; nothing silently relicenses
them. See [complete distribution notices](../../public/licenses/vocabulary-3000/README.md).
No Oxford/Cambridge/ECDICT content is imported. No source author endorses this
app or its candidate stage assignments.

## Reproduction

Normal offline build uses the committed lexical snapshot:

```powershell
npm run build:vocabulary
npm run check:vocabulary-build
npm run audit:vocabulary
```

To reproduce the source snapshot, with network permission:

```powershell
npm run fetch:vocabulary-source
npm run prepare:vocabulary-source
npm run build:vocabulary
```

Downloads stay in ignored `tmp/vocabulary-sources/`. A changed source hash fails
closed and preserves the existing file. The exact official WordNet archive is
extracted only after hash verification. Normal app/CI builds do not download
these sources. `build-manifest.json` records normalized-LF snapshot/editorial
hashes and generated counts. Rebuild after every editorial correction; never
edit generated runtime JSON alone.

## Quality limits and follow-up

Automated checks cover 3000 distinct IDs, 132 protected objects, continuous
priorities, one-to-one library joins, field/source completeness, 60 pages,
canonical form deduplication and reproducible bytes. Machine-assisted review
corrected clear primary-sense errors, but does not certify all 3000 definitions,
Taiwan translations, difficulty or distractors. Review each 50-word batch before
promoting QA status. Recognition options exclude known shared Chinese meaning
and shared WordNet synsets; unrecorded synonyms still require editorial review.

Practice currently provides explicit recognition and spelling. New words cannot
reach the active state without genuine sentence-application evidence from a
future reviewed exercise. Viewing a card never counts as mastery, and a wrong
first attempt cannot be repaired into same-day clean credit by reloading.
